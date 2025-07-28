import { useState, useEffect } from "react";
import { useUserCreatorScore } from "./useUserCreatorScore";
import { useUserResolution } from "./useUserResolution";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";

const WELCOME_MODAL_SHOWN_KEY = "creator-score-welcome-shown";

const checkLocalStorage = () => {
  try {
    localStorage.setItem("test", "test");
    localStorage.removeItem("test");
    return true;
  } catch (e) {
    return false;
  }
};

export function useWelcomeModal() {
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const { talentUuid } = useUserResolution();
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const { creatorScore, loading } = useUserCreatorScore(user?.fid);

  useEffect(() => {
    // Only run this effect when loading is complete and we have data
    if (loading) return;

    try {
      // Check if localStorage is available
      if (!checkLocalStorage()) {
        return;
      }

      // Check if user has seen the modal before
      const hasSeenModal = localStorage.getItem(WELCOME_MODAL_SHOWN_KEY);

      // Show modal if:
      // 1. User is authenticated (has talentUuid)
      // 2. User has a creator score > 0
      // 3. User hasn't seen the modal before
      if (talentUuid && creatorScore && creatorScore > 0 && !hasSeenModal) {
        setShouldShowModal(true);
      }
    } catch (error) {
      // If there's any error with localStorage, don't show the modal
      console.error("Error checking welcome modal state:", error);
    }
  }, [loading, talentUuid, creatorScore]);

  const markModalAsShown = () => {
    try {
      if (checkLocalStorage()) {
        localStorage.setItem(WELCOME_MODAL_SHOWN_KEY, "true");
      }
      setShouldShowModal(false);
    } catch (error) {
      // If there's any error with localStorage, just close the modal
      console.error("Error marking modal as shown:", error);
      setShouldShowModal(false);
    }
  };

  return {
    shouldShowModal,
    markModalAsShown,
  };
}
