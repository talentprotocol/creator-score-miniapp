"use client";

import { useState } from "react";
import { SectionAccordion } from "@/components/common/SectionAccordion";
import { useBadges } from "@/hooks/useBadges";
import { BadgeItem } from "@/lib/badge-data";
import {
  BadgeModal,
  BadgeCard,
  LoadingState,
  ErrorState,
} from "@/components/badges";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";

export default function BadgesPage() {
  const { data: badges, loading, error } = useBadges();
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  const handleBadgeClick = (badge: BadgeItem) => {
    setSelectedBadge(badge);
  };

  const handleCloseModal = () => {
    setSelectedBadge(null);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!badges) {
    return <ErrorState error="No badge data available" />;
  }

  return (
    <PageContainer noPadding>
      {/* Header section */}
      <Section variant="header">
        <h1 className="text-2xl font-bold">Badges</h1>
        <p className="text-muted-foreground">
          Track your progress and unlock achievements
        </p>
      </Section>

      {/* Content section */}
      <Section variant="content">
        <SectionAccordion
          type="multiple"
          variant="white"
          sections={badges.map((section) => {
            const completedCount = section.badges.filter(
              (badge) => badge.completed,
            ).length;
            const totalCount = section.badges.length;

            return {
              id: section.id,
              title: section.title,
              value: `${completedCount}/${totalCount}`,
              content: (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                  {section.badges.map((badge) => (
                    <BadgeCard
                      key={badge.id}
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
