"use client";

import { useState } from "react";
import { useBadges } from "@/hooks/useBadges";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import type { BadgeState } from "@/app/services/badgesService";
import {
  BadgeModal,
  BadgeCard,
  BadgeFilterModal,
  LoadingState,
  ErrorState,
} from "@/components/badges";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";
import { Typography } from "@/components/ui/typography";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  // Get current user's talent UUID (works for both Farcaster and Privy)
  const { talentUuid, loading: userLoading } = useFidToTalentUuid();

  // Only fetch badges when we have a valid UUID
  const {
    data: badgesData,
    loading: badgesLoading,
    error,
  } = useBadges(talentUuid || undefined);

  const [selectedBadge, setSelectedBadge] = useState<BadgeState | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>([
    "trophies",
    "metrics",
    "platforms",
  ]);

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

  /** Get available sections for filter */
  const availableSections = [
    { id: "trophies", title: "Trophies" },
    { id: "metrics", title: "Metrics" },
    { id: "platforms", title: "Platforms" },
  ];

  /** Filter sections based on selection */
  const filteredSections =
    badgesData?.sections.filter((section) =>
      selectedSections.includes(section.id),
    ) || [];

  // Show loading while resolving user
  if (userLoading) {
    return <LoadingState />;
  }

  // Show error if no user context
  if (!talentUuid) {
    return (
      <ErrorState error="Please connect your wallet or Farcaster account to view badges" />
    );
  }

  if (badgesLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!badgesData || !badgesData.sections?.length) {
    return <ErrorState error="No badge data available" />;
  }

  return (
    <PageContainer noPadding>
      {/* Header section */}
      <Section variant="header">
        <div className="flex items-center justify-between">
          <div>
            <Typography as="h1" size="2xl" weight="bold">
              All Badges
            </Typography>
            <Typography color="muted">
              {badgesData.summary.earnedCount} badges earned,{" "}
              {badgesData.summary.completionPct}% completed
            </Typography>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterModalOpen(true)}
            className="h-10 w-10 p-0"
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        </div>
      </Section>

      {/* Content section */}
      <Section variant="content">
        <div className="space-y-8">
          {filteredSections.map((section) => {
            const earnedCount = section.badges.filter(
              (badge) => badge.state === "earned",
            ).length;
            const totalCount = section.badges.length;

            return (
              <div key={section.id} className="badge-section">
                {/* Section separator */}
                <div className="h-px bg-muted mb-4" />

                {/* Section title with count */}
                <Typography as="h2" size="lg" weight="bold" className="mb-6">
                  {section.title} ({earnedCount}/{totalCount})
                </Typography>

                {/* Badge grid */}
                <div className="grid grid-cols-3 gap-x-4 gap-y-6">
                  {section.badges.map((badge) => (
                    <BadgeCard
                      key={badge.slug}
                      badge={badge}
                      onBadgeClick={handleBadgeClick}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <BadgeModal badge={selectedBadge} onClose={handleCloseModal} />

        <BadgeFilterModal
          open={filterModalOpen}
          onOpenChange={setFilterModalOpen}
          sections={availableSections}
          selectedSections={selectedSections}
          onSectionToggle={handleSectionToggle}
        />
      </Section>
    </PageContainer>
  );
}
