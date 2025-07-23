"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useProfileCredentials } from "./useProfileCredentials";
import { useUserCategory } from "./useUserCategory";
import {
  processCreatorCategories,
  CreatorCategoryBreakdown,
  CREATOR_CATEGORIES,
} from "@/lib/credentialUtils";
import type { CreatorCategory } from "@/lib/types/user-preferences";

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
  const hasClearedCategory = useRef(false);

  // Auto-refresh when userCategory changes
  useEffect(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, [userCategory]);

  // Manual refresh method for explicit updates
  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Handle clearing category when no credentials exist
  useEffect(() => {
    if (!credentials || credentials.length === 0) {
      if (userCategory && !hasClearedCategory.current) {
        hasClearedCategory.current = true;
        clearCategory();
      }
    } else {
      hasClearedCategory.current = false;
    }
  }, [credentials, userCategory, clearCategory]);

  // Handle clearing category when no algorithmic category exists
  useEffect(() => {
    if (credentials && credentials.length > 0) {
      const algorithmicData = processCreatorCategories(credentials);
      if (
        !algorithmicData.primaryCategory &&
        userCategory &&
        !hasClearedCategory.current
      ) {
        hasClearedCategory.current = true;
        clearCategory();
      }
    }
  }, [credentials, userCategory, clearCategory]);

  // Handle saving algorithmic category
  useEffect(() => {
    if (credentials && credentials.length > 0) {
      const algorithmicData = processCreatorCategories(credentials);

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
        updateCategory(algorithmicData.primaryCategory.name as CreatorCategory);
      }
    }
  }, [credentials, userCategory, updateCategory]);

  const data = useMemo(() => {
    if (!credentials || credentials.length === 0) {
      return null;
    }

    const algorithmicData = processCreatorCategories(credentials);

    // If no algorithmic category (no points), return null
    if (!algorithmicData.primaryCategory) {
      return null;
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
  }, [credentials, userCategory, refreshTrigger]);

  return { data, loading, error, refresh };
}
