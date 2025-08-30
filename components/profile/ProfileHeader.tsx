"use client";

import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PfpBorder } from "@/components/ui/pfp-border";
import { ChevronUp, ChevronDown, Sparkles } from "lucide-react";

import { ProfileAccountsSheet } from "./ProfileAccountsSheet";
import { useUserCategory } from "@/hooks/useUserCategory";
import { useCreatorCategory } from "@/hooks/useCreatorCategory";
import { useProfileContext } from "@/contexts/ProfileContext";
import {
  processCreatorCategories,
  CREATOR_CATEGORIES,
} from "@/lib/credentialUtils";
import { CategorySelectionModal } from "./CategorySelectionModal";
import type { SocialAccount } from "@/lib/types";
import type { CreatorCategoryType } from "@/lib/credentialUtils";
import { usePostHog } from "posthog-js/react";

export function ProfileHeader({
  followers,
  displayName,
  profileImage,
  bio,
  socialAccounts = [],
  talentUUID,
  isOwnProfile = false,
  hasCreatorScore = false,
  rank,
}: {
  followers?: string;
  displayName?: string;
  profileImage?: string;
  bio?: string;
  socialAccounts?: SocialAccount[];
  talentUUID?: string;
  isOwnProfile?: boolean;
  hasCreatorScore?: boolean;
  rank?: number;
}) {
  // Get category data from ProfileContext instead of making API calls
  const { profileData } = useProfileContext();
  const categoryData = profileData?.credentials
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processCreatorCategories(profileData.credentials as any)
    : null;
  // Only run category logic for own profile to avoid unnecessary DB queries
  const { userCategory, updateCategory } = useUserCategory(
    isOwnProfile ? talentUUID || "" : "",
  );
  // This hook handles automatic saving of algorithmic categories
  useCreatorCategory(isOwnProfile ? talentUUID || "" : "");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [pendingCategory, setPendingCategory] =
    React.useState<CreatorCategoryType | null>(null);
  const posthog = usePostHog();

  // Clear pending category when userCategory updates from the hook
  React.useEffect(() => {
    if (userCategory && pendingCategory && userCategory === pendingCategory) {
      setPendingCategory(null);
    }
  }, [userCategory, pendingCategory]);

  // Get the category to display (pending takes priority for immediate feedback)
  const displayCategory = React.useMemo(() => {
    // For own profile: use pending, manual, or algorithmic category
    // For public profiles: only use algorithmic category (no manual data)
    const categoryName = isOwnProfile
      ? pendingCategory || userCategory || categoryData?.primaryCategory?.name
      : categoryData?.primaryCategory?.name;

    if (!categoryName) return null;

    return {
      name: categoryName as CreatorCategoryType,
      emoji: CREATOR_CATEGORIES[
        categoryName as keyof typeof CREATOR_CATEGORIES
      ] as string,
    };
  }, [
    isOwnProfile,
    pendingCategory,
    userCategory,
    categoryData?.primaryCategory,
  ]);

  const name = displayName || "Unknown Creator";
  const image = profileImage; // No fallback - let AvatarFallback handle it with initials

  const [isBioExpanded, setIsBioExpanded] = React.useState(false);

  // Bio truncation logic
  const truncatedBio =
    bio && bio.length > 100 ? bio.slice(0, 100) + "..." : bio;
  const shouldShowExpand = bio && bio.length > 100;

  // Handle category selection
  const handleCategorySelect = (category: CreatorCategoryType) => {
    // Track category selection
    posthog?.capture("profile_category_selected", {
      category,
      previous_category: userCategory,
      is_own_profile: isOwnProfile,
      has_creator_score: hasCreatorScore,
    });

    // Set pending category for immediate UI feedback
    setPendingCategory(category);
    // Update the actual category in storage
    updateCategory(category);
    // Close modal immediately
    setIsCategoryModalOpen(false);
  };

  // Handle category modal open
  const handleCategoryClick = () => {
    if (isOwnProfile && hasCreatorScore) {
      // Track category modal open
      posthog?.capture("profile_category_modal_opened", {
        current_category: userCategory,
        is_own_profile: isOwnProfile,
        has_creator_score: hasCreatorScore,
      });
      setIsCategoryModalOpen(true);
    }
  };

  // Show category badge only if user has a creator score
  const shouldShowCategory = hasCreatorScore && displayCategory;

  return (
    <>
      <div className="flex flex-col w-full gap-3">
        {/* Header with name and avatar */}
        <div className="flex items-center justify-between w-full gap-4">
          {/* Left: Name, dropdown, stats */}
          <div className="flex-1 min-w-0">
            <ProfileAccountsSheet
              name={name}
              socialAccounts={socialAccounts}
              talentUUID={talentUUID}
            />
            <div className="mt-1 flex flex-col gap-0.5">
              <span className="text-muted-foreground text-sm">
                {rank && (
                  <>
                    <span className="text-muted-foreground text-sm">
                      Creator #{rank}
                    </span>
                    {" • "}
                  </>
                )}
                {followers ?? "—"} followers
                {shouldShowCategory && (
                  <>
                    {" • "}
                    {isOwnProfile ? (
                      <button
                        onClick={handleCategoryClick}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
                      >
                        {displayCategory.emoji} {displayCategory.name}
                        <span className="text-xs opacity-60">Edit</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        <span>{displayCategory.name}</span>
                        <span>{displayCategory.emoji}</span>
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
          </div>
          {/* Right: Profile picture with badge overlay */}
          <div className="relative flex-shrink-0">
            <div className="relative h-16 w-16">
              <Avatar className="h-full w-full">
                <AvatarImage src={image} alt={name} />
                <AvatarFallback>
                  {name ? name[0]?.toUpperCase() : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 pointer-events-none">
                <PfpBorder />
              </div>
            </div>
          </div>
        </div>

        {/* Bio section */}
        {bio && (
          <div>
            <p className="text-sm font-normal text-muted-foreground leading-relaxed">
              {isBioExpanded ? bio : truncatedBio}
            </p>
            {shouldShowExpand && (
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={() => setIsBioExpanded(!isBioExpanded)}
                  className="text-xs font-normal text-muted-foreground hover:text-foreground flex items-center transition-colors"
                >
                  {isBioExpanded ? "Show less" : "Show more"}
                  {isBioExpanded ? (
                    <ChevronUp className="h-3 w-3 ml-0.5" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-0.5" />
                  )}
                </button>
                <div className="hidden">
                  <Sparkles className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">AI</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Relevant followers - always show if available */}
      </div>

      {/* Category Selection Modal */}
      <CategorySelectionModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSelectCategory={handleCategorySelect}
        currentCategory={displayCategory?.name || undefined}
      />
    </>
  );
}
