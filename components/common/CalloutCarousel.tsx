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
  variant?:
    | "brand-purple"
    | "brand-green"
    | "brand-blue"
    | "brand-pink"
    | "muted";
  href?: string;
  external?: boolean;
  onClick?: () => void;
  // Local per-item enable/disable within this carousel instance
  enabled?: boolean;
  // Presence of onClose indicates dismissible; the actual persistence/removal is handled here
  onClose?: () => void;
  // Optional permanent hide key (no season)
  permanentHideKey?: string;
}

interface CalloutCarouselProps {
  items: CalloutCarouselItem[];
  roundEndsAtIso?: string; // Optional since we no longer use seasonal dismissal
  className?: string;
  onDismiss?: (id: string) => void;
  // Auto-advance interval in ms; set 0 or undefined to disable
  autoAdvanceMs?: number;
  // Server-provided persisted permanent hide state (optional)
  permanentlyHiddenIds?: string[];
  // Persist callback to store server-side (optional)
  onPersistPermanentHide?: (id: string) => void;
  // Visual indicator (dots)
  showDots?: boolean;
}

export function CalloutCarousel({
  items,
  roundEndsAtIso,
  className,
  onDismiss,
  autoAdvanceMs = 3000,
  permanentlyHiddenIds,
  onPersistPermanentHide,
  showDots = true,
}: CalloutCarouselProps) {
  const [mounted, setMounted] = React.useState(false);
  const [closingId, setClosingId] = React.useState<string | null>(null);
  const [visible, setVisible] = React.useState<CalloutCarouselItem[]>([]);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const intervalRef = React.useRef<number | null>(null);
  const isInteractingRef = React.useRef<boolean>(false);
  const [cycle, setCycle] = React.useState<number>(0);
  const [autoDirection, setAutoDirection] = React.useState<1 | -1>(1);
  const animRef = React.useRef<number | null>(null);
  const isAnimatingRef = React.useRef<boolean>(false);

  // Effective horizontal stride: container width plus horizontal gap
  const getSlideStride = React.useCallback((el: HTMLDivElement) => {
    const width = el.clientWidth;
    let gap = 0;
    try {
      const cs = window.getComputedStyle(el);
      const colGapStr =
        cs.getPropertyValue("column-gap") || cs.getPropertyValue("gap") || "0";
      const colGap = parseFloat(colGapStr);
      if (!Number.isNaN(colGap)) gap = colGap;
    } catch {}
    return width + gap;
  }, []);

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
        if (
          item.permanentHideKey &&
          localStorage.getItem(item.permanentHideKey) === "true"
        ) {
          return false;
        }
        return true;
      });
      setVisible(filtered);
    } catch {
      setVisible(items);
    }
  }, [items, roundEndsAtIso, mounted, permanentlyHiddenIds]);

  // Derive slides (no looping)
  const hasMultiple = visible.length > 1;
  const slides: CalloutCarouselItem[] = React.useMemo(() => visible, [visible]);

  // Ensure starting index is correct when slides change
  React.useEffect(() => {
    const startIndex = 0;
    setCurrentIndex(startIndex);
    const el = containerRef.current;
    if (el) {
      const stride = getSlideStride(el);
      el.scrollTo({ left: startIndex * stride, behavior: "auto" });
    }
  }, [slides.length, getSlideStride]);

  const scrollToIndex = React.useCallback(
    (targetIndex: number, smooth = true) => {
      const el = containerRef.current;
      if (!el) return;
      const stride = getSlideStride(el);
      el.scrollTo({
        left: targetIndex * stride,
        behavior: smooth ? "smooth" : "auto",
      });
      setCurrentIndex(targetIndex);
    },
    [getSlideStride],
  );

  // rAF-based animated scroll for controlled duration (used for auto-advance)
  const animateToIndex = React.useCallback(
    (targetIndex: number, durationMs = 500) => {
      const el = containerRef.current;
      if (!el) return;
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      // Disable scroll snap during programmatic animation to avoid instant snapping
      const previousSnap = el.style.scrollSnapType;
      el.style.scrollSnapType = "none";
      isAnimatingRef.current = true;
      const stride = getSlideStride(el);
      const startLeft = el.scrollLeft;
      const endLeft = targetIndex * stride;
      const distance = endLeft - startLeft;
      const startTime = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / durationMs);
        // ease-in-out cubic
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        el.scrollLeft = startLeft + distance * ease;
        if (t < 1) {
          animRef.current = requestAnimationFrame(step);
        } else {
          animRef.current = null;
          setCurrentIndex(targetIndex);
          // Restore scroll snap
          el.style.scrollSnapType = previousSnap;
          // Ensure exact alignment at the end of animation
          el.scrollLeft = endLeft;
          // Next-frame hard align in case of subpixel rounding or layout changes
          requestAnimationFrame(() => {
            try {
              const strideNow = getSlideStride(el) || stride;
              el.scrollTo({ left: targetIndex * strideNow, behavior: "auto" });
            } catch {}
          });
          isAnimatingRef.current = false;
        }
      };
      animRef.current = requestAnimationFrame(step);
    },
    [getSlideStride],
  );

  // Handle scroll to track current index
  const handleScroll = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (isAnimatingRef.current) return;
    const stride = getSlideStride(el) || 1;
    const rawIndex = Math.round(el.scrollLeft / stride);
    if (rawIndex !== currentIndex) {
      setCurrentIndex(rawIndex);
    }
  }, [currentIndex, getSlideStride]);

  // Auto-advance interval (disabled by default)
  React.useEffect(() => {
    if (!hasMultiple || !autoAdvanceMs || autoAdvanceMs <= 0) return;
    if (isInteractingRef.current) return;

    intervalRef.current = window.setInterval(() => {
      const lastIndex = slides.length - 1;
      let dir = autoDirection;
      let next = currentIndex + dir;
      if (next > lastIndex) {
        dir = -1;
        next = currentIndex - 1;
      } else if (next < 0) {
        dir = 1;
        next = currentIndex + 1;
      }
      setAutoDirection(dir);
      const target = Math.max(0, Math.min(lastIndex, next));
      animateToIndex(target, 1000);
    }, autoAdvanceMs);
    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    currentIndex,
    slides.length,
    autoAdvanceMs,
    hasMultiple,
    animateToIndex,
    cycle,
    autoDirection,
  ]);

  const handlePointerDown = () => {
    isInteractingRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    const el = containerRef.current;
    if (el) {
      el.style.scrollSnapType = "";
    }
    isAnimatingRef.current = false;
  };
  const handlePointerUp = () => {
    isInteractingRef.current = false;
    // trigger restart of timers
    setCycle((c) => c + 1);
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
        const target = Math.min(next, slides.length - 1);
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
            "transition-all duration-500",
            closingId === item.id && "opacity-0 -translate-x-2",
          )}
        >
          <Callout
            variant={item.variant ?? "brand-purple"}
            icon={item.icon}
            title={item.title}
            description={item.description}
            href={item.href}
            external={item.external}
            onClick={item.onClick}
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
              "transition-all duration-500",
              closingId === item.id && "opacity-0 -translate-x-2",
            )}
          >
            <Callout
              variant={item.variant ?? "brand-purple"}
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
      {showDots && hasMultiple && (
        <div
          className="mt-2 flex items-center justify-center gap-1.5"
          aria-hidden
        >
          {visible.map((_, i) => {
            const isActive = i === currentIndex;
            return (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isActive ? "bg-foreground/70" : "bg-muted-foreground/30",
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
