"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useProfileCredentials } from "./useProfileCredentials";
import { useUserCategory } from "./useUserCategory";
import {
  processCreatorCategories,
  CreatorCategoryBreakdown,
  CREATOR_CATEGORIES,
  type CreatorCategoryType,
} from "@/lib/credentialUtils";

export function useCreatorCategory(talentUUID: string) {
  const { credentials, loading, error } = useProfileCredentials(talentUUID);
  const { userCategory } = useUserCategory(talentUUID);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Auto-refresh when userCategory changes
  useEffect(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, [userCategory]);

  // Manual refresh method for explicit updates
  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const data = useMemo(() => {
    if (!credentials || credentials.length === 0) {
      return null;
    }

    const algorithmicData = processCreatorCategories(credentials);

    // If user has self-reported a category, use that as primary
    if (userCategory) {
      return {
        ...algorithmicData,
        primaryCategory: {
          name: userCategory,
          emoji: CREATOR_CATEGORIES[userCategory],
          points: algorithmicData.primaryCategory.points,
          maxPoints: algorithmicData.primaryCategory.maxPoints,
          completionPercentage:
            algorithmicData.primaryCategory.completionPercentage,
        },
        // Keep the algorithmic categories for the breakdown view
        categories: algorithmicData.categories,
      };
    }

    return algorithmicData;
  }, [credentials, userCategory, refreshTrigger]);

  return { data, loading, error, refresh };
}
