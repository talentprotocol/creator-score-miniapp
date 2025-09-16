"use client";
import { useState, useEffect, Suspense } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { sdk } from "@farcaster/frame-sdk";
import { useResolvedTalentProfile } from "@/hooks/useResolvedTalentProfile";
import { useCreatorScoreLeaderboard } from "@/hooks/useCreatorScoreLeaderboard";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import { CreatorList } from "@/components/common/CreatorList";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/common/Section";
import { PageContainer } from "@/components/common/PageContainer";
import { CalloutCarousel } from "@/components/common/CalloutCarousel";
import { StatCard } from "@/components/common/StatCard";
import { Award, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUserCalloutPrefs } from "@/hooks/useUserCalloutPrefs";
import { FarcasterAccessModal } from "@/components/modals/FarcasterAccessModal";

function LeaderboardContent() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const router = useRouter();
  const { talentUuid: userTalentUuid } = useFidToTalentUuid();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Use Creator Score leaderboard hook
  const { profiles, pinnedUser, loading, error, hasMore, showMore } =
    useCreatorScoreLeaderboard(userTalentUuid);

  // Use hooks for data fetching - both auth paths
  const { displayName: unifiedName, avatarUrl: unifiedAvatar } =
    useResolvedTalentProfile();

  // Combine data from both auth paths
  const avatarUrl = unifiedAvatar ?? user?.pfpUrl;
  const name = unifiedName ?? user?.displayName ?? user?.username;

  // Server-persisted callout preferences
  const {
    permanentlyHiddenIds: permanentlyHiddenCalloutIds,
    addPermanentlyHiddenId,
  } = useUserCalloutPrefs(userTalentUuid ?? null);

  // Hide Farcaster Mini App splash screen when ready
  useEffect(() => {
    sdk.actions.ready(); // Notifies Farcaster host to hide splash
  }, []);

  const isLoggedIn = !!(user || unifiedName);

  return (
    <PageContainer>
      {/* Header section */}
      <Section variant="header">
        {/* Rewards Stat Cards */}
        <div className="flex gap-3">
          <StatCard
            title="Rewards Round #1"
            value="$2,624"
            secondaryMetric="Distributed Sep 17th"
            onClick={() => router.push("/rewards")}
            icon={
              <ChevronRight className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
            }
          />
          <StatCard
            title="Rewards Round #2"
            value="$15,728"
            secondaryMetric="Coming Soon"
          />
        </div>

        {/* Callout Carousel - only render if not hidden */}
        {(() => {
          const carouselItems = [
            // BADGES ANNOUNCEMENT (pink) – new feature announcement
            {
              id: "badges-announcement",
              variant: "brand-pink" as const,
              icon: <Award className="h-4 w-4" />,
              title: "NEW: Creator Badges",
              description: "Track your progress and earn badges.",
              href: isLoggedIn ? "/badges" : undefined,
              onClick: !isLoggedIn ? () => setLoginModalOpen(true) : undefined,
              onClose: () => {
                // Handle dismissal
              },
            },
          ];

          // Check if any items should be visible
          const visibleItems = carouselItems.filter((item) => {
            // Check if item is permanently hidden (server-side persistence)
            if (
              permanentlyHiddenCalloutIds &&
              permanentlyHiddenCalloutIds.includes(item.id)
            ) {
              return false;
            }
            return true;
          });

          // Only render if there are visible items
          if (visibleItems.length === 0) {
            return null;
          }

          return (
            <div className="mt-4">
              <CalloutCarousel
                permanentlyHiddenIds={permanentlyHiddenCalloutIds}
                onPersistPermanentHide={(id) => addPermanentlyHiddenId(id)}
                items={carouselItems}
              />
            </div>
          );
        })()}
      </Section>

      {/* Login Modal for logged-out users */}
      <FarcasterAccessModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
      />

      {/* Content section */}
      <Section variant="content" animate>
        {error && (
          <div className="text-destructive text-sm px-2 mb-4">{error}</div>
        )}

        {loading && profiles.length === 0 && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Column headings */}
        {!loading && profiles.length > 0 && (
          <div className="flex items-center gap-3 px-3 py-2">
            <span className="w-6 text-[10px] uppercase tracking-wide text-muted-foreground">
              Rank
            </span>
            <div className="w-8" />
            <span className="flex-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Creator
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Score
            </span>
          </div>
        )}

        {/* Leaderboard list */}
        <CreatorList
          items={(() => {
            const baseItems = profiles.map((profile) => ({
              id: profile.id,
              name: profile.display_name || "Unknown",
              avatarUrl: profile.image_url,
              rank: profile.rank,
              primaryMetric: formatCompactNumber(profile.score),
              secondaryMetric: profile.total_earnings
                ? `Total Earnings: ${formatCurrency(profile.total_earnings)}`
                : "Total Earnings: N/A",
            }));

            // Add pinned user at the top if logged in and available
            if (isLoggedIn && pinnedUser) {
              // Use the user's data from the main leaderboard results instead of pinnedUser
              const userInProfiles = profiles.find(
                (p) => p.id === userTalentUuid,
              );

              if (userInProfiles) {
                // User is in the current page, use their actual leaderboard data for pinned entry
                const pinnedItem = {
                  id: userInProfiles.id,
                  name: name || userInProfiles.display_name || "You",
                  avatarUrl: avatarUrl || userInProfiles.image_url,
                  rank: userInProfiles.rank,
                  primaryMetric: formatCompactNumber(userInProfiles.score),
                  secondaryMetric: userInProfiles.total_earnings
                    ? `Total Earnings: ${formatCurrency(userInProfiles.total_earnings)}`
                    : "Total Earnings: N/A",
                };

                // Show pinned user at top AND keep user in their natural position (duplication)
                return [pinnedItem, ...baseItems];
              } else {
                // User is not in current page (rank outside range), use pinnedUser data
                const pinnedItem = {
                  id: pinnedUser.id,
                  name: name || pinnedUser.display_name || "You",
                  avatarUrl: avatarUrl || pinnedUser.image_url,
                  rank: pinnedUser.rank,
                  primaryMetric: formatCompactNumber(pinnedUser.score),
                  secondaryMetric: pinnedUser.total_earnings
                    ? `Total Earnings: ${formatCurrency(pinnedUser.total_earnings)}`
                    : "Total Earnings: N/A",
                };
                return [pinnedItem, ...baseItems];
              }
            }

            return baseItems;
          })()}
          onItemClick={(item) => {
            // Navigate to profile page
            router.push(`/${item.id}`);
          }}
          loading={loading}
          pinnedIndex={isLoggedIn && pinnedUser ? 0 : undefined}
        />

        {/* Show More button */}
        {!loading && hasMore && (
          <div className="flex justify-center mt-6">
            <Button variant="ghost" onClick={showMore} disabled={loading}>
              Show More
            </Button>
          </div>
        )}
      </Section>
    </PageContainer>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-16 w-full" />}>
      <LeaderboardContent />
    </Suspense>
  );
}
