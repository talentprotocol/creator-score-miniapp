import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { InfoIcon, Rocket, HandHeart } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { PfpBorder } from "@/components/ui/pfp-border";
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
  onBoostInfoClick?: () => void;
  onOptOutBadgeClick?: () => void;
  tokenBalance?: number | null;
  tokenLoading?: boolean;
  isBoosted?: boolean; // New prop for boost status
  boostAmountUsd?: string | null; // Exact boost amount (formatted with $)
  activeCreatorsTotal?: number | null;
  isOptedOut?: boolean; // New prop for opt-out status
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
  onBoostInfoClick,
  onOptOutBadgeClick,
  tokenBalance,
  tokenLoading = false,
  isBoosted = false,
  activeCreatorsTotal = null,
  isOptedOut = false,
}: MyRewardsProps) {
  const isTop200 = rank !== undefined && rank <= 200;
  const denominator =
    activeCreatorsTotal && activeCreatorsTotal > 0 ? activeCreatorsTotal : 200;
  const topPercentNum = isTop200 && rank ? (rank / denominator) * 100 : null;
  const topPercentDisplay =
    topPercentNum !== null
      ? topPercentNum < 1
        ? Math.max(0.1, topPercentNum).toFixed(1)
        : Math.ceil(topPercentNum).toString()
      : null;

  return (
    <div className="w-full bg-brand-purple-light rounded-lg">
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
                    // Only apply opt-out styling when showing rewards (top 200 users)
                    isTop200 && isOptedOut && "text-brand-green line-through",
                    !isOptedOut && isBoosted && "text-primary",
                  )}
                >
                  {isTop200 ? rewards : score.toString()}
                </p>
                {(isTop200 || !isTop200) &&
                  (isOptedOut ? (
                    // PAY FORWARD badge (takes precedence over boost)
                    onOptOutBadgeClick ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 h-6 rounded-full px-2.5 bg-brand-green-light hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-green"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Optional: analytics
                          try {
                            posthog.capture("optout_badge_clicked", {
                              location: "my_rewards",
                            });
                          } catch {}
                          onOptOutBadgeClick();
                        }}
                        aria-label="View Pay It Forward settings"
                      >
                        <HandHeart className="h-3 w-3 text-brand-green" />
                        <span className="text-[10px] font-semibold tracking-wide">
                          PAID FORWARD
                        </span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 h-6 rounded-full px-2.5 bg-brand-green-light text-brand-green">
                        <HandHeart className="h-3 w-3 text-brand-green" />
                        <span className="text-[10px] font-semibold tracking-wide">
                          PAID FORWARD
                        </span>
                      </div>
                    )
                  ) : isBoosted ? (
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1.5 h-6 rounded-full px-2.5 focus:outline-none focus:ring-2",
                        "bg-brand-purple-light hover:bg-brand-purple-dark focus:ring-brand-purple text-brand-purple",
                      )}
                      aria-label="How to earn rewards boost"
                      onClick={(e) => {
                        e.stopPropagation();
                        posthog.capture("boost_badge_clicked", {
                          location: "my_rewards",
                        });
                        onBoostInfoClick?.();
                      }}
                    >
                      <Rocket className="h-3 w-3 text-brand-purple" />
                      <span className="text-[10px] font-semibold tracking-wide">
                        BOOSTED
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full focus:outline-none focus:ring-2",
                        "bg-muted text-muted-foreground cursor-pointer",
                      )}
                      aria-label="How to earn rewards boost"
                      onClick={(e) => {
                        e.stopPropagation();
                        posthog.capture("boost_badge_clicked", {
                          location: "my_rewards",
                        });
                        onBoostInfoClick?.();
                      }}
                    >
                      <Rocket className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {tokenLoading ? (
                  "Loading token balance..."
                ) : isBoosted ? (
                  <>
                    You’re receiving a{" "}
                    <span className="font-semibold">10%</span> boost!
                  </>
                ) : tokenBalance !== null &&
                  tokenBalance !== undefined &&
                  tokenBalance >= BOOST_CONFIG.TOKEN_THRESHOLD ? (
                  <>
                    You’re eligible for a{" "}
                    <span className="font-semibold">10%</span> boost.
                  </>
                ) : (
                  <>
                    Hold{" "}
                    <span className="font-semibold">
                      {BOOST_CONFIG.TOKEN_THRESHOLD}+ $TALENT
                    </span>{" "}
                    for a boost!
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {isTop200 ? (
                  <>
                    {rank && (
                      <>
                        Rank <span className="font-semibold">#{rank}</span> •
                        Top{" "}
                        <span className="font-semibold">
                          {topPercentDisplay}%
                        </span>{" "}
                        Creator
                      </>
                    )}
                  </>
                ) : pointsToTop200 !== undefined && pointsToTop200 !== null ? (
                  <>
                    <span className="font-semibold">
                      {pointsToTop200} points
                    </span>{" "}
                    left to earn rewards.
                  </>
                ) : (
                  "Calculating your position..."
                )}
              </p>
            </>
          )}
        </div>
        <div className="relative h-[88px] w-[88px] flex-shrink-0">
          <Avatar className="h-full w-full">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} />
            ) : (
              <AvatarFallback>{name[0]}</AvatarFallback>
            )}
          </Avatar>
          <div className="absolute inset-0 pointer-events-none">
            <PfpBorder />
          </div>
        </div>
      </div>
    </div>
  );
}
