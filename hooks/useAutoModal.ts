import { useCallback, useEffect, useState } from "react";
import { useFidToTalentUuid } from "./useUserResolution";

export interface AutoModalConfig {
  storageKey: string;
  databaseField?: string; // Field name in user_preferences table
  checkDate?: Date; // Optional date check (e.g., ROUND_ENDS_AT)
  autoOpen?: boolean;
}

export function useAutoModal(config: AutoModalConfig) {
  const { storageKey, databaseField, checkDate, autoOpen = false } = config;
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenModal, setHasSeenModal] = useState(true); // Default to true to prevent flash
  const [isLoading, setIsLoading] = useState(true); // Track loading state
  const { talentUuid } = useFidToTalentUuid();

  useEffect(() => {
    // Only auto-open when explicitly enabled
    if (!autoOpen) {
      setIsLoading(false);
      return;
    }

    // Check if date condition is met (e.g., rewards period ended)
    if (checkDate && new Date() >= checkDate) {
      setIsLoading(false);
      return;
    }

    // For authenticated users with database field, check user preferences
    if (talentUuid && databaseField) {
      checkUserPreferences();
    } else {
      // For non-authenticated users or no database field, use localStorage
      const seen = localStorage.getItem(storageKey);
      setHasSeenModal(!!seen);
      setIsOpen(!seen);
      setIsLoading(false);
    }
  }, [talentUuid, autoOpen, storageKey, databaseField, checkDate]);

  const checkUserPreferences = async () => {
    try {
      const url = `/api/user-preferences?talent_uuid=${encodeURIComponent(talentUuid!)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load prefs: ${res.status}`);
      const json = await res.json();
      const hasSeen = json[databaseField!] ?? false;
      setHasSeenModal(hasSeen);
      setIsOpen(!hasSeen);
    } catch (e) {
      // Fallback to localStorage if API fails
      const seen = localStorage.getItem(storageKey);
      setHasSeenModal(!!seen);
      setIsOpen(!seen);
    } finally {
      setIsLoading(false);
    }
  };

  const onOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        // Mark as seen when closing
        if (talentUuid && databaseField) {
          markAsSeenInDatabase();
        } else {
          localStorage.setItem(storageKey, "true");
        }
        setHasSeenModal(true);
      }
    },
    [talentUuid, databaseField, storageKey],
  );

  const markAsSeenInDatabase = async () => {
    try {
      const res = await fetch(`/api/user-preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talent_uuid: talentUuid,
          creator_category: null,
          [databaseField!]: true,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to persist modal seen: ${res.status}`);
      }
    } catch (e) {
      console.error("Failed to mark modal as seen:", e);
      // Fallback to localStorage
      localStorage.setItem(storageKey, "true");
    }
  };

  const openForTesting = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    hasSeenModal,
    isLoading,
    onOpenChange,
    openForTesting,
  };
}
