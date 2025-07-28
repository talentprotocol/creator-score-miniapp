import { useCallback, useEffect, useState } from "react";
import { useUserResolution } from "./useUserResolution";

const STORAGE_KEY = "share-creator-score-seen";

export function useShareCreatorScore() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true); // Default to true to prevent flash
  // add check for talentUuid, because if we don't have it, we don't want to show the modal
  const { talentUuid } = useUserResolution();

  useEffect(() => {
    // Check local storage on mount
    if (talentUuid) {
      const seen = localStorage.getItem(STORAGE_KEY);
      setHasSeenWelcome(!!seen);
      setIsOpen(!seen);
    }
  }, [talentUuid]);

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
