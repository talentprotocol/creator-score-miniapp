"use client";

import * as React from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useResolvedTalentProfile } from "@/hooks/useResolvedTalentProfile";
import { useLeaderboardData } from "@/hooks/useLeaderboardOptimized";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import {
  CreatorScoreCard,
  PotentialRewardsCard,
  RewardsBoostsCard,
} from "@/components/home";
import { TopListCard } from "@/components/common/TopListCard";
import { ACTIVE_SPONSORS } from "@/lib/constants";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";

export default function HomePage() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const { talentUuid } = useFidToTalentUuid();
  const { creatorScore, loading: scoreLoading } = useResolvedTalentProfile();

  const { entries: topCreators, loading: creatorsLoading } =
    useLeaderboardData();

  return (
    <PageContainer>
      <Section variant="content">
        <div className="space-y-4">
          <ErrorBoundary>
            <CreatorScoreCard score={creatorScore} loading={scoreLoading} />
          </ErrorBoundary>

          <ErrorBoundary>
            <PotentialRewardsCard score={creatorScore} loading={scoreLoading} />
          </ErrorBoundary>

          <ErrorBoundary>
            <TopListCard
              title="Top Creators"
              seeMoreLink="/leaderboard"
              items={topCreators.slice(0, 10).map((creator) => ({
                id: String(creator.talent_protocol_id),
                name: creator.name,
                avatarUrl: creator.pfp,
                rank: creator.rank,
                secondaryMetric: `Creator Score: ${creator.score.toLocaleString()}`,
              }))}
              loading={creatorsLoading}
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <RewardsBoostsCard talentUuid={talentUuid} fid={user?.fid} />
          </ErrorBoundary>

          <ErrorBoundary>
            <TopListCard
              title="Top Sponsors"
              seeMoreLink="/leaderboard"
              items={ACTIVE_SPONSORS.map((sponsor) => ({
                id: sponsor.id,
                name: sponsor.name,
                avatarUrl: sponsor.avatar,
                rank: sponsor.rank,
                secondaryMetric: sponsor.handle,
              }))}
              loading={creatorsLoading}
            />
          </ErrorBoundary>
        </div>
      </Section>
    </PageContainer>
  );
}
