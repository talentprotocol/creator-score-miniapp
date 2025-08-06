import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { formatCurrency } from "@/lib/utils";

interface MyRewardsProps {
  rewards: string;
  score: number;
  avatarUrl?: string;
  name: string;
  isLoading?: boolean;
  rank?: number;
  pointsToTop200?: number;
  onHowToEarnClick?: () => void;
  tokenBalance?: number | null;
  tokenLoading?: boolean;
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
  tokenBalance,
  tokenLoading = false,
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
                onClick={onHowToEarnClick}
                className="h-5 w-5 text-muted-foreground hover:text-primary"
              >
                <Icon icon={InfoIcon} size="sm" color="muted" />
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
              {/* Token balance display */}
              {tokenBalance !== null && tokenBalance !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {tokenLoading
                    ? "Loading token balance..."
                    : tokenBalance > 0
                      ? `${formatCurrency(tokenBalance)} $TALENT`
                      : "No $TALENT tokens held"}
                </p>
              )}
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
