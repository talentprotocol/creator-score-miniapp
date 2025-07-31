"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { openExternalUrl } from "@/lib/utils";
import { usePostHog } from "posthog-js/react";

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
}

interface AccountManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountType: "social" | "wallet";
}

export function AccountManagementModal({
  open,
  onOpenChange,
  accountType,
}: AccountManagementModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const posthog = usePostHog();

  const handleManageAccounts = () => {
    // Track manage accounts click
    posthog?.capture("settings_modal_manage_clicked", {
      account_type: accountType,
      is_own_profile: true,
    });

    openExternalUrl("https://app.talentprotocol.com/accounts").catch(
      (error) => {
        console.error("Failed to open external URL:", error);
      },
    );
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Track cancel click
    posthog?.capture("settings_modal_cancel_clicked", {
      account_type: accountType,
      is_own_profile: true,
    });

    onOpenChange(false);
  };

  const accountTypeLabel =
    accountType === "social" ? "social accounts" : "wallets";

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage {accountTypeLabel}</DialogTitle>
            <DialogDescription>
              Manage your {accountTypeLabel} in the Talent Protocol app for
              secure account verification.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleManageAccounts}
              styling="brand"
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Manage in Talent App
            </Button>
            <Button styling="default" onClick={handleCancel} className="w-full">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={true}>
      <DrawerContent className="max-w-sm mx-auto w-full p-4 rounded-t-2xl">
        <DrawerHeader>
          <DrawerTitle>Manage {accountTypeLabel}</DrawerTitle>
          <DrawerDescription>
            Manage your {accountTypeLabel} in the Talent Protocol app for secure
            account verification.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-2 mt-4">
          <Button
            onClick={handleManageAccounts}
            styling="brand"
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Manage in Talent App
          </Button>
          <Button styling="default" onClick={handleCancel} className="w-full">
            Cancel
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
