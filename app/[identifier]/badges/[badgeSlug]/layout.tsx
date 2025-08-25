import { getTalentUserService } from "@/app/services/userService";
import { getBadgeDetail } from "@/app/services/badgesService";
import { getAllBadgeSlugs, getBadgeContent } from "@/lib/badge-content";
import { RESERVED_WORDS } from "@/lib/constants";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";
import type { Metadata } from "next";

interface BadgeLayoutProps {
  children: React.ReactNode;
  params: {
    identifier: string;
    badgeSlug: string;
  };
}

export async function generateMetadata({
  params,
}: {
  params: { identifier: string; badgeSlug: string };
}): Promise<Metadata> {
  try {
    // Return generic metadata for invalid requests
    const allBadgeSlugs = getAllBadgeSlugs();
    if (!allBadgeSlugs.includes(params.badgeSlug) || RESERVED_WORDS.includes(params.identifier)) {
      return {
        title: "Badge Not Found - Creator Score",
        description: "This badge page could not be found.",
      };
    }

    // Get user and badge data
    const getCachedUserService = unstable_cache(
      async (identifier: string) => getTalentUserService(identifier),
      [CACHE_KEYS.USER_PROFILE],
      { revalidate: CACHE_DURATION_5_MINUTES }
    );

    const user = await getCachedUserService(params.identifier);
    if (!user?.id) {
      return {
        title: "User Not Found - Creator Score",
        description: "This user profile could not be found.",
      };
    }

    const badge = await getBadgeDetail(user.id, params.badgeSlug)();
    if (!badge || badge.currentLevel <= 0) {
      return {
        title: "Badge Not Found - Creator Score", 
        description: "This badge has not been earned yet.",
      };
    }

    const badgeContent = getBadgeContent(params.badgeSlug);
    if (!badgeContent) {
      return {
        title: "Badge Not Found - Creator Score",
        description: "This badge configuration could not be found.",
      };
    }

    // Build metadata for earned badge
    const displayName = (user.display_name || user.name || "Creator") as string;
    const badgeTitle = `${displayName}'s ${badgeContent.title} - Level ${badge.currentLevel}`;
    const description = `${displayName} earned the ${badgeContent.title} badge at level ${badge.currentLevel}. ${badgeContent.description}`;
    const badgeUrl = `https://creatorscore.app/${params.identifier}/badges/${params.badgeSlug}`;

    // Generate badge share image URL
    const shareImageParams = new URLSearchParams({
      talentUUID: user.id,
      badgeSlug: params.badgeSlug,
      level: badge.currentLevel.toString(),
    });
    const shareImageUrl = `https://creatorscore.app/api/share-image-badge/${params.badgeSlug}?${shareImageParams}`;

    return {
      title: badgeTitle,
      description,
      openGraph: {
        title: badgeTitle,
        description,
        type: "profile",
        url: badgeUrl,
        images: [shareImageUrl],
      },
      twitter: {
        card: "summary_large_image",
        title: badgeTitle,
        description,
        images: [shareImageUrl],
      },
      alternates: {
        canonical: badgeUrl,
      },
      // Add structured data for rich snippets
      other: {
        "article:author": displayName as string,
        "article:section": "Gaming", // Badges are like gaming achievements
        "og:type": "article",
      },
    };
  } catch (error) {
    console.error("Error generating badge metadata:", error);
    return {
      title: "Badge Not Found - Creator Score",
      description: "This badge page could not be found.",
    };
  }
}

export default function BadgeLayout({ children }: BadgeLayoutProps) {
  return <>{children}</>;
}
