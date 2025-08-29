import { getTalentUserService } from "@/app/services/userService";
import { getBadgeDetail } from "@/app/services/badgesService";
import { redirect } from "next/navigation";
import { validateTalentUUID } from "@/lib/validation";

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
    // Validate params early to prevent unnecessary API calls
    if (!params.identifier || !params.badgeSlug) {
      redirect("/");
    }

    // Validate identifier format to prevent injection attacks
    // Allow Farcaster handles (1-32 chars, lowercase, alphanumeric, may include . or -)
    // Allow wallet addresses (0x + 40 hex chars)
    // Allow Talent UUIDs (standard UUID v4 format)
    const isValidIdentifier = 
      /^[a-z0-9][a-z0-9\-\.]{0,31}$/.test(params.identifier) || // Farcaster handle
      /^0x[a-fA-F0-9]{40}$/.test(params.identifier) || // Wallet address
      validateTalentUUID(params.identifier); // Talent UUID

    if (!isValidIdentifier) {
      redirect("/");
    }

    const user = await getTalentUserService(params.identifier);
    if (!user?.id) {
      redirect(`/${params.identifier}/badges`);
    }

    const getBadgeDetailCached = await getBadgeDetail(
      user.id,
      params.badgeSlug,
    );
    const badge = await getBadgeDetailCached();

    if (!badge || badge.currentLevel === 0) {
      redirect(`/${params.identifier}/badges`);
    }

    redirect(`/${params.identifier}/badges`);
  } catch {
    // On any error, redirect to profile badges tab to maintain user experience
    redirect(`/${params.identifier}/badges`);
  }
}
