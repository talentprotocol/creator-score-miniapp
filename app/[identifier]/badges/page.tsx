import { getBadgesForUser } from "@/app/services/badgesService";
import { getTalentUserService } from "@/app/services/userService";
import { RESERVED_WORDS } from "@/lib/constants";
import { CreatorNotFoundCard } from "@/components/common/CreatorNotFoundCard";
import { ErrorState } from "@/components/badges";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";
import { ProfileBadgesClient } from "@/app/[identifier]/badges/ProfileBadgesClient";

interface ProfileBadgesPageProps {
  params: {
    identifier: string;
  };
}

/**
 * PROFILE BADGES TAB PAGE
 *
 * Displays all badges for a user in their profile tab.
 * Uses the same layout as the private /badges page but with responsive grid.
 * Server-side rendered for optimal performance.
 */
export default async function ProfileBadgesPage({
  params,
}: ProfileBadgesPageProps) {
  // 1. Input validation
  if (RESERVED_WORDS.includes(params.identifier)) {
    return <CreatorNotFoundCard />;
  }

  // 2. Resolve user (server-side)
  const user = await getTalentUserService(params.identifier);
  if (!user || !user.id) {
    return <CreatorNotFoundCard />;
  }

  // 3. Fetch badge data (server-side with caching)
  let badgesData;
  try {
    badgesData = await unstable_cache(
      async () => getBadgesForUser(user.id!)(),
      [`profile-badges-${user.id}`],
      {
        revalidate: CACHE_DURATION_5_MINUTES,
        tags: [
          `${CACHE_KEYS.USER_BADGES}-${user.id}`,
          `profile-badges-${user.id}`,
        ],
      },
    )();
  } catch (error) {
    console.error("[ProfileBadgesPage] Error fetching badges:", error);
    return <ErrorState error="Failed to load badges" />;
  }

  if (
    !badgesData ||
    (!badgesData.sections?.length && !badgesData.badges?.length)
  ) {
    return <ErrorState error="No badge data available" />;
  }

  // 4. Prepare display data
  const displayName = (user.display_name || user.name || "Creator") as string;
  const canonical = (user.fname ||
    user.wallet ||
    user.id ||
    "unknown") as string;

  return (
    <ProfileBadgesClient
      badgesData={badgesData}
      displayName={displayName}
      talentUUID={user.id!}
      handle={canonical}
    />
  );
}

// Caching configuration
export const revalidate = 300; // 5 minutes
