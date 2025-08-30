"use client";

import { HowToEarnModal } from "@/components/modals/HowToEarnModal";
import { useAutoModal } from "@/hooks/useAutoModal";

export function HowToEarnModalHandler() {
  const { isOpen, onOpenChange, hasSeenModal } = useAutoModal({
    databaseField: "how_to_earn_modal_seen",
    autoOpen: true,
  });

  // Don't render modal if user has already seen it
  if (hasSeenModal) {
    return null;
  }

  return <HowToEarnModal open={isOpen} onOpenChange={onOpenChange} />;
}
