"use client";

import { ScoreDataPoints } from "@/components/profile/ScoreDataPoints";

interface ProfileScorePageProps {
  params: { identifier: string };
}

export default function ProfileScorePage({}: ProfileScorePageProps) {
  return (
    <div className="space-y-6">
      <ScoreDataPoints />
    </div>
  );
}
