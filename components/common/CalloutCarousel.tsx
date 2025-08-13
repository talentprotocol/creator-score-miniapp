"use client";

import * as React from "react";
import { Callout } from "@/components/common/Callout";
import { cn } from "@/lib/utils";
import { CALLOUT_FLAGS } from "@/lib/constants";
import posthog from "posthog-js";

export interface CalloutCarouselItem {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "brand" | "muted";
  color?: "purple" | "green" | "blue" | "pink";
  href?: string;
  external?: boolean;
  onClick?: () => void;
  // Local per-item enable/disable within this carousel instance
  enabled?: boolean;
  // Presence of onClose indicates dismissible; the actual persistence/removal is handled here
  onClose?: () => void;
  // Optional season-aware storage key to persist dismissal for this item
  dismissKey?: string;
  // Optional permanent hide key (no season)
  permanentHideKey?: string;
}

interface CalloutCarouselProps {
  items: CalloutCarouselItem[];
  roundEndsAtIso: string;
  className?: string;
  onDismiss?: (id: string) => void;
  // Auto-advance interval in ms; set 0 or undefined to disable
  autoAdvanceMs?: number;
  // Whether to loop slides when swiping across edges
  loop?: boolean;
  // Server-provided persisted dismissal state (optional)
  dismissedIds?: string[];
  permanentlyHiddenIds?: string[];
  // Persist callbacks to store server-side (optional)
  onPersistDismiss?: (id: string) => void;
  onPersistPermanentHide?: (id: string) => void;
}

export function CalloutCarousel({
  items,
  roundEndsAtIso,
  className,
  onDismiss,
  autoAdvanceMs = 3000,
  loop = true,
  dismissedIds,
  permanentlyHiddenIds,
  onPersistDismiss,
  onPersistPermanentHide,
}: CalloutCarouselProps) {
  const [mounted, setMounted] = React.useState(false);
  const [closingId, setClosingId] = React.useState<string | null>(null);
  const [visible, setVisible] = React.useState<CalloutCarouselItem[]>([]);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const intervalRef = React.useRef<number | null>(null);
  const isInteractingRef = React.useRef<boolean>(false);

  // Compute filtered list on mount and when items change
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) {
      setVisible([]);
      return;
    }
    try {
      const filtered = items.filter((item) => {
        // Global flag check (id must match CALLOUT_FLAGS keys)
        if (Object.prototype.hasOwnProperty.call(CALLOUT_FLAGS, item.id)) {
          if (!CALLOUT_FLAGS[item.id as keyof typeof CALLOUT_FLAGS]) {
            return false;
          }
        }
        // Local per-item disable
        if (item.enabled === false) return false;
        // Server-persisted filters by callout id
        if (permanentlyHiddenIds && permanentlyHiddenIds.includes(item.id)) {
          return false;
        }
        if (dismissedIds && dismissedIds.includes(item.id)) {
          return false;
        }
        if (
          item.permanentHideKey &&
          localStorage.getItem(item.permanentHideKey) === "true"
        ) {
          return false;
        }
        if (item.dismissKey) {
          const key = `${item.dismissKey}:${roundEndsAtIso}`;
          if (localStorage.getItem(key) === "true") return false;
        }
        return true;
      });
      setVisible(filtered);
    } catch {
      setVisible(items);
    }
  }, [items, roundEndsAtIso, mounted, dismissedIds, permanentlyHiddenIds]);

  // Derive slides with edge clones for looping when applicable
  const hasMultiple = visible.length > 1;
  const useLoop = loop && hasMultiple;
  const slides: CalloutCarouselItem[] = React.useMemo(() => {
    if (useLoop) {
      const first = visible[0];
      const last = visible[visible.length - 1];
      return [last, ...visible, first];
    }
    return visible;
  }, [visible, useLoop]);

  // Ensure starting index is correct when slides change
  React.useEffect(() => {
    const startIndex = useLoop ? 1 : 0;
    setCurrentIndex(startIndex);
    const el = containerRef.current;
    if (el) {
      const width = el.clientWidth;
      el.scrollTo({ left: startIndex * width, behavior: "auto" });
    }
  }, [slides.length, useLoop]);

  const scrollToIndex = React.useCallback(
    (targetIndex: number, smooth = true) => {
      const el = containerRef.current;
      if (!el) return;
      const width = el.clientWidth;
      el.scrollTo({
        left: targetIndex * width,
        behavior: smooth ? "smooth" : "auto",
      });
      setCurrentIndex(targetIndex);
    },
    [],
  );

  // Handle scroll to track current index and loop jump logic
  const handleScroll = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const width = el.clientWidth || 1;
    const rawIndex = Math.round(el.scrollLeft / width);
    if (rawIndex !== currentIndex) {
      setCurrentIndex(rawIndex);
    }
    if (useLoop) {
      // Jump from clones to real slides without animation
      if (rawIndex === 0) {
        // at clone-last, jump to last real
        const lastReal = slides.length - 2;
        window.requestAnimationFrame(() => scrollToIndex(lastReal, false));
      } else if (rawIndex === slides.length - 1) {
        // at clone-first, jump to first real
        window.requestAnimationFrame(() => scrollToIndex(1, false));
      }
    }
  }, [currentIndex, slides.length, useLoop, scrollToIndex]);

  // Auto-advance interval
  React.useEffect(() => {
    if (!hasMultiple || !autoAdvanceMs || autoAdvanceMs <= 0) return;
    if (isInteractingRef.current) return;
    intervalRef.current = window.setInterval(() => {
      const next = currentIndex + 1;
      const target = useLoop ? next : Math.min(next, slides.length - 1);
      scrollToIndex(target, true);
    }, autoAdvanceMs);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    currentIndex,
    slides.length,
    useLoop,
    autoAdvanceMs,
    hasMultiple,
    scrollToIndex,
  ]);

  const handlePointerDown = () => {
    isInteractingRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  const handlePointerUp = () => {
    isInteractingRef.current = false;
  };

  if (!mounted || visible.length === 0) return null;

  const handleDismiss = (item: CalloutCarouselItem) => {
    // Analytics: generic dismissal. Specific callouts may also fire their own events upstream
    try {
      posthog.capture("callout_dismissed", { id: item.id });
    } catch {}
    // If dismissing the active slide and we have multiple, advance first
    if (hasMultiple) {
      const active = slides[currentIndex];
      if (active && active.id === item.id) {
        const next = currentIndex + 1;
        const target = useLoop ? next : Math.min(next, slides.length - 1);
        scrollToIndex(target, true);
      }
    }
    setClosingId(item.id);
    // Delay removal for a subtle fade/translate animation
    window.setTimeout(() => {
      try {
        // Prefer server persistence when callbacks are provided, otherwise fallback to localStorage
        if (onPersistPermanentHide && item.permanentHideKey) {
          onPersistPermanentHide(item.id);
        } else if (item.permanentHideKey) {
          localStorage.setItem(item.permanentHideKey, "true");
        }
        if (onPersistDismiss && item.dismissKey) {
          onPersistDismiss(item.id);
        } else if (item.dismissKey) {
          const key = `${item.dismissKey}:${roundEndsAtIso}`;
          localStorage.setItem(key, "true");
        }
      } catch {}
      setVisible((prev) => prev.filter((i) => i.id !== item.id));
      setClosingId(null);
      onDismiss?.(item.id);
    }, 200);
  };

  // Single slide: render without scroll container
  if (visible.length === 1) {
    const item = visible[0];
    return (
      <div className={cn("w-full", className)}>
        <div
          className={cn(
            "transition-all duration-200",
            closingId === item.id && "opacity-0 -translate-x-2",
          )}
        >
          <Callout
            variant={item.variant ?? "brand"}
            color={item.color}
            icon={item.icon}
            title={item.title}
            description={item.description}
            href={item.href}
            external={item.external}
            onClose={item.onClose ? () => handleDismiss(item) : undefined}
          />
        </div>
      </div>
    );
  }

  // Multi-slide scroll-snap container
  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex gap-3 overflow-x-auto snap-x snap-mandatory", // align with container padding
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        )}
        ref={containerRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {slides.map((item) => (
          <div
            key={item.id}
            className={cn(
              "min-w-full snap-start", // one slide per viewport
              "transition-all duration-200",
              closingId === item.id && "opacity-0 -translate-x-2",
            )}
          >
            <Callout
              variant={item.variant ?? "brand"}
              color={item.color}
              icon={item.icon}
              title={item.title}
              description={item.description}
              href={item.href}
              external={item.external}
              onClick={item.onClick}
              onClose={item.onClose ? () => handleDismiss(item) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
