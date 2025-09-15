"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DualMetricStatCardProps {
  title: string;
  primaryValue: string | number;
  primaryLabel: string;
  secondaryValue: string | number;
  secondaryLabel: string;
  loading?: boolean;
}

export function DualMetricStatCard({
  title,
  primaryValue,
  primaryLabel,
  secondaryValue,
  secondaryLabel,
  loading = false,
}: DualMetricStatCardProps) {
  if (loading) {
    return (
      <Card className="flex flex-col bg-muted rounded-xl p-4 min-w-0 flex-1 border-0 shadow-none">
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-12 mb-1" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-3 w-8" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col bg-muted rounded-xl p-4 min-w-0 flex-1 border-0 shadow-none">
      <span className="text-xs text-muted-foreground font-medium mb-2">
        {title}
      </span>

      {/* Primary Metric */}
      <div className="mb-2">
        <span className="text-2xl font-bold leading-tight">{primaryValue}</span>
        <span className="text-xs text-muted-foreground ml-1">
          {primaryLabel}
        </span>
      </div>

      {/* Secondary Metric */}
      <div>
        <span className="text-sm font-medium text-muted-foreground">
          {secondaryValue}
        </span>
        <span className="text-xs text-muted-foreground ml-1">
          {secondaryLabel}
        </span>
      </div>
    </Card>
  );
}
