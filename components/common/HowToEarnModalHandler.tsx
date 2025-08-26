"use client";

import { HowToEarnModal } from "@/components/modals/HowToEarnModal";
import { useAutoModal } from "@/hooks/useAutoModal";
import { ROUND_ENDS_AT } from "@/lib/constants";

export function HowToEarnModalHandler() {
  const { isOpen, onOpenChange } = useAutoModal({
    storageKey: "how-to-earn-modal-seen",
    databaseField: "how_to_earn_modal_seen",
    checkDate: ROUND_ENDS_AT,
    autoOpen: true,
  });

  return <HowToEarnModal open={isOpen} onOpenChange={onOpenChange} />;
}
