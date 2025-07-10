import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface LeaderboardRowProps {
  rank: number | string;
  name: string;
  avatarUrl?: string;
  score: number;
  rewards: string;
  isPinned?: boolean;
  onClick?: () => void;
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  rank,
  name,
  avatarUrl,
  score,
  rewards,
  isPinned = false,
  onClick,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer transition-colors",
        isPinned
          ? "rounded-lg bg-purple-50 hover:bg-purple-100 mb-2"
          : "hover:bg-gray-100",
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
        <p className="text-xs text-gray-600">Creator Score: {score}</p>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium">{rewards}</span>
      </div>
    </div>
  );
};
