import { getTalentUserService } from "@/app/services/userService";
import { getBadgesForUser } from "@/app/services/badgesService";
import { ProfileBadgesClient } from "./ProfileBadgesClient";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";
import type { BadgeState } from "@/app/services/badgesService";

interface ProfileBadgesPageProps {
  params: {
    identifier: string;
  };
}

const getCachedUserService = unstable_cache(
  async (identifier: string) => {
    return getTalentUserService(identifier);
  },
  [CACHE_KEYS.USER_PROFILE],
  { revalidate: CACHE_DURATION_5_MINUTES },
);

export default async function ProfileBadgesPage({ params }: ProfileBadgesPageProps) {
  try {
    // Resolve user
    const user = await getCachedUserService(params.identifier);
    if (!user?.id) {
      notFound();
    }

    // Get user badges
    const getBadges = await getBadgesForUser(user.id);
    const badgesData = await getBadges();

    if (!badgesData?.badges) {
      notFound();
    }

    // Filter out locked badges (level 0) for public display
    const publicBadges = badgesData.badges.filter((badge: BadgeState) => badge.currentLevel > 0);

    return (
      <ProfileBadgesClient
        badges={publicBadges}
        identifier={user.id}
      />
    );
  } catch (error) {
    console.error("[ProfileBadgesPage] Error:", error);
    notFound();
  }
}
