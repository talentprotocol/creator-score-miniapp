"use client";

import { useEffect } from "react";
import { ShareCreatorScoreModal } from "@/components/modals/ShareCreatorScoreModal";
import { useShareCreatorScore } from "@/hooks/useShareCreatorScore";

export function WelcomeModalHandler() {
  const { isOpen, onOpenChange, hasSeenWelcome } = useShareCreatorScore();

  useEffect(() => {
    // Show modal on first visit
    if (!hasSeenWelcome) {
      onOpenChange(true);
    }
  }, [hasSeenWelcome, onOpenChange]);

  return <ShareCreatorScoreModal open={isOpen} onOpenChange={onOpenChange} />;
}
