import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { InfoIcon, HandHeart, HandCoins } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { PfpBorder } from "@/components/ui/pfp-border";
import { cn } from "@/lib/utils";
import posthog from "posthog-js";
import { useUserRewardsDecision } from "@/hooks/useUserRewardsDecision";

interface MyRewardsProps {
  rewards: string;
  score: number;
  avatarUrl?: string;
  name: string;
  isLoading?: boolean;
  rank?: number;
  onInfoClick?: () => void;
  onOptOutBadgeClick: () => void;
  talentUuid?: string | null;
}

export function MyRewards({
  rewards,
  score,
  avatarUrl,
  name,
  isLoading = false,
  rank,
  onInfoClick,
  onOptOutBadgeClick,
  talentUuid,
}: MyRewardsProps) {
  const isTop200 =
    rank !== undefined && (rank === -1 || (rank > 0 && rank <= 200));

  // Get rewards decision status
  const {
    data: { rewardsDecision },
  } = useUserRewardsDecision(talentUuid || null);

  return (
    <div className="w-full bg-brand-purple-light rounded-lg">
      <div className="p-6 flex justify-between items-start gap-6">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-primary">
              Creator Score Rewards
            </p>
            {onInfoClick && (
              <Button
                variant="ghost"
                onClick={onInfoClick}
                className="h-5 w-5 px-2 text-muted-foreground hover:text-primary"
              >
                <Icon icon={InfoIcon} size="sm" color="muted" />
                <span className="sr-only">Rewards information</span>
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
                    rewardsDecision === "opted_out" &&
                      "text-brand-green line-through",
                  )}
                >
                  {rewards}
                </p>
                {rewardsDecision === "opted_out" && (
                  // PAY FORWARD badge
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 h-6 rounded-full px-2.5 bg-brand-green-light hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-green"
                    onClick={(e) => {
                      e.stopPropagation();
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
                )}
                {rewardsDecision === "opted_in" && (
                  // OPTED IN badge
                  <div className="inline-flex items-center gap-1.5 h-6 rounded-full px-2.5 bg-brand-blue-light text-brand-blue">
                    <HandCoins className="h-3 w-3 text-brand-blue" />
                    <span className="text-[10px] font-semibold tracking-wide">
                      OPTED IN
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isTop200 ? (
                  <>
                    You&apos;re a TOP200 creator!
                    <br />
                    Your Creator Score is {score.toLocaleString()}.
                  </>
                ) : (
                  `Your Creator Score is ${score.toLocaleString()}.`
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
