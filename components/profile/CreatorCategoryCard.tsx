"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatorCategory } from "@/hooks/useCreatorCategory";
import { getCompletionColorClass } from "@/lib/credentialUtils";

interface CreatorCategoryCardProps {
  talentUUID: string;
}

export function CreatorCategoryCard({
  talentUUID,
  lastCalculatedAt,
}: CreatorCategoryCardProps & { lastCalculatedAt?: string | null }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data, loading, error } = useCreatorCategory(talentUUID);

  // If score was never calculated, don't show creator type
  const hasNoScore = lastCalculatedAt === null;

  if (loading) {
    return (
      <Card className="flex flex-col bg-muted rounded-xl p-6 border-0 shadow-none">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
      </Card>
    );
  }

  if (hasNoScore || error || !data) {
    return (
      <Card className="flex flex-col bg-muted rounded-xl p-6 border-0 shadow-none">
        <div className="flex flex-col space-y-2">
          <span className="text-xs text-muted-foreground font-medium">
            Creator Type
          </span>
          <span className="text-sm text-muted-foreground">
            No data available
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col bg-muted rounded-xl p-6 border-0 shadow-none">
      <div className="flex flex-col space-y-4">
        {/* Title and Primary Category */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground font-medium">
              Creator Type
            </span>
            <span className="text-xl font-semibold text-foreground">
              {data.primaryCategory.name} {data.primaryCategory.emoji}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2 text-muted-foreground"
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Expandable Category Breakdown */}
        {isExpanded && (
          <div className="space-y-3">
            {data.categories.map((category) => (
              <div key={category.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {category.name} {category.emoji}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {category.points}/{category.maxPoints} pts (
                    {category.completionPercentage.toFixed(0)}% complete)
                  </span>
                </div>
                <div className="w-full bg-muted-foreground/10 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${getCompletionColorClass(category.completionPercentage)}`}
                    style={{ width: `${category.completionPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
