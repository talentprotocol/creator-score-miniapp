import { getTalentUserService } from "@/app/services/userService";
import { getBadgesForUser } from "@/app/services/badgesService";
import { ProfileBadgesClient } from "./ProfileBadgesClient";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";
import type { BadgeState } from "@/app/services/badgesService";
import { redirect } from "next/navigation";

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

export default async function ProfileBadgesPage({
  params,
}: ProfileBadgesPageProps) {
  try {
    console.log("[ProfileBadgesPage] Loading badges for:", params.identifier);

    // Resolve user
    const user = await getCachedUserService(params.identifier);
    if (!user?.id) {
      console.log("[ProfileBadgesPage] User not found");
      notFound();
    }

    console.log("[ProfileBadgesPage] User found:", user.id);

    // Get user badges
    const getBadges = await getBadgesForUser(user.id);
    const badgesData = await getBadges();

    if (!badgesData?.badges) {
      console.log("[ProfileBadgesPage] No badges found");
      notFound();
    }

    console.log("[ProfileBadgesPage] Badges found:", badgesData.badges.length);

    // Filter out locked badges (level 0) for public display
    const publicBadges = badgesData.badges.filter(
      (badge: BadgeState) => badge.currentLevel > 0,
    );

    console.log("[ProfileBadgesPage] Public badges:", publicBadges.length);

    return (
      <ProfileBadgesClient
        badges={publicBadges}
        talentUUID={user.id}
        handle={params.identifier} // Pass the handle (like "jessepollak")
      />
    );
  } catch (error) {
    console.error("[ProfileBadgesPage] Error:", error);
    // On any error, redirect to profile badges tab to maintain user experience
    redirect(`/${params.identifier}/badges`);
  }
}
