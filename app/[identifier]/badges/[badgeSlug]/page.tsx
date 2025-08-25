import { redirect } from "next/navigation";
import { getTalentUserService } from "@/app/services/userService";
import { getBadgeDetail } from "@/app/services/badgesService";

interface PublicBadgePageProps {
  params: {
    identifier: string;
    badgeSlug: string;
  };
}

export default async function PublicBadgePage({
  params,
}: PublicBadgePageProps) {
  try {
    console.log(
      "[PublicBadgePage] Starting redirect for:",
      params.identifier,
      params.badgeSlug,
    );

    // Get user data for metadata generation
    const user = await getTalentUserService(params.identifier);
    if (!user?.id) {
      console.log("[PublicBadgePage] User not found, redirecting to profile");
      redirect(`/${params.identifier}/badges`);
    }

    console.log("[PublicBadgePage] User found:", user.id);

    // Get badge data for metadata generation
    const getBadgeDetailCached = await getBadgeDetail(
      user.id,
      params.badgeSlug,
    );
    const badge = await getBadgeDetailCached();

    if (!badge || badge.currentLevel === 0) {
      console.log(
        "[PublicBadgePage] Badge not found or locked, redirecting to profile",
      );
      redirect(`/${params.identifier}/badges`);
    }

    console.log("[PublicBadgePage] Badge found, redirecting to profile badges");

    // Generate metadata for social crawlers, then redirect humans
    // Social platforms will crawl this page and get the metadata before redirect
    redirect(`/${params.identifier}/badges`);
  } catch (error) {
    console.error("[PublicBadgePage] Error:", error);
    // On any error, redirect to profile badges tab to maintain user experience
    redirect(`/${params.identifier}/badges`);
  }
}
