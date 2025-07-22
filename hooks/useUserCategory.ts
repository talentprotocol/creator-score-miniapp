"use client";

import { useState, useEffect } from "react";
import type { CreatorCategory } from "@/lib/types/user-preferences";

export function useUserCategory(talentUUID: string) {
  const [userCategory, setUserCategory] = useState<CreatorCategory | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load category from API on mount
  useEffect(() => {
    if (!talentUUID) {
      setLoading(false);
      return;
    }

    async function loadCategory() {
      try {
        setError(null);
        const response = await fetch(
          `/api/user-preferences?talent_uuid=${talentUUID}`,
        );

        if (response.ok) {
          const data = await response.json();
          setUserCategory(data.creator_category);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to load category");
        }
      } catch (error) {
        console.error("Error loading user category:", error);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadCategory();
  }, [talentUUID]);

  // Update category via API
  const updateCategory = async (category: CreatorCategory) => {
    if (!talentUUID) return;

    try {
      setError(null);
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
        const errorData = await response.json();
        setError(errorData.error || "Failed to update category");
        throw new Error(errorData.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Error saving user category:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to save category");
      }
      throw error;
    }
  };

  // Clear category (set to null in database)
  const clearCategory = async () => {
    if (!talentUUID) return;

    try {
      setError(null);
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
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to clear category");
        throw new Error(errorData.error || "Failed to clear category");
      }
    } catch (error) {
      console.error("Error clearing user category:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to clear category");
      }
      throw error;
    }
  };

  return {
    userCategory,
    loading,
    error,
    updateCategory,
    clearCategory,
  };
}
