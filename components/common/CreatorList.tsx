"use client";

import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface CreatorItem {
  id: string;
  name: string;
  avatarUrl?: string;
  rank?: number;
  primaryMetric?: string;
  primaryMetricLoading?: boolean; // New prop for partial loading
  secondaryMetric?: string; // e.g., "Creator Score: 5,230"
  badge?: React.ReactNode; // Optional badge (e.g., rocket for boosted users)
  primaryMetricVariant?: "default" | "brand-purple" | "brand-green" | "muted"; // New prop for styling variants
  isOptedOut?: boolean; // New prop for opt-out styling
}

interface CreatorListProps {
  items: CreatorItem[];
  onItemClick?: (item: CreatorItem) => void;
  loading?: boolean;
  primaryMetricLoading?: boolean;
  pinnedIndex?: number;
  className?: string;
}

export function CreatorList({
  items,
  onItemClick,
  loading = false,
  primaryMetricLoading = false,
  pinnedIndex,
  className,
}: CreatorListProps) {
  if (loading && items.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <p className="text-sm">No items found</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="bg-background rounded-xl border border-input overflow-hidden">
        {items.map((item, index) => {
          // Use global primaryMetricLoading if item doesn't have its own
          const itemPrimaryMetricLoading =
            item.primaryMetricLoading ?? primaryMetricLoading;

          return (
            <div key={item.id}>
              <div
                className={cn(
                  "flex items-center gap-3 p-3 transition-colors cursor-pointer hover:bg-muted active:bg-muted/80",
                  pinnedIndex === index ? "bg-secondary" : "",
                  onItemClick && "cursor-pointer",
                )}
                onClick={() => onItemClick?.(item)}
              >
                {/* Rank (optional) */}
                {item.rank !== undefined && (
                  <span className="text-sm font-medium w-6">#{item.rank}</span>
                )}

                {/* Avatar */}
                <Avatar className="h-8 w-8">
                  {item.avatarUrl ? (
                    <AvatarImage src={item.avatarUrl} />
                  ) : (
                    <AvatarFallback>{item.name[0]}</AvatarFallback>
                  )}
                </Avatar>

                {/* Name and secondary metric */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate leading-tight">
                    {item.name}
                  </p>
                  {item.secondaryMetric && (
                    <p className="text-xs text-muted-foreground">
                      {item.secondaryMetric}
                    </p>
                  )}
                </div>

                {/* Primary metric and badge */}
                {(item.primaryMetric || itemPrimaryMetricLoading) && (
                  <div className="flex items-center gap-2">
                    {item.badge && item.badge}
                    <div className="flex flex-col items-end">
                      {itemPrimaryMetricLoading ? (
                        <Skeleton className="h-4 w-12" />
                      ) : (
                        <span
                          className={cn(
                            "text-sm font-medium",
                            item.primaryMetricVariant === "brand-purple" &&
                              "text-brand-purple",
                            item.primaryMetricVariant === "brand-green" &&
                              "text-brand-green",
                            item.primaryMetricVariant === "muted" &&
                              "text-muted-foreground",
                            // Add strikethrough for opted-out users
                            item.isOptedOut && "line-through",
                          )}
                        >
                          {item.primaryMetric}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {index < items.length - 1 && <div className="h-px bg-border" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
