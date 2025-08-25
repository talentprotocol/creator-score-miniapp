import { getTalentUserService } from "@/app/services/userService";
import { getBadgeDetail } from "@/app/services/badgesService";
import {
  getAllBadgeSlugs,
  getBadgeContent,
  getBadgeMaxLevel,
} from "@/lib/badge-content";
import { RESERVED_WORDS } from "@/lib/constants";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";
import type { Metadata } from "next";

interface BadgeLayoutProps {
  children: React.ReactNode;
  params: {
    identifier: string;
    badgeSlug: string;
    level: string;
  };
}

export async function generateMetadata({
  params,
}: {
  params: { identifier: string; badgeSlug: string; level: string };
}): Promise<Metadata> {
  const level = parseInt(params.level);

  // Return generic metadata for invalid inputs (consistent with 404 behavior)
  if (
    RESERVED_WORDS.includes(params.identifier) ||
    !getAllBadgeSlugs().includes(params.badgeSlug) ||
    isNaN(level) ||
    level < 1 ||
    level > getBadgeMaxLevel(params.badgeSlug)
  ) {
    return {
      title: "Badge Not Found - Creator Score",
      description: "This badge could not be found.",
    };
  }

  try {
    // Resolve user
    const user = await getTalentUserService(params.identifier);
    if (!user || !user.id) {
      return {
        title: "Badge Not Found - Creator Score",
        description: "This badge could not be found.",
      };
    }

    // Get canonical identifier
    const canonical = user.fname || user.wallet || user.id;

    // Fetch badge data with caching
    const badge = await unstable_cache(
      async () => getBadgeDetail(user.id!, params.badgeSlug)(),
      [`public-badge-meta-${user.id}-${params.badgeSlug}`],
      {
        revalidate: CACHE_DURATION_5_MINUTES,
        tags: [
          `${CACHE_KEYS.USER_BADGES}-${user.id}`,
          `public-badge-meta-${user.id}-${params.badgeSlug}`,
        ],
      },
    )();

    // Return generic metadata if badge doesn't exist or level not earned
    if (!badge || badge.currentLevel < level) {
      return {
        title: "Badge Not Found - Creator Score",
        description: "This badge could not be found.",
      };
    }

    // Get badge content for display information
    const badgeContent = getBadgeContent(params.badgeSlug);
    if (!badgeContent) {
      return {
        title: "Badge Not Found - Creator Score",
        description: "This badge could not be found.",
      };
    }

    // Prepare display data
    const displayName = user.display_name || user.name || "Creator";
    const badgeTitle = badgeContent.title;
    const levelLabel = badgeContent.levelLabels[level - 1] || `Level ${level}`;

    // Always use canonical URL for Open Graph metadata
    const canonicalUrl = "https://creatorscore.app";
    const badgeUrl = `${canonicalUrl}/${canonical}/badges/${params.badgeSlug}/level-${level}`;

    // Generate badge share image URL
    const shareImageUrl = `${canonicalUrl}/api/share-image-badge/${params.badgeSlug}?talentUUID=${user.id}&level=${level}&title=${encodeURIComponent(badgeTitle)}`;

    const title = `${displayName} - ${badgeTitle} Level ${level}`;
    const description = `${displayName} earned ${levelLabel} in ${badgeTitle}. ${badgeContent.description}`;

    return {
      title,
      description,
      openGraph: {
        title: `${displayName}'s ${badgeTitle} Badge`,
        description: `Level ${level} achievement: ${levelLabel}`,
        images: [
          {
            url: shareImageUrl,
            width: 1600,
            height: 900,
            alt: `${displayName} ${badgeTitle} Level ${level} Badge`,
          },
        ],
        type: "website",
        url: badgeUrl,
      },
      twitter: {
        card: "summary_large_image",
        title,
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
      description: "This badge could not be found.",
    };
  }
}

export default function BadgeLayout({ children }: BadgeLayoutProps) {
  return <>{children}</>;
}

// Enable static generation for metadata
export const revalidate = 300; // 5 minutes
