"use client";

import { ShareCreatorScoreModal } from "@/components/modals/ShareCreatorScoreModal";
import { useShareCreatorScore } from "@/hooks/useShareCreatorScore";

export function WelcomeModalHandler() {
  const { isOpen, onOpenChange } = useShareCreatorScore();

  return <ShareCreatorScoreModal open={isOpen} onOpenChange={onOpenChange} />;
}
