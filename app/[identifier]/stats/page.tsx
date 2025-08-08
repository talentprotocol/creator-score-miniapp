"use client";

import { StatsContent } from "@/components/profile/StatsContent";

interface ProfileStatsPageProps {
  params: { identifier: string };
}

export default function ProfileStatsPage({}: ProfileStatsPageProps) {
  return <StatsContent />;
}
