import { getTalentUserService } from "@/app/services/userService";
import { getBadgeDetail } from "@/app/services/badgesService";
import {
  getAllBadgeSlugs,
  getBadgeContent,
  getBadgeMaxLevel,
} from "@/lib/badge-content";
import { RESERVED_WORDS } from "@/lib/constants";

import { BadgeCard } from "@/components/badges";
import { Callout } from "@/components/common/Callout";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";
import { Typography } from "@/components/ui/typography";
import { Medal, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";
import { PublicBadgeTracker } from "./PublicBadgeTracker";

interface PublicBadgePageProps {
  params: {
    identifier: string;
    badgeSlug: string;
    level: string;
  };
}

/**
 * PUBLIC BADGE PAGE
 *
 * Displays individual badge achievements with SEO-optimized metadata.
 * Only shows earned badges (levels 1-6), returns 404 for level 0 or invalid data.
 *
 * Features:
 * - Server-side rendering for optimal SEO
 * - Input validation (badge slug, level range, user exists)
 * - Visitor call-to-action using Callout component
 * - Consistent 404s (no information leakage)
 * - Simple analytics tracking
 */
export default async function PublicBadgePage({
  params,
}: PublicBadgePageProps) {
  // Extract level as number
  const level = parseInt(params.level);

  // 1. Input validation
  if (RESERVED_WORDS.includes(params.identifier)) {
    notFound();
  }

  // Validate badge slug exists
  const allBadgeSlugs = getAllBadgeSlugs();
  if (!allBadgeSlugs.includes(params.badgeSlug)) {
    notFound();
  }

  // Validate level is a valid number
  if (isNaN(level) || level < 1) {
    notFound();
  }

  // Check level doesn't exceed badge maximum
  const maxLevel = getBadgeMaxLevel(params.badgeSlug);
  if (level > maxLevel) {
    notFound();
  }

  // 2. Resolve user (server-side)
  const user = await getTalentUserService(params.identifier);
  if (!user || !user.id) {
    notFound();
  }

  // Redirect to canonical identifier if needed
  const canonical = user.fname || user.wallet || user.id;
  if (canonical && params.identifier !== canonical) {
    redirect(`/${canonical}/badges/${params.badgeSlug}/level-${level}`);
  }

  // 3. Fetch badge data (server-side with caching)
  const badge = await unstable_cache(
    async () => getBadgeDetail(user.id!, params.badgeSlug)(),
    [`public-badge-${user.id}-${params.badgeSlug}`],
    {
      revalidate: CACHE_DURATION_5_MINUTES,
      tags: [
        `${CACHE_KEYS.USER_BADGES}-${user.id}`,
        `public-badge-${user.id}-${params.badgeSlug}`,
      ],
    },
  )();

  if (!badge) {
    notFound();
  }

  // 4. Validate user has earned this level (no information leakage)
  if (badge.currentLevel < level) {
    notFound();
  }

  // 5. Get badge content for display
  const badgeContent = getBadgeContent(params.badgeSlug);
  if (!badgeContent) {
    notFound();
  }

  // 6. Prepare display data
  const displayName = (user.display_name || user.name || "Creator") as string;

  return (
    <PageContainer>
      {/* Header with back navigation */}
      <Section variant="header">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/${params.identifier}`}>
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <Typography as="h1" size="xl" weight="bold">
              {displayName}&apos;s {badgeContent.title}
            </Typography>
            <Typography size="sm" color="muted">
              Level {level} Achievement
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
              {badge.levelLabel}
            </Typography>
            <Typography size="base" color="muted" className="max-w-md">
              {badge.description}
            </Typography>
          </div>

          {/* Progress indicator */}
          {!badgeContent.isStreakBadge && (
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-sm">
                <Typography size="sm" color="muted">
                  Progress
                </Typography>
                <Typography size="sm" color="muted">
                  {badge.isMaxLevel
                    ? "Max Level"
                    : `Level ${badge.currentLevel}/${badge.maxLevel}`}
                </Typography>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-brand-purple"
                  style={{
                    width: badge.isMaxLevel
                      ? "100%"
                      : `${(badge.currentLevel / badge.maxLevel) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Visitor call-to-action */}
      <Section variant="content">
        <Callout
          variant="brand-purple"
          title="Check Your Own Badges"
          description="Discover what badges you can unlock in the Creator Score app"
          href="/badges"
          icon={<Medal className="h-5 w-5" />}
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
        badgeLevel={level}
        badgeTitle={badgeContent.title}
        viewedUserTalentUUID={user.id!}
      />
    </PageContainer>
  );
}

// Enable static generation for popular badge combinations
export async function generateStaticParams() {
  const allBadgeSlugs = getAllBadgeSlugs();

  // Generate common level combinations (levels 1-3 for all badges)
  const staticParams = [];
  for (const badgeSlug of allBadgeSlugs) {
    const maxLevel = getBadgeMaxLevel(badgeSlug);
    // Generate first 3 levels for each badge (most common)
    for (let level = 1; level <= Math.min(3, maxLevel); level++) {
      staticParams.push({
        identifier: "[identifier]", // Will be filled at build time
        badgeSlug,
        level: level.toString(),
      });
    }
  }

  return staticParams;
}

// Caching configuration
export const revalidate = 300; // 5 minutes
