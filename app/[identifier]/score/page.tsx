"use client";

import { ScoreProgressAccordion } from "@/components/profile/ScoreProgressAccordion";
import { ScoreDataPoints } from "@/components/profile/ScoreDataPoints";
import { CredentialIdeasCallout } from "@/components/profile/CredentialIdeasCallout";

interface ProfileScorePageProps {
  params: { identifier: string };
}

export default function ProfileScorePage({}: ProfileScorePageProps) {
  return (
    <div className="space-y-6">
      <ScoreProgressAccordion />
      <ScoreDataPoints />
      <CredentialIdeasCallout />
    </div>
  );
}
