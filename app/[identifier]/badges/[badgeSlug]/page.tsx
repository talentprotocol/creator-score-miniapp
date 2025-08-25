import { redirect } from "next/navigation";
import { getTalentUserService } from "@/app/services/userService";
import { getBadgeDetail } from "@/app/services/badgesService";

interface PublicBadgePageProps {
  params: {
    identifier: string;
    badgeSlug: string;
  };
}

export default async function PublicBadgePage({ params }: PublicBadgePageProps) {
  try {
    // Get user data for metadata generation
    const user = await getTalentUserService(params.identifier);
    if (!user?.id) {
      redirect("/");
    }

    // Get badge data for metadata generation
    const getBadgeDetailCached = await getBadgeDetail(user.id, params.badgeSlug);
    const badge = await getBadgeDetailCached();
    
    if (!badge || badge.currentLevel === 0) {
      redirect("/");
    }

    // Generate metadata for social crawlers, then redirect humans
    // Social platforms will crawl this page and get the metadata before redirect
    redirect(`/${params.identifier}/badges`);
    
  } catch (error) {
    console.error("[PublicBadgePage] Error:", error);
    redirect("/");
  }
}
