"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SegmentedBarProps {
  title: string;
  total: number;
  segments: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  color: string; // e.g., 'green', 'pink', 'blue', 'red', etc.
  formatValue?: (value: number) => string;
  loading?: boolean;
  error?: string | null;
}

export function SegmentedBar({
  title,
  total,
  segments,
  color,
  formatValue = (value) => value.toLocaleString(),
  loading = false,
  error = null,
}: SegmentedBarProps) {
  // Generate color classes for segments
  const colorIntensities = [600, 500, 400, 300, 200, 100];

  // Get color classes for each segment
  const getSegmentColorClass = (index: number) => {
    const intensity = colorIntensities[index % colorIntensities.length];
    return `bg-${color}-${intensity}`;
  };

  if (loading) {
    return (
      <Card className="flex flex-col bg-muted rounded-xl p-6 border-0 shadow-none">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-2 w-full" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col bg-muted rounded-xl p-6 border-0 shadow-none">
        <div className="flex flex-col space-y-2">
          <span className="text-xs text-muted-foreground font-medium">
            {title}
          </span>
          <span className="text-sm text-muted-foreground">
            Failed to load data
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col bg-muted rounded-xl p-6 border-0 shadow-none">
      <div className="flex flex-col space-y-4">
        {/* Title and Total */}
        <div className="flex flex-col space-y-1">
          <span className="text-xs text-muted-foreground font-medium">
            {title}
          </span>
          <span className="text-xl font-semibold text-foreground">
            {formatValue(total)}
          </span>
        </div>

        {/* Segmented Bar */}
        <div className="w-full">
          <div className="flex h-2 bg-muted-foreground/10 rounded-full overflow-hidden">
            {segments.map((segment, index) => (
              <div
                key={`${segment.name}-${index}`}
                className={cn(
                  "h-full transition-all duration-300",
                  getSegmentColorClass(index),
                )}
                style={{ width: `${segment.percentage}%` }}
              />
            ))}
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          {segments.map((segment, index) => (
            <div
              key={`${segment.name}-${index}`}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    getSegmentColorClass(index),
                  )}
                />
                <span className="text-sm font-medium text-foreground">
                  {segment.name}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-foreground">
                  {formatValue(segment.value)}
                </span>
                <span className="text-xs text-muted-foreground font-medium min-w-[3rem] text-right">
                  {segment.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
