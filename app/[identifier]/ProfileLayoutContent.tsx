"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatCard } from "@/components/common/StatCard";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { Button } from "@/components/ui/button";
import {
  formatNumberWithSuffix,
  formatK,
  calculateTotalFollowers,
  detectClient,
} from "@/lib/utils";
import { useProfileActions } from "@/hooks/useProfileActions";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";
import { Callout } from "@/components/common/Callout";
import { Share, RotateCcw, Loader2 } from "lucide-react";
import { ProfileProvider, useProfileContext } from "@/contexts/ProfileContext";
import { ShareStatsModal } from "@/components/modals/ShareStatsModal";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

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

  // Main share stats handler - detects environment and either opens modal or shares directly
  const handleShareStats = React.useCallback(async () => {
    const client = await detectClient(context);

    if (client === "browser") {
      // In browser, open the modal for user to choose
      setIsShareModalOpen(true);
    } else {
      // In Farcaster or Base app, use native composeCast directly
      const scoreText = creatorScore ? creatorScore.toLocaleString() : "—";
      const followersText = formatK(totalFollowers || 0);
      const earningsText = totalEarnings
        ? formatNumberWithSuffix(totalEarnings)
        : "—";

      const farcasterHandle = profile?.fname || "creator";
      const profileUrl = `https://creatorscore.app/${encodeURIComponent(farcasterHandle)}`;

      const farcasterShareText = `Check @${farcasterHandle}'s reputation as an onchain creator:\n\n📊 Creator Score: ${scoreText}\n🫂 Total Followers: ${followersText}\n💰 Total Earnings: ${earningsText}\n\nSee the full profile in the Creator Score mini app, built by @talent 👇`;

      try {
        const { sdk } = await import("@farcaster/frame-sdk");

        const limitedEmbeds = [profileUrl] as [] | [string] | [string, string];

        await sdk.actions.composeCast({
          text: farcasterShareText,
          embeds: limitedEmbeds,
        });
      } catch (error) {
        console.error("Failed to compose cast:", error);
      }
    }
  }, [context, creatorScore, totalFollowers, totalEarnings, profile]);

  // Handle Farcaster sharing from modal (browser only)
  const handleShareFarcaster = React.useCallback(() => {
    const scoreText = creatorScore ? creatorScore.toLocaleString() : "—";
    const followersText = formatK(totalFollowers || 0);
    const earningsText = totalEarnings
      ? formatNumberWithSuffix(totalEarnings)
      : "—";

    const farcasterHandle = profile?.fname || "creator";
    const profileUrl = `https://creatorscore.app/${encodeURIComponent(farcasterHandle)}`;

    const farcasterShareText = `Check @${farcasterHandle}'s reputation as an onchain creator:\n\n📊 Creator Score: ${scoreText}\n🫂 Total Followers: ${followersText}\n💰 Total Earnings: ${earningsText}\n\nSee the full profile in the Creator Score mini app, built by @talent 👇`;

    // Open Farcaster web app with pre-filled cast
    const farcasterUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(farcasterShareText)}&embeds[]=${encodeURIComponent(profileUrl)}`;
    window.open(farcasterUrl, "_blank");
  }, [profile, creatorScore, totalFollowers, totalEarnings]);

  // Handle Twitter sharing from modal (browser only)
  const handleShareTwitter = React.useCallback(() => {
    const scoreText = creatorScore ? creatorScore.toLocaleString() : "—";
    const followersText = formatK(totalFollowers || 0);
    const earningsText = totalEarnings
      ? formatNumberWithSuffix(totalEarnings)
      : "—";

    const displayName = profile?.display_name || profile?.name || "Creator";
    const farcasterHandle = profile?.fname || "creator";
    const profileUrl = `https://creatorscore.app/${encodeURIComponent(farcasterHandle)}`;

    const twitterShareText = `Check ${displayName}'s onchain creator stats:\n\n📊 Creator Score: ${scoreText}\n🫂 Total Followers: ${followersText}\n💰 Total Earnings: ${earningsText}\n\nTrack your reputation in the Creator Score App, built by @TalentProtocol 👇`;

    // Open Twitter web app with pre-filled tweet
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterShareText)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(twitterUrl, "_blank");
  }, [profile, creatorScore, totalFollowers, totalEarnings]);

  // Profile data comes from server-side, no loading state needed
  if (!profile) {
    return (
      <PageContainer noPadding>
        <Section variant="content">
          <Callout>
            <strong>Error loading profile:</strong> Profile not found
          </Callout>
        </Section>
      </PageContainer>
    );
  }

  return (
    <PageContainer noPadding>
      {/* Header section */}
      <Section variant="header">
        <ProfileHeader
          followers={formatK(totalFollowers)}
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
            variant="special"
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
            <Callout variant="brand" href="/settings">
              Connect accounts to increase your Creator Score
            </Callout>
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

      {/* Share Stats Modal - only shows in browser environment */}
      <ShareStatsModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        talentUUID={talentUUID}
        handle={profile?.fname || identifier}
        onShareFarcaster={handleShareFarcaster}
        onShareTwitter={handleShareTwitter}
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
