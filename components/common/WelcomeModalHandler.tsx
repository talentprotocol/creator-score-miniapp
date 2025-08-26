"use client";

import { ShareCreatorScoreModal } from "@/components/modals/ShareCreatorScoreModal";
import { useAutoModal } from "@/hooks/useAutoModal";

export function WelcomeModalHandler() {
  const { isOpen, onOpenChange } = useAutoModal({
    storageKey: "share-creator-score-seen",
    autoOpen: true,
  });

  return <ShareCreatorScoreModal open={isOpen} onOpenChange={onOpenChange} />;
}
