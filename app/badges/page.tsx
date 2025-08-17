"use client";

import { useState } from "react";
import { SectionAccordion } from "@/components/common/SectionAccordion";
import { useBadges } from "@/hooks/useBadges";
import type { BadgeState } from "@/app/services/badgesService";
import {
  BadgeModal,
  BadgeCard,
  LoadingState,
  ErrorState,
} from "@/components/badges";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";
import { Typography } from "@/components/ui/typography";

/**
 * BADGES PAGE
 *
 * Main page displaying all user badges organized in collapsible sections.
 * Shows earned vs total count in the header and overall completion percentage.
 *
 * Features:
 * - Fetches badges data using useBadges hook
 * - Groups badges into sections (Trophies, Metrics)
 * - Header showing progress stats (X of Y badges earned, completion %)
 * - Badge modal for detailed view when clicking individual badges
 * - Loading and error states with consistent UI patterns
 * - Uses SectionAccordion for collapsible badge categories
 */
export default function BadgesPage() {
  // Fetch badges data with standard {data, loading, error} pattern
  // For development, you can pass a userId parameter to useBadges()
  const { data: badgesData, loading, error } = useBadges();
  const [selectedBadge, setSelectedBadge] = useState<BadgeState | null>(null);

  /** Handle badge card clicks to open detailed modal */
  const handleBadgeClick = (badge: BadgeState) => {
    setSelectedBadge(badge);
  };

  /** Handle modal close */
  const handleCloseModal = () => {
    setSelectedBadge(null);
  };

  if (loading) {
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
        <Typography as="h1" size="2xl" weight="bold">
          Badges
        </Typography>
        <Typography color="muted">
          {badgesData.summary.earnedCount} badges earned,{" "}
          {badgesData.summary.completionPct}% completed
        </Typography>
      </Section>

      {/* Content section */}
      <Section variant="content">
        <SectionAccordion
          type="multiple"
          variant="white"
          sections={badgesData.sections.map((section) => {
            const earnedCount = section.badges.filter(
              (badge) => badge.state === "earned",
            ).length;
            const totalCount = section.badges.length;

            return {
              id: section.id,
              title: section.title,
              value: `${earnedCount}/${totalCount}`,
              content: (
                <div className="grid grid-cols-3 gap-x-4 gap-y-6">
                  {section.badges.map((badge) => (
                    <BadgeCard
                      key={badge.slug}
                      badge={badge}
                      onBadgeClick={handleBadgeClick}
                    />
                  ))}
                </div>
              ),
            };
          })}
        />

        <BadgeModal badge={selectedBadge} onClose={handleCloseModal} />
      </Section>
    </PageContainer>
  );
}
