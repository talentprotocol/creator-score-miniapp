import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { InfoIcon, Rocket } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { formatTokenAmount } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { BOOST_CONFIG } from "@/lib/constants";
import posthog from "posthog-js";

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
  isBoosted?: boolean; // New prop for boost status
  boostAmountUsd?: string | null; // Exact boost amount (formatted with $)
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
  isBoosted = false,
  boostAmountUsd = null,
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
                onClick={onHowToEarnClick}
                className="h-5 w-5 px-2 text-muted-foreground hover:text-primary"
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
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "text-3xl font-bold",
                    isBoosted && "text-primary",
                  )}
                >
                  {isTop200 ? rewards : score.toString()}
                </p>
                {isTop200 && isBoosted && (
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    aria-label="How to earn rewards boost"
                    onClick={(e) => {
                      e.stopPropagation();
                      posthog.capture("boost_badge_clicked", {
                        location: "my_rewards",
                      });
                      onHowToEarnClick?.();
                    }}
                  >
                    <Rocket className="h-3 w-3 text-purple-600" />
                  </button>
                )}
              </div>
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
                  {tokenLoading ? (
                    "Loading token balance..."
                  ) : tokenBalance >= BOOST_CONFIG.TOKEN_THRESHOLD ? (
                    <>
                      You own{" "}
                      <span className="font-semibold">
                        {formatTokenAmount(tokenBalance)} $TALENT
                      </span>{" "}
                      and are receiving{" "}
                      {isTop200 && isBoosted && boostAmountUsd ? (
                        <>
                          <span className="font-semibold">
                            {boostAmountUsd}
                          </span>{" "}
                          in rewards boost!
                        </>
                      ) : (
                        <>a rewards boost!</>
                      )}
                    </>
                  ) : (
                    <>
                      Hold at least{" "}
                      <span className="font-semibold">
                        {BOOST_CONFIG.TOKEN_THRESHOLD} $TALENT
                      </span>{" "}
                      to get a 10% rewards boost!
                    </>
                  )}
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
