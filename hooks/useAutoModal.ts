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
  const [hasSeenModal, setHasSeenModal] = useState(true); // Default to true to prevent flash
  const { talentUuid } = useFidToTalentUuid();

  console.log("useAutoModal render:", {
    hasSeenModal,
    autoOpen,
    talentUuid,
    databaseField,
  });

  useEffect(() => {
    console.log("useAutoModal useEffect:", {
      autoOpen,
      checkDate,
      talentUuid,
      databaseField,
    });

    // Only auto-open when explicitly enabled
    if (!autoOpen) {
      console.log("Auto-open disabled, returning");
      return;
    }

    // Check if date condition is met (e.g., rewards period ended)
    if (checkDate && new Date() >= checkDate) {
      console.log("Date check failed, returning");
      return;
    }

    // Wait for talentUuid to be resolved before making decisions
    if (talentUuid === null) {
      console.log("Waiting for talentUuid to be resolved");
      return;
    }

    // Only proceed if we have both talentUuid and databaseField
    if (talentUuid && databaseField) {
      console.log("Checking user preferences in database");
      checkUserPreferences();
    } else {
      console.log("Missing talentUuid or databaseField, modal will not show");
      // For non-authenticated users or missing config, don't show modal
      setHasSeenModal(true);
    }
  }, [talentUuid, autoOpen, storageKey, databaseField, checkDate]);

  const checkUserPreferences = async () => {
    try {
      const url = `/api/user-preferences?talent_uuid=${encodeURIComponent(talentUuid!)}`;
      console.log("Fetching user preferences from:", url);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load prefs: ${res.status}`);
      const json = await res.json();
      const hasSeen = json[databaseField!] ?? false;
      console.log("Database response:", { json, databaseField, hasSeen });
      setHasSeenModal(hasSeen);
    } catch (e) {
      console.error("API call failed:", e);
      // If API fails, assume user has seen modal to prevent flash
      setHasSeenModal(true);
    }
  };

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Mark as seen when closing
        if (talentUuid && databaseField) {
          markAsSeenInDatabase();
        }
        setHasSeenModal(true);
      }
    },
    [talentUuid, databaseField],
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
      // No fallback needed - user will see modal again next time
    }
  };

  const openForTesting = useCallback(() => {
    setHasSeenModal(false);
  }, []);

  // Modal should be open when user hasn't seen it and autoOpen is enabled
  const isOpen = !hasSeenModal && autoOpen;

  return {
    isOpen,
    hasSeenModal,
    onOpenChange,
    openForTesting,
  };
}
