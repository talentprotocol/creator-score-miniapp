import { useCallback, useEffect, useState } from "react";
import { useFidToTalentUuid } from "./useUserResolution";

const STORAGE_KEY = "share-creator-score-seen";

export function useShareCreatorScore(autoOpen: boolean = false) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true); // Default to true to prevent flash
  // add check for talentUuid, because if we don't have it, we don't want to show the modal
  const { talentUuid } = useFidToTalentUuid();

  useEffect(() => {
    // Only auto-open when explicitly enabled (e.g., via WelcomeModalHandler)
    if (!autoOpen) return;
    if (talentUuid) {
      const seen = localStorage.getItem(STORAGE_KEY);
      setHasSeenWelcome(!!seen);
      setIsOpen(!seen);
    }
  }, [talentUuid, autoOpen]);

  const onOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Mark as seen when closing
      localStorage.setItem(STORAGE_KEY, "true");
      setHasSeenWelcome(true);
    }
  }, []);

  const openForTesting = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    hasSeenWelcome,
    onOpenChange,
    openForTesting,
  };
}
