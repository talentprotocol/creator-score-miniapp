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
}

export function CalloutCarousel({
  items,
  roundEndsAtIso,
  className,
  onDismiss,
}: CalloutCarouselProps) {
  const [mounted, setMounted] = React.useState(false);
  const [closingId, setClosingId] = React.useState<string | null>(null);
  const [visible, setVisible] = React.useState<CalloutCarouselItem[]>([]);

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
  }, [items, roundEndsAtIso, mounted]);

  if (!mounted || visible.length === 0) return null;

  const handleDismiss = (item: CalloutCarouselItem) => {
    // Analytics: generic dismissal. Specific callouts may also fire their own events upstream
    try {
      posthog.capture("callout_dismissed", { id: item.id });
    } catch {}
    setClosingId(item.id);
    // Delay removal for a subtle fade/translate animation
    window.setTimeout(() => {
      try {
        // Persist permanent hide if provided
        if (item.permanentHideKey) {
          localStorage.setItem(item.permanentHideKey, "true");
        }
        if (item.dismissKey) {
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
            closingId === item.id && "opacity-0 translate-y-1",
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
      >
        {visible.map((item) => (
          <div
            key={item.id}
            className={cn(
              "min-w-full snap-start", // one slide per viewport
              "transition-all duration-200",
              closingId === item.id && "opacity-0 translate-y-1",
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
