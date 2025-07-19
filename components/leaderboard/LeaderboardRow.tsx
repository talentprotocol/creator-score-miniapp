import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardRowProps {
  rank: number | string;
  name: string;
  avatarUrl?: string;
  score: number;
  rewards: string;
  isPinned?: boolean;
  onClick?: () => void;
  rewardsLoading?: boolean;
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  rank,
  name,
  avatarUrl,
  score,
  rewards,
  isPinned = false,
  onClick,
  rewardsLoading = false,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer transition-colors",
        isPinned
          ? "rounded-lg bg-muted hover:bg-muted/80 mb-2"
          : "hover:bg-muted/50",
      )}
      onClick={onClick}
    >
      <span className="text-sm font-medium w-6">#{rank}</span>
      <Avatar className="h-8 w-8">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} />
        ) : (
          <AvatarFallback>{name[0]}</AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1">
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-muted-foreground">Creator Score: {score}</p>
      </div>
      <div className="flex flex-col items-end">
        {rewardsLoading ? (
          <Skeleton className="h-4 w-12" />
        ) : (
          <span className="text-sm font-medium">{rewards}</span>
        )}
      </div>
    </div>
  );
};
