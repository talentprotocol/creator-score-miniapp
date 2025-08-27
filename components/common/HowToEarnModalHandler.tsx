"use client";

import { HowToEarnModal } from "@/components/modals/HowToEarnModal";
import { useAutoModal } from "@/hooks/useAutoModal";
import { ROUND_ENDS_AT } from "@/lib/constants";

export function HowToEarnModalHandler() {
  const { isOpen, onOpenChange, hasSeenModal } = useAutoModal({
    storageKey: "how-to-earn-modal-seen",
    databaseField: "how_to_earn_modal_seen",
    checkDate: ROUND_ENDS_AT,
    autoOpen: true,
  });

  console.log("HowToEarnModalHandler render:", { isOpen, hasSeenModal });

  // Don't render modal if user has already seen it
  if (hasSeenModal) {
    console.log("User has seen modal, not rendering");
    return null;
  }

  console.log("User hasn't seen modal, rendering modal");
  return <HowToEarnModal open={isOpen} onOpenChange={onOpenChange} />;
}
