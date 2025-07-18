"use client";

import { useState, useEffect } from "react";
import { CreatorCategoryType } from "@/lib/credentialUtils";

const STORAGE_KEY = "user_creator_category";

export function useUserCategory(talentUUID: string) {
  const [userCategory, setUserCategory] = useState<CreatorCategoryType | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // Load category from localStorage on mount
  useEffect(() => {
    if (!talentUUID) {
      setLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${talentUUID}`);
      if (stored) {
        const category = stored as CreatorCategoryType;
        setUserCategory(category);
      }
    } catch (error) {
      console.error("Error loading user category from localStorage:", error);
    } finally {
      setLoading(false);
    }
  }, [talentUUID]);

  // Update category in localStorage
  const updateCategory = (category: CreatorCategoryType) => {
    if (!talentUUID) return;

    try {
      localStorage.setItem(`${STORAGE_KEY}_${talentUUID}`, category);
      setUserCategory(category);
    } catch (error) {
      console.error("Error saving user category to localStorage:", error);
    }
  };

  // Clear category from localStorage
  const clearCategory = () => {
    if (!talentUUID) return;

    try {
      localStorage.removeItem(`${STORAGE_KEY}_${talentUUID}`);
      setUserCategory(null);
    } catch (error) {
      console.error("Error clearing user category from localStorage:", error);
    }
  };

  return {
    userCategory,
    loading,
    updateCategory,
    clearCategory,
  };
}
