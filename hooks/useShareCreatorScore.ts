import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "share-creator-score-seen";

export function useShareCreatorScore() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true); // Default to true to prevent flash

  useEffect(() => {
    // Check local storage on mount
    const seen = localStorage.getItem(STORAGE_KEY);
    setHasSeenWelcome(!!seen);
  }, []);

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
