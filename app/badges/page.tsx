"use client";

import { useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import { useBadges } from "@/hooks/useBadges";
import { BadgeItem } from "@/lib/badge-data";
import {
  BadgeModal,
  BadgeSectionComponent,
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
        <Accordion type="multiple" className="w-full space-y-2">
          {badges.map((section) => (
            <BadgeSectionComponent
              key={section.id}
              section={section}
              onBadgeClick={handleBadgeClick}
            />
          ))}
        </Accordion>

        <BadgeModal badge={selectedBadge} onClose={handleCloseModal} />
      </Section>
    </PageContainer>
  );
}
