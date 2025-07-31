"use client";

import { ScoreProgressAccordion } from "@/components/profile/ScoreProgressAccordion";
import { ScoreDataPoints } from "@/components/profile/ScoreDataPoints";
import { Callout } from "@/components/common/Callout";

interface ProfileScorePageProps {
  params: { identifier: string };
}

export default function ProfileScorePage({}: ProfileScorePageProps) {
  return (
    <div className="space-y-6">
      <ScoreProgressAccordion />
      <ScoreDataPoints />
      {/* <Callout
        variant="brand"
        href="https://farcaster.xyz/juampi"
        textSize="xs"
      >
        Have new credential ideas or feedback? Reach out to @juampi
      </Callout> */}
    </div>
  );
}
