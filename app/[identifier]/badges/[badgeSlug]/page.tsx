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

    // Validate params early to prevent unnecessary API calls
    if (!params.identifier || !params.badgeSlug) {
      console.log("[PublicBadgePage] Invalid params, redirecting to home");
      return Response.redirect("/", 307);
    }

    const user = await getTalentUserService(params.identifier);
    if (!user?.id) {
      console.log("[PublicBadgePage] User not found, redirecting to profile");
      return Response.redirect(`/${params.identifier}/badges`, 307);
    }
    console.log("[PublicBadgePage] User found:", user.id);

    const getBadgeDetailCached = await getBadgeDetail(
      user.id,
      params.badgeSlug,
    );
    const badge = await getBadgeDetailCached();

    if (!badge || badge.currentLevel === 0) {
      console.log(
        "[PublicBadgePage] Badge not found or locked, redirecting to profile",
      );
      return Response.redirect(`/${params.identifier}/badges`, 307);
    }
    console.log("[PublicBadgePage] Badge found, redirecting to profile badges");

    return Response.redirect(`/${params.identifier}/badges`, 307);
  } catch (error) {
    console.error("[PublicBadgePage] Error:", error);
    // On any error, redirect to profile badges tab to maintain user experience
    return Response.redirect(`/${params.identifier}/badges`, 307);
  }
}
