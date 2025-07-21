"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import type { LeaderboardEntry } from "@/app/services/types";

interface TopCreatorsCardProps {
  creators: LeaderboardEntry[];
  loading?: boolean;
}

export function TopCreatorsCard({ creators, loading }: TopCreatorsCardProps) {
  if (loading) {
    return (
      <Card className="p-6 space-y-4">
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
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          Top Creators
        </span>
        <Link
          href="/leaderboard"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          See leaderboard
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {creators.slice(0, 3).map((creator, index) => (
          <Link
            key={creator.id}
            href={`/${creator.talent_protocol_id}`}
            className="flex items-center gap-3 group"
          >
            <span className="text-sm font-medium w-4 text-muted-foreground">
              #{index + 1}
            </span>
            <Avatar className="h-8 w-8">
              {creator.pfp ? (
                <AvatarImage src={creator.pfp} />
              ) : (
                <AvatarFallback>{creator.name[0]}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {creator.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Creator Score: {creator.score.toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
