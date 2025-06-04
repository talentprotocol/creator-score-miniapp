"use client";

import * as React from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function FarcasterWarningModal() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    // Only show warning in production and when not in Farcaster
    if (process.env.NODE_ENV === "production" && !user) {
      setOpen(true);
    }
  }, [user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-[280px] p-4 sm:p-6"
        hideCloseButton
        disableOutsideClick
        disableEscapeKey
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg">Open in Farcaster</DialogTitle>
          <DialogDescription className="text-sm">
            This mini app is designed to be used within Farcaster. Please open
            it in the Farcaster app to access all features.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mt-4">
          <Button
            onClick={() => {
              window.location.href =
                "https://farcaster.xyz/miniapps/A_uWJrE7l5YT/builder-score-miniapp";
            }}
            className="w-full sm:w-auto"
          >
            Open in Farcaster
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
