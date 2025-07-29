"use client";

import { Button } from "@/components/ui/button";
import { ShareCreatorScoreModal } from "@/components/modals/ShareCreatorScoreModal";
import { useShareCreatorScore } from "@/hooks/useShareCreatorScore";

export function TestShareScoreButton() {
  const { isOpen, onOpenChange, openForTesting } = useShareCreatorScore();

  return (
    <>
      <Button variant="destructive" onClick={openForTesting} className="w-full">
        Test Share Score Modal
      </Button>
      <ShareCreatorScoreModal open={isOpen} onOpenChange={onOpenChange} />
    </>
  );
}
