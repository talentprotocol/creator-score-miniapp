"use client";

import { StatsContent } from "@/components/profile/StatsContent";

interface PublicProfilePageProps {
  params: { identifier: string };
}

export default function PublicProfilePage({}: PublicProfilePageProps) {
  return <StatsContent />;
}
