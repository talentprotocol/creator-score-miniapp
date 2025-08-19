"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatCard } from "@/components/common/StatCard";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { Button } from "@/components/ui/button";
import {
  formatNumberWithSuffix,
  formatCompactNumber,
  calculateTotalFollowers,
  detectClient,
  openExternalUrl,
} from "@/lib/utils";
import { processCreatorCategories } from "@/lib/credentialUtils";
import { useProfileActions } from "@/hooks/useProfileActions";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";
import { Callout } from "@/components/common/Callout";
import { Share, RotateCcw, Loader2, AtSign } from "lucide-react";
import { ProfileProvider, useProfileContext } from "@/contexts/ProfileContext";
import { ShareStatsModal } from "@/components/modals/ShareStatsModal";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

import { ButtonFullWidth } from "@/components/ui/button-full-width";

interface ProfileData {
  creatorScore: number | undefined;
  lastCalculatedAt: string | null;
  calculating: boolean;
  socialAccounts: unknown[];
  totalEarnings: number | undefined;
  rank: number | null;
  posts: unknown[];
  yearlyData: { year: number; months: number[]; total: number }[];
  credentials: unknown[];
  earningsBreakdown: { totalEarnings: number; segments: unknown[] };
}

interface ProfileLayoutContentProps {
  talentUUID: string;
  identifier: string;
  children: React.ReactNode;
  profile: unknown | null; // Profile from server-side
  profileData: ProfileData; // All profile data from server-side
}

function ProfileLayoutContentInner({
  talentUUID,
  identifier,
  children,
}: {
  talentUUID: string;
  identifier: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { profile, profileData, refetchScore } = useProfileContext();
  const { context } = useMiniKit();
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const posthog = usePostHog();
  const [client, setClient] = React.useState<string | null>(null);

  // Extract data from server-fetched profileData
  const {
    creatorScore,
    lastCalculatedAt,
    calculating,
    socialAccounts,
    totalEarnings,
    rank,
  } = profileData;

  // No loading states needed - data comes from server
  const scoreLoading = false;
  const earningsLoading = false;

  // Calculate total followers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalFollowers = calculateTotalFollowers(socialAccounts as any);

  // Check if user has score
  const hasNoScore = !creatorScore || creatorScore === 0;

  // Use profile actions hook for buttons and user logic
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isOwnProfile,
    isCalculatingOrRefreshing,
    isInCooldown,
    buttonText,
    pendingText,
    failedText,
    refreshError,
    handleRefreshScore,
  } = useProfileActions({
    talentUUID,
    refetchScore,
    profile,
    creatorScore,
    lastCalculatedAt,
    calculating,
    totalFollowers,
    totalEarnings,
  });

  useEffect(() => {
    detectClient(context).then((client) => {
      setClient(client);
    });
  }, [context]);

  // Main share stats handler - detects environment and either opens modal or shares directly
  const handleShareStats = React.useCallback(async () => {
    // Track share stats click
    posthog?.capture("profile_share_stats_clicked", {
      creator_score: creatorScore,
      total_earnings: totalEarnings,
      total_followers: totalFollowers,
      is_own_profile: isOwnProfile,
      has_score: !hasNoScore,
      rank,
    });

    let localClient = client;
    if (!localClient) {
      localClient = await detectClient(context);
      setClient(localClient);
    }

    // Always show modal, regardless of client type
    setIsShareModalOpen(true);
  }, [
    context,
    creatorScore,
    totalFollowers,
    totalEarnings,
    isOwnProfile,
    hasNoScore,
    rank,
    posthog,
    client,
  ]);

  // Handle Farcaster sharing from modal (browser only)
  const handleShareFarcaster = React.useCallback(() => {
    const scoreText = creatorScore ? creatorScore.toLocaleString() : "—";
    const followersText = formatCompactNumber(totalFollowers || 0);
    const earningsText = totalEarnings
      ? formatNumberWithSuffix(totalEarnings)
      : "—";

    // Get creator type from credentials
    const categoryData = profileData?.credentials
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        processCreatorCategories(profileData.credentials as any)
      : null;
    const creatorType = categoryData?.primaryCategory?.name || "Creator";
    const creatorEmoji = categoryData?.primaryCategory?.emoji || "👤";

    // Get rank text
    const rankText = rank ? `#${rank.toLocaleString()}` : "—";

    const farcasterHandle = profile?.fname || "creator";
    const profileUrl = `https://creatorscore.app/${encodeURIComponent(farcasterHandle)}`;

    const farcasterShareText = `Check @${farcasterHandle}'s creator stats:\n\n${creatorEmoji} ${creatorType} • 👥 ${followersText} followers\n📊 Score: ${scoreText} • Rank: ${rankText}\n💰 Earnings: ${earningsText}\n\nCheck your Creator Score by @Talent 👇`;

    // Open Farcaster web app with pre-filled cast
    const farcasterUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(farcasterShareText)}&embeds[]=${encodeURIComponent(profileUrl)}`;

    if (client === "browser") {
      window.open(farcasterUrl, "_blank");
    } else {
      openExternalUrl(farcasterUrl, null, client);
    }

    // Track modal share
    posthog?.capture("profile_share_completed", {
      platform: "farcaster",
      method: "modal",
      creator_score: creatorScore,
      total_earnings: totalEarnings,
      total_followers: totalFollowers,
      is_own_profile: isOwnProfile,
    });
  }, [
    profile,
    creatorScore,
    totalFollowers,
    totalEarnings,
    isOwnProfile,
    profileData,
    rank,
    posthog,
    client,
  ]);

  // Handle Twitter sharing from modal (browser only)
  const handleShareTwitter = React.useCallback(() => {
    const scoreText = creatorScore ? creatorScore.toLocaleString() : "—";
    const followersText = formatCompactNumber(totalFollowers || 0);
    const earningsText = totalEarnings
      ? formatNumberWithSuffix(totalEarnings)
      : "—";

    // Get creator type from credentials
    const categoryData = profileData?.credentials
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        processCreatorCategories(profileData.credentials as any)
      : null;
    const creatorType = categoryData?.primaryCategory?.name || "Creator";
    const creatorEmoji = categoryData?.primaryCategory?.emoji || "👤";

    // Get rank text
    const rankText = rank ? `#${rank.toLocaleString()}` : "—";

    const displayName = profile?.display_name || profile?.name || "Creator";
    const farcasterHandle = profile?.fname || "creator";
    const profileUrl = `https://creatorscore.app/${encodeURIComponent(farcasterHandle)}`;

    const twitterShareText = `Check ${displayName}'s creator stats:\n\n${creatorEmoji} ${creatorType} • 👥 ${followersText} followers\n📊 Score: ${scoreText} • Rank: ${rankText}\n💰 Earnings: ${earningsText}\n\nCheck your Creator Score by @TalentProtocol 👇`;

    // Open Twitter web app with pre-filled tweet
    const twitterUrl = `https://x.com/intent/post?text=${encodeURIComponent(twitterShareText)}&url=${encodeURIComponent(profileUrl)}`;
    if (client === "browser") {
      window.open(twitterUrl, "_blank");
    } else {
      openExternalUrl(twitterUrl, null, client);
    }

    // Track modal share
    posthog?.capture("profile_share_completed", {
      platform: "twitter",
      method: "modal",
      creator_score: creatorScore,
      total_earnings: totalEarnings,
      total_followers: totalFollowers,
      is_own_profile: isOwnProfile,
    });
  }, [
    profile,
    creatorScore,
    totalFollowers,
    totalEarnings,
    isOwnProfile,
    profileData,
    rank,
    posthog,
    client,
  ]);

  // Profile data comes from server-side, no loading state needed
  if (!profile) {
    return (
      <PageContainer>
        <Section variant="content">
          <Callout>
            <strong>Error loading profile:</strong> Profile not found
          </Callout>
        </Section>
      </PageContainer>
    );
  }

  if (!profileData) {
    return (
      <PageContainer>
        <Section variant="content">
          <Callout>
            <strong>Error loading profile data:</strong> No data available
          </Callout>
        </Section>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header section */}
      <Section variant="header">
        <ProfileHeader
          followers={formatCompactNumber(totalFollowers)}
          displayName={profile.display_name || undefined}
          profileImage={profile.image_url || undefined}
          bio={profile.bio || undefined}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          socialAccounts={socialAccounts as any}
          talentUUID={talentUUID}
          isOwnProfile={!!isOwnProfile}
          hasCreatorScore={!hasNoScore}
          rank={rank || undefined}
        />

        {/* Action buttons - show for all profiles */}
        <div className="flex flex-row gap-4 w-full mt-6">
          <Button
            onClick={handleShareStats}
            variant="brand-purple"
            className="flex-1"
          >
            <Share className="w-4 h-4 mr-2" />
            Share Stats
          </Button>
          <Button
            onClick={handleRefreshScore}
            variant="default"
            className={`flex-1 ${
              refreshError ? "text-red-700 hover:border-red-400" : ""
            }`}
            disabled={
              isCalculatingOrRefreshing || !!refreshError || isInCooldown
            }
          >
            {isCalculatingOrRefreshing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {pendingText}
              </>
            ) : refreshError ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                {failedText}
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                {buttonText}
              </>
            )}
          </Button>
        </div>

        {/* Profile stat cards */}
        <div className="flex flex-row gap-4 w-full mt-6">
          <StatCard
            title="Total Earnings"
            value={
              earningsLoading
                ? "—"
                : totalEarnings === undefined
                  ? "—"
                  : formatNumberWithSuffix(totalEarnings)
            }
            onClick={() => {
              router.push(`/${identifier}/stats`);
            }}
          />
          <StatCard
            title="Creator Score"
            value={scoreLoading ? "—" : (creatorScore?.toLocaleString() ?? "—")}
            onClick={() => {
              router.push(`/${identifier}/score`);
            }}
          />
        </div>

        {/* Increase Score Callout - Only show for own profile */}
        {isOwnProfile && !hasNoScore && (
          <div className="mt-4">
            <ButtonFullWidth
              variant="brand-purple"
              icon={<AtSign className="h-4 w-4" />}
              align="left"
              href="/settings"
              onClick={() => {
                posthog?.capture("profile_connect_accounts_clicked", {
                  creator_score: creatorScore,
                  total_earnings: totalEarnings,
                  total_followers: totalFollowers,
                  is_own_profile: isOwnProfile,
                  has_score: !hasNoScore,
                  rank,
                });
              }}
            >
              Connect accounts to increase your Creator Score
            </ButtonFullWidth>
          </div>
        )}
      </Section>

      {/* Full width tabs */}
      <Section variant="full-width">
        <ProfileTabs talentUUID={talentUUID} identifier={identifier} />
      </Section>

      {/* Content section */}
      <Section variant="content" animate>
        {children}
      </Section>

      {/* Share Stats Modal */}
      <ShareStatsModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        talentUUID={talentUUID}
        handle={profile?.fname || identifier}
        onShareFarcaster={handleShareFarcaster}
        onShareTwitter={handleShareTwitter}
        appClient={client}
        disableTwitter={client !== "browser"} // Disable Twitter button in non-browser contexts
      />
    </PageContainer>
  );
}

// Export the main component that wraps with ProfileProvider
export function ProfileLayoutContent({
  talentUUID,
  identifier,
  children,
  profile,
  profileData,
}: ProfileLayoutContentProps) {
  return (
    <ProfileProvider
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile={profile as any}
      talentUUID={talentUUID}
      identifier={identifier}
      profileData={profileData}
    >
      <ProfileLayoutContentInner
        talentUUID={talentUUID}
        identifier={identifier}
      >
        {children}
      </ProfileLayoutContentInner>
    </ProfileProvider>
  );
}
