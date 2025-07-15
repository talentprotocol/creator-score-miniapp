import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SearchResultRowProps {
  name: string;
  avatarUrl?: string;
  score: number;
  onClick?: () => void;
}

export const SearchResultRow: React.FC<SearchResultRowProps> = ({
  name,
  avatarUrl,
  score,
  onClick,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-gray-100",
      )}
      onClick={onClick}
    >
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
    </div>
  );
};
