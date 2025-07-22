"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useProfileCredentials } from "./useProfileCredentials";
import { useUserCategory } from "./useUserCategory";
import {
  processCreatorCategories,
  CreatorCategoryBreakdown,
  CREATOR_CATEGORIES,
  type CreatorCategoryType,
} from "@/lib/credentialUtils";

export function useCreatorCategory(talentUUID: string) {
  // If no talentUUID, don't make any API calls
  const { credentials, loading, error } = useProfileCredentials(
    talentUUID || "",
  );
  const { userCategory, updateCategory, clearCategory } = useUserCategory(
    talentUUID || "",
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const hasSavedAlgorithmic = useRef(false);

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
      // If no credentials, clear any existing category
      if (userCategory) {
        setTimeout(() => {
          clearCategory();
        }, 0);
      }
      return null;
    }

    const algorithmicData = processCreatorCategories(credentials);

    // If no algorithmic category (no points), clear any existing category
    if (!algorithmicData.primaryCategory && userCategory) {
      setTimeout(() => {
        clearCategory();
      }, 0);
      return null;
    }

    // Save algorithmic category to database if:
    // 1. No manual category exists
    // 2. Algorithmic category has meaningful points (not null)
    // 3. Haven't already saved this algorithmic category
    if (
      !userCategory &&
      !hasSavedAlgorithmic.current &&
      algorithmicData.primaryCategory &&
      algorithmicData.primaryCategory.points > 0
    ) {
      hasSavedAlgorithmic.current = true;
      // Use setTimeout to avoid blocking the render
      setTimeout(() => {
        updateCategory(algorithmicData.primaryCategory!.name);
      }, 0);
    }

    // If user has self-reported a category, use that as primary
    if (userCategory) {
      return {
        ...algorithmicData,
        primaryCategory: {
          name: userCategory,
          emoji: CREATOR_CATEGORIES[userCategory],
          points: algorithmicData.primaryCategory?.points || 0,
          maxPoints: algorithmicData.primaryCategory?.maxPoints || 0,
          completionPercentage:
            algorithmicData.primaryCategory?.completionPercentage || 0,
        },
        // Keep the algorithmic categories for the breakdown view
        categories: algorithmicData.categories,
      };
    }

    return algorithmicData;
  }, [
    credentials,
    userCategory,
    refreshTrigger,
    updateCategory,
    clearCategory,
  ]);

  return { data, loading, error, refresh };
}
