"use client";

import { ProfileBadgesClient } from "./ProfileBadgesClient";

interface ProfileBadgesPageProps {
  params: {
    identifier: string;
  };
}

export default function ProfileBadgesPage({ params }: ProfileBadgesPageProps) {
  return <ProfileBadgesClient identifier={params.identifier} />;
}
