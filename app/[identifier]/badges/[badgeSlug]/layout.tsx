import { Metadata } from "next";
import { getTalentUserService } from "@/app/services/userService";
import { getBadgeDetail } from "@/app/services/badgesService";
import { getBadgeContent } from "@/lib/badge-content";

interface BadgeLayoutProps {
  children: React.ReactNode;
  params: {
    identifier: string;
    badgeSlug: string;
  };
}

export async function generateMetadata({ params }: BadgeLayoutProps): Promise<Metadata> {
  try {
    // Get user data for metadata
    const user = await getTalentUserService(params.identifier);
    if (!user?.id) {
      return {
        title: "Creator Not Found",
        description: "The requested creator could not be found.",
      };
    }

    // Get badge data for metadata
    const getBadgeDetailCached = await getBadgeDetail(user.id, params.badgeSlug);
    const badge = await getBadgeDetailCached();
    
    if (!badge || badge.currentLevel === 0) {
      return {
        title: "Badge Not Found",
        description: "The requested badge could not be found.",
      };
    }

    // Get badge content for metadata
    const badgeContent = getBadgeContent(params.badgeSlug);
    if (!badgeContent) {
      return {
        title: "Badge Not Found",
        description: "The requested badge could not be found.",
      };
    }

    const displayName = user.display_name || user.fname || user.wallet || user.id || "Creator";
    const badgeTitle = `${displayName}'s ${badgeContent.title} - Level ${badge.currentLevel}`;
    const badgeDescription = `${displayName} earned the ${badgeContent.title} badge at level ${badge.currentLevel}. Check out their achievement and see what badges you can earn too!`;

    return {
      title: badgeTitle,
      description: badgeDescription,
      openGraph: {
        title: badgeTitle,
        description: badgeDescription,
        type: "website",
        url: `https://creatorscore.app/${params.identifier}/badges/${params.badgeSlug}`,
        images: [
          {
            url: badge.artworkUrl,
            width: 1200,
            height: 630,
            alt: `${badgeContent.title} - Level ${badge.currentLevel}`,
          },
        ],
        siteName: "Creator Score",
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title: badgeTitle,
        description: badgeDescription,
        images: [badge.artworkUrl],
      },
    };
  } catch (error) {
    console.error("[BadgeLayout] Error generating metadata:", error);
    return {
      title: "Badge",
      description: "View badge details and achievements.",
    };
  }
}

export default function BadgeLayout({ children }: BadgeLayoutProps) {
  return children;
}
