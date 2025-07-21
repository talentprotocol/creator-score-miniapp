"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useUserCreatorScore } from "@/hooks/useUserCreatorScore";
import { useLeaderboardOptimized } from "@/hooks/useLeaderboardOptimized";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useUserResolution } from "@/hooks/useUserResolution";
import {
  CreatorScoreCard,
  TopCreatorsCard,
  PotentialRewardsCard,
  RewardsBoostsCard,
  TopSponsorsCard,
} from "@/components/home";

export default function HomePage() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const { talentUuid } = useUserResolution();
  const { creatorScore, loading: scoreLoading } = useUserCreatorScore(
    user?.fid,
  );
  const {
    top10: topCreators,
    loading: { top10: creatorsLoading },
  } = useLeaderboardOptimized();

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-xl mx-auto w-full p-4 space-y-4">
        <ErrorBoundary>
          <CreatorScoreCard score={creatorScore} loading={scoreLoading} />
        </ErrorBoundary>

        <ErrorBoundary>
          <PotentialRewardsCard score={creatorScore} loading={scoreLoading} />
        </ErrorBoundary>

        <ErrorBoundary>
          <TopCreatorsCard creators={topCreators} loading={creatorsLoading} />
        </ErrorBoundary>

        <ErrorBoundary>
          <RewardsBoostsCard talentUuid={talentUuid} fid={user?.fid} />
        </ErrorBoundary>

        <ErrorBoundary>
          <TopSponsorsCard loading={creatorsLoading} />
        </ErrorBoundary>
      </div>
    </main>
  );
}
