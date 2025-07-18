"use client";

import { ScoreProgressAccordion } from "@/components/profile/ScoreProgressAccordion";
import { ScoreDataPoints } from "@/components/profile/ScoreDataPoints";
import { CredentialIdeasCallout } from "@/components/profile/CredentialIdeasCallout";
import { useProfileHeaderData } from "@/hooks/useProfileHeaderData";

interface ProfileScorePageProps {
  params: { identifier: string };
}

export default function ProfileScorePage({ params }: ProfileScorePageProps) {
  const { profile } = useProfileHeaderData(params.identifier);
  const talentUUID = profile?.id;

  return (
    <div className="space-y-6">
      <ScoreProgressAccordion talentUUID={talentUUID || ""} />
      <ScoreDataPoints talentUUID={talentUUID || ""} />
      <CredentialIdeasCallout />
    </div>
  );
}
