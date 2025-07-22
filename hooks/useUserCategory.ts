"use client";

import { useState, useEffect } from "react";
import { CreatorCategoryType } from "@/lib/credentialUtils";

export function useUserCategory(talentUUID: string) {
  const [userCategory, setUserCategory] = useState<CreatorCategoryType | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // Load category from API on mount
  useEffect(() => {
    if (!talentUUID) {
      setLoading(false);
      return;
    }

    async function loadCategory() {
      try {
        const response = await fetch(
          `/api/user-preferences?talent_uuid=${talentUUID}`,
        );
        if (response.ok) {
          const data = await response.json();
          if (data.creator_category) {
            setUserCategory(data.creator_category as CreatorCategoryType);
          }
        }
      } catch (error) {
        console.error("Error loading user category:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCategory();
  }, [talentUUID]);

  // Update category via API
  const updateCategory = async (category: CreatorCategoryType) => {
    if (!talentUUID) return;

    try {
      const response = await fetch("/api/user-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          talent_uuid: talentUUID,
          creator_category: category,
        }),
      });

      if (response.ok) {
        setUserCategory(category);
      } else {
        console.error("Failed to update category");
      }
    } catch (error) {
      console.error("Error saving user category:", error);
    }
  };

  // Clear category (set to null in database)
  const clearCategory = async () => {
    if (!talentUUID) return;

    try {
      const response = await fetch("/api/user-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          talent_uuid: talentUUID,
          creator_category: null,
        }),
      });

      if (response.ok) {
        setUserCategory(null);
      }
    } catch (error) {
      console.error("Error clearing user category:", error);
    }
  };

  return {
    userCategory,
    loading,
    updateCategory,
    clearCategory,
  };
}
