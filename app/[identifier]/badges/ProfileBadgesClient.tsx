"use client";

import { useState } from "react";
import type { BadgeState } from "@/app/services/badgesService";
import { BadgeCard, BadgeModal } from "@/components/badges";
import { Section } from "@/components/common/Section";
import { Typography } from "@/components/ui/typography";

interface ProfileBadgesClientProps {
  badgesData: {
    sections?: Array<{
      id: string;
      title: string;
      badges: BadgeState[];
    }>;
    badges?: BadgeState[];
    summary: {
      earnedCount: number;
      totalCount: number;
      completionPct: number;
    };
  };
  talentUUID: string;
  handle: string;
}

/**
 * PROFILE BADGES CLIENT COMPONENT
 *
 * Handles client-side badge interactions in the profile badges tab.
 * Opens BadgeModal when badges are clicked, maintaining profile context.
 */
export function ProfileBadgesClient({
  badgesData,
  talentUUID,
  handle,
}: ProfileBadgesClientProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeState | null>(null);

  // Handle badge card clicks - always open modal for profile tab
  const handleBadgeClick = (badge: BadgeState) => {
    setSelectedBadge(badge);
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedBadge(null);
  };

  // Determine if we're using sections or flat layout
  const usingSections = badgesData?.sections && badgesData.sections.length > 0;
  const allBadges = badgesData?.badges || [];

  return (
    <>
      {/* Conditional rendering: sections vs flat grid */}
      {usingSections ? (
        /* Content sections with interleaved dividers */
        badgesData.sections!.map((section, sectionIndex) => (
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

                  {/* Badge grid - responsive like in private page */}
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
            {sectionIndex < badgesData.sections!.length - 1 && (
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

      {/* Badge Modal */}
      <BadgeModal
        badge={selectedBadge}
        onClose={handleCloseModal}
        talentUUID={talentUUID}
        handle={handle}
      />
    </>
  );
}
