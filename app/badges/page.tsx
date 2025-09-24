"use client";

import { useBadges } from "@/hooks/useBadges";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { useScoreRefresh } from "@/hooks/useScoreRefresh";

import type { BadgeState } from "@/lib/types/badges";
import { useEffect, useState } from "react";
import {
  BadgeCard,
  BadgeModal,
  BadgeFilterModal,
  ErrorState,
  LoadingState,
} from "@/components/badges";
import { BadgesPageLoadingState } from "@/components/badges/BadgesPageLoadingState";
import { Section } from "@/components/common/Section";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/common/PageContainer";
import { Settings2, RotateCcw, Loader2 } from "lucide-react";
import { getAllBadgeSections } from "@/lib/badge-content";
import { calculateCooldownMinutes } from "@/lib/cooldown-utils";
import { FarcasterAccessModal } from "@/components/modals/FarcasterAccessModal";
import { useTalentAuthPresence } from "@/hooks/useTalentAuthPresence";
import { useTalentUuid } from "@/hooks/useTalentUuid";

/**
 * BADGES PAGE
 *
 * Main page displaying all user badges organized in visible sections.
 * Shows earned vs total count in the header and overall completion percentage.
 * Includes filter functionality to show/hide badge sections.
 *
 * Features:
 * - Fetches badges data using useBadges hook
 * - Groups badges into sections (Trophies, Metrics, Platforms)
 * - Header showing progress stats (X of Y badges earned, completion %)
 * - Filter dropdown to show/hide sections
 * - Badge modal for detailed view when clicking individual badges
 * - Loading and error states with consistent UI patterns
 * - Always-visible sections with thin gray separators
 */
export default function BadgesPage() {
  // Get current user's talent UUID and handle (works for both Farcaster and Privy)
  const {
    talentUuid,
    loading: userLoading,
    handle: userHandle,
  } = useFidToTalentUuid();
  const { talentUuid: storedTalentUuid } = useTalentUuid();

  // Only fetch badges when we have a valid UUID
  // Prefer resolved UUID; fall back to stored UUID from token-based /me
  const effectiveTalentUuid = talentUuid || storedTalentUuid || undefined;

  const {
    data: badgesData,
    loading: badgesLoading,
    error,
    refetch,
  } = useBadges(effectiveTalentUuid || undefined);

  // API-based cooldown tracking using lastCalculatedAt
  const [cooldownMinutes, setCooldownMinutes] = useState<number | null>(null);

  // Calculate cooldown from badges data
  useEffect(() => {
    const calculateCooldown = () => {
      const lastCalculatedAt = badgesData?.lastCalculatedAt || null;
      const minutes = calculateCooldownMinutes(lastCalculatedAt);
      setCooldownMinutes(minutes);
    };

    calculateCooldown();

    // Update every minute
    const interval = setInterval(calculateCooldown, 60000);
    return () => clearInterval(interval);
  }, [badgesData?.lastCalculatedAt]);

  const isInApiCooldown = cooldownMinutes !== null && cooldownMinutes > 0;

  // Score refresh hook (exact same as profile page, but no auto-refetch)
  const {
    isRefreshing,
    error: refreshError,
    refreshScore: originalRefreshScore,
  } = useScoreRefresh(effectiveTalentUuid || "", undefined); // No auto-refetch callback

  // Enhanced refresh that uses shared score refresh logic
  const refreshBadges = async () => {
    if (!talentUuid) return;

    // Check API cooldown before attempting refresh
    if (isInApiCooldown) {
      console.log("Refresh blocked by API cooldown");
      return;
    }

    // Call original refresh score (now includes badge cache clearing)
    await originalRefreshScore();

    // Refetch badges data to get updated lastCalculatedAt
    await refetch();
  };

  /** Get available sections for filter */
  const availableSections = getAllBadgeSections();

  const [selectedBadge, setSelectedBadge] = useState<BadgeState | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>(
    availableSections.map((section) => section.id),
  );

  // Show FarcasterAccessModal for unauthenticated users
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { hasToken } = useTalentAuthPresence();

  useEffect(() => {
    if (!userLoading && !effectiveTalentUuid && !hasToken) {
      setShowAuthModal(true);
    }
  }, [userLoading, effectiveTalentUuid, hasToken]);

  /** Handle badge card clicks to open detailed modal */
  const handleBadgeClick = (badge: BadgeState) => {
    setSelectedBadge(badge);
  };

  /** Handle modal close */
  const handleCloseModal = () => {
    setSelectedBadge(null);
  };

  /** Handle section filter toggle */
  const handleSectionToggle = (sectionId: string) => {
    if (sectionId === "all") {
      // Toggle all sections
      if (selectedSections.length === availableSections.length) {
        // If all are selected, deselect all
        setSelectedSections([]);
      } else {
        // If some or none are selected, select all
        setSelectedSections(availableSections.map((s) => s.id));
      }
    } else {
      // Toggle individual section
      setSelectedSections((prev) =>
        prev.includes(sectionId)
          ? prev.filter((id) => id !== sectionId)
          : [...prev, sectionId],
      );
    }
  };

  /** Filter sections based on selection (only when using sections) */
  type SectionSummary = { id: string; title: string; badges: BadgeState[] };
  const rawSections: SectionSummary[] = Array.isArray(badgesData?.sections)
    ? (badgesData!.sections as SectionSummary[])
    : [];
  const filteredSections = rawSections.filter((section) => selectedSections.includes(section.id));

  /** Determine if we're using sections or flat layout */
  const usingSections = Array.isArray(badgesData?.sections) && (badgesData?.sections?.length ?? 0) > 0;
  const allBadges: BadgeState[] = Array.isArray(badgesData?.badges)
    ? (badgesData!.badges as BadgeState[])
    : [];

  // Show loading while resolving user
  if (userLoading && !storedTalentUuid) {
    return <BadgesPageLoadingState />;
  }

  // Show FarcasterAccessModal for unauthenticated users
  if (!effectiveTalentUuid && !hasToken) {
    return (
      <>
        <PageContainer>
          <LoadingState />
        </PageContainer>
        <FarcasterAccessModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          redirectPath="/badges"
        />
      </>
    );
  }

  if (badgesLoading) {
    return <BadgesPageLoadingState />;
  }

  if (error) {
    return <ErrorState error={error} retry={refetch} />;
  }

  if (
    effectiveTalentUuid &&
    (!badgesData || (!badgesData.sections?.length && !badgesData.badges?.length))
  ) {
    return <ErrorState error="No badge data available" retry={refetch} />;
  }

  return (
    <PageContainer>
      {/* Header section */}
      <Section variant="header">
        <div className="flex items-center justify-between">
          <div>
            <Typography as="h1" size="2xl" weight="bold">
              Badges
            </Typography>
            <Typography color="muted">
              {badgesData?.summary?.completionPct ?? 0}% completed
            </Typography>
          </div>
          <div className="flex items-center gap-2">
            {/* Refresh Button (using API-based cooldown) */}
            <Button
              onClick={refreshBadges}
              variant="default"
              size="sm"
              className={`${
                refreshError ? "text-red-700 hover:border-red-400" : ""
              }`}
              disabled={isRefreshing || !!refreshError || isInApiCooldown}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refresh Pending
                </>
              ) : refreshError ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refresh Failed
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {cooldownMinutes !== null && cooldownMinutes > 0
                    ? `Refresh in ${cooldownMinutes}min`
                    : "Refresh Badges"}
                </>
              )}
            </Button>

            {/* Filter Button */}
            {usingSections && (
              <Button
                variant="ghost"
                onClick={() => setFilterModalOpen(true)}
                className="h-10 w-10 p-0"
              >
                <Settings2 className="h-6 w-6 text-foreground" />
              </Button>
            )}
          </div>
        </div>
      </Section>

      {/* Conditional rendering: sections vs flat grid */}
      {usingSections ? (
        /* Content sections with interleaved dividers */
        filteredSections.map((section, sectionIndex) => (
          <div key={section.id}>
            <Section variant="content">
              <div className="space-y-8">
                <div className="badge-section">
                  {/* Section title with count */}
                  <Typography as="h2" size="lg" weight="bold" className="mb-6">
                    {section.title} (
                    {section.badges.reduce(
                      (total, badge) => total + badge.currentLevel,
                      0,
                    )}
                    /
                    {section.badges.reduce(
                      (total, badge) => total + badge.maxLevel,
                      0,
                    )}
                    )
                  </Typography>

                  {/* Badge grid - 3 columns on all screens */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-3 md:gap-x-4 md:gap-y-6">
                    {section.badges.map((badge, index) => (
                      <BadgeCard
                        key={badge.badgeSlug}
                        badge={badge}
                        onBadgeClick={handleBadgeClick}
                        priority={index < 6} // Prioritize first 6 badges in each section
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* Full-width dividing line after each section (except the last) */}
            {sectionIndex < filteredSections.length - 1 && (
              <Section variant="full-width">
                <div className="h-px bg-border mt-8 mb-4" />
              </Section>
            )}
          </div>
        ))
      ) : (
        /* Single grid layout for badges below threshold */
        <Section variant="content">
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-3 md:gap-x-4 md:gap-y-6 auto-rows-auto">
            {allBadges.map((badge, index) => {
              // Check if this badge should start on a new row (different section from previous)
              const shouldStartNewRow =
                index > 0 && allBadges[index - 1].sectionId !== badge.sectionId;

              return (
                <div
                  key={badge.badgeSlug}
                  className={shouldStartNewRow ? "col-start-1" : ""}
                >
                  <BadgeCard
                    badge={badge}
                    onBadgeClick={handleBadgeClick}
                    priority={index < 6} // Prioritize first 6 badges (2x3 grid)
                  />
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <BadgeModal
        badge={selectedBadge}
        onClose={handleCloseModal}
        talentUUID={effectiveTalentUuid || undefined}
        handle={userHandle || effectiveTalentUuid || undefined}
        profileOwnerTalentUUID={effectiveTalentUuid || undefined}
        onBadgeRefetch={refetch}
      />

      {usingSections && (
        <BadgeFilterModal
          open={filterModalOpen}
          onOpenChange={setFilterModalOpen}
          sections={availableSections}
          selectedSections={selectedSections}
          onSectionToggle={handleSectionToggle}
        />
      )}
    </PageContainer>
  );
}
