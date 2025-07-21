import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";

interface MyRewardsProps {
  rewards: string;
  score: number;
  avatarUrl?: string;
  name: string;
  isLoading?: boolean;
  rank?: number;
  pointsToTop200?: number;
  onHowToEarnClick?: () => void;
}

export function MyRewards({
  rewards,
  score,
  avatarUrl,
  name,
  isLoading = false,
  rank,
  pointsToTop200,
  onHowToEarnClick,
}: MyRewardsProps) {
  const isTop200 = rank !== undefined && rank <= 200;

  return (
    <div className="w-full bg-purple-50 rounded-lg">
      <div className="p-6 flex justify-between items-start gap-6">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-primary">
              {isTop200 ? "Creator Score Rewards" : "Creator Score"}
            </p>
            {onHowToEarnClick && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-primary"
                onClick={onHowToEarnClick}
              >
                <InfoIcon className="h-4 w-4" />
                <span className="sr-only">How to earn</span>
              </Button>
            )}
          </div>
          {isLoading ? (
            <>
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-4 w-40" />
            </>
          ) : (
            <>
              <p className="text-3xl font-bold">
                {isTop200 ? rewards : score.toString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {isTop200
                  ? `Congrats, you're the top ${rank} creator!`
                  : pointsToTop200
                    ? `${pointsToTop200} points left to earn rewards.`
                    : "Calculating your position..."}
              </p>
            </>
          )}
        </div>
        <Avatar className="h-[88px] w-[88px] flex-shrink-0">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} />
          ) : (
            <AvatarFallback>{name[0]}</AvatarFallback>
          )}
        </Avatar>
      </div>
    </div>
  );
}
