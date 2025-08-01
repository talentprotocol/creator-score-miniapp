"use client";

import React from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { CreatorList, type CreatorItem } from "./CreatorList";
import { cn } from "@/lib/utils";

interface TopListCardProps {
  title: string;
  items: CreatorItem[];
  seeMoreLink?: string;
  onItemClick?: (item: CreatorItem) => void;
  loading?: boolean;
  className?: string;
}

export function TopListCard({
  title,
  items,
  seeMoreLink,
  onItemClick,
  loading = false,
  className,
}: TopListCardProps) {
  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        {seeMoreLink ? (
          <Link
            href={seeMoreLink}
            className="flex items-center gap-1 text-lg font-medium hover:text-foreground transition-colors"
          >
            {title}
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="text-lg font-medium">{title}</span>
        )}
      </div>

      <CreatorList items={items.slice(0, 3)} onItemClick={onItemClick} />
    </div>
  );
}
