"use client";

import { ScoreProgressAccordion } from "@/components/profile/ScoreProgressAccordion";
import { ScoreDataPoints } from "@/components/profile/ScoreDataPoints";
import { CredentialIdeasCallout } from "@/components/profile/CredentialIdeasCallout";
import { useProfileHeaderData } from "@/hooks/useProfileHeaderData";

interface ScoreTabContentProps {
  identifier: string;
}

export function ScoreTabContent({ identifier }: ScoreTabContentProps) {
  const { profile } = useProfileHeaderData(identifier);
  const talentUUID = profile?.id;

  if (!talentUUID) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <ScoreProgressAccordion talentUUID={talentUUID} />
      <ScoreDataPoints talentUUID={talentUUID} />
      <CredentialIdeasCallout />
    </div>
  );
}
