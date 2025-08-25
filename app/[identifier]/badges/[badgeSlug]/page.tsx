import { getTalentUserService } from "@/app/services/userService";
import { getBadgeDetail } from "@/app/services/badgesService";
import { getAllBadgeSlugs, getBadgeContent } from "@/lib/badge-content";
import { RESERVED_WORDS } from "@/lib/constants";
import { BadgeCard } from "@/components/badges";
import { Callout } from "@/components/common/Callout";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";
import { PublicBadgeTracker } from "./PublicBadgeTracker";

interface PublicBadgePageProps {
  params: {
    identifier: string;
    badgeSlug: string;
  };
}

/**
 * PUBLIC BADGE PAGE
 *
 * Shows a specific badge for a user at their current level.
 * Only earned badges (level > 0) are publicly accessible.
 *
 * Route: /[identifier]/badges/[badgeSlug]
 * Example: /alice/badges/creator-score
 */

export async function generateStaticParams() {
  const allBadgeSlugs = getAllBadgeSlugs();

  // Generate static params for all badge slugs
  const staticParams = [];
  for (const badgeSlug of allBadgeSlugs) {
    staticParams.push({
      identifier: "[identifier]", // Will be filled at build time
      badgeSlug: badgeSlug,
    });
  }

  return staticParams.slice(0, 50); // Limit for build performance
}

const getCachedUserService = unstable_cache(
  async (identifier: string) => {
    return getTalentUserService(identifier);
  },
  [CACHE_KEYS.USER_PROFILE],
  { revalidate: CACHE_DURATION_5_MINUTES },
);

export default async function PublicBadgePage({
  params,
}: PublicBadgePageProps) {
  try {
    // 1. Validate badge slug exists
    const allBadgeSlugs = getAllBadgeSlugs();
    if (!allBadgeSlugs.includes(params.badgeSlug)) {
      console.log(`[PublicBadgePage] Badge slug not found: ${params.badgeSlug}`);
      notFound();
    }

    // 2. Check if identifier is reserved
    if (RESERVED_WORDS.includes(params.identifier)) {
      console.log(`[PublicBadgePage] Reserved identifier: ${params.identifier}`);
      notFound();
    }

    // 3. Resolve user
    console.log(`[PublicBadgePage] Resolving user: ${params.identifier}`);
    const user = await getCachedUserService(params.identifier);
    if (!user?.id) {
      console.log(`[PublicBadgePage] User not found or no ID: ${params.identifier}`, user);
      notFound();
    }

    // 4. Get badge data
    console.log(`[PublicBadgePage] Getting badge data for user ${user.id}, badge ${params.badgeSlug}`);
    const badge = await getBadgeDetail(user.id, params.badgeSlug)();
    if (!badge) {
      console.log(`[PublicBadgePage] Badge not found for user ${user.id}, badge ${params.badgeSlug}`);
      notFound();
    }

    // 5. Only show earned badges (level > 0)
    if (badge.currentLevel <= 0) {
      console.log(`[PublicBadgePage] Badge not earned (level ${badge.currentLevel}) for user ${user.id}, badge ${params.badgeSlug}`);
      notFound();
    }

    // 6. Get badge content configuration
    const badgeContent = getBadgeContent(params.badgeSlug);
    if (!badgeContent) {
      console.log(`[PublicBadgePage] Badge content config not found: ${params.badgeSlug}`);
      notFound();
    }

    console.log(`[PublicBadgePage] Successfully loaded badge page for ${params.identifier}/${params.badgeSlug}`);

    // 7. Prepare display data
    const displayName = (user.display_name || user.name || "Creator") as string;

    return (
      <PageContainer>
        {/* Header with back navigation */}
        <Section variant="header">
          <div className="flex items-center gap-3">
            <Link href={`/${params.identifier}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <Typography as="h1" size="xl" weight="bold">
                {displayName}&apos;s {badgeContent.title}
              </Typography>
              <Typography size="sm" color="muted">
                Level {badge.currentLevel} Achievement
              </Typography>
            </div>
          </div>
        </Section>

        {/* Badge showcase */}
        <Section variant="content">
          <div className="flex flex-col items-center space-y-6 text-center">
            {/* Large badge display */}
            <div className="w-64 h-64">
              <BadgeCard
                badge={badge}
                onBadgeClick={() => {}} // No interaction needed for public view
                priority={true}
              />
            </div>

            {/* Badge details */}
            <div className="space-y-2">
              <Typography as="h2" size="lg" weight="bold">
                {badgeContent.title}
              </Typography>
              <Typography color="muted" className="max-w-md">
                {badgeContent.description}
              </Typography>
            </div>
          </div>
        </Section>

        {/* Call-to-action for visitors */}
        <Section variant="content">
          <Callout
            variant="brand-purple"
            title="Check Your Own Badges"
            description="See what badges you've earned and track your progress."
            href="/badges"
          />
        </Section>

        {/* View full profile CTA */}
        <Section variant="content">
          <div className="text-center">
            <Link href={`/${params.identifier}`}>
              <Button variant="default" className="w-full">
                View {displayName}&apos;s Full Profile
              </Button>
            </Link>
          </div>
        </Section>

        {/* Analytics tracking (client component) */}
        <PublicBadgeTracker
          badgeSlug={params.badgeSlug}
          badgeLevel={badge.currentLevel}
          badgeTitle={badgeContent.title}
          viewedUserTalentUUID={user.id!}
        />
      </PageContainer>
    );
  } catch (error) {
    console.error(`[PublicBadgePage] Error loading badge page:`, error);
    notFound();
  }
}
