"use client";

import * as React from "react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Copy, ChevronDown, ExternalLink } from "lucide-react";
import { useProfileWalletAddresses } from "@/hooks/useProfileWalletAddresses";
import { truncateAddress, formatK, openExternalUrl } from "@/lib/utils";
import type { SocialAccount } from "@/app/services/types";
import {
  Twitter,
  Linkedin,
  CircleUserRound,
  Github,
  WalletMinimal,
  Sprout,
  BadgeCheck,
  Users,
  Globe,
} from "lucide-react";

interface ProfileAccountsSheetProps {
  name: string;
  fid?: number;
  socialAccounts: SocialAccount[];
}

const platformIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  base: WalletMinimal,
  ethereum: WalletMinimal,
  github: Github,
  farcaster: BadgeCheck,
  lens: Sprout,
  twitter: Twitter,
  linkedin: Linkedin,
  efp: Users,
  ens: Globe,
};

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

function SocialAccountsList({
  socialAccounts,
}: {
  socialAccounts: SocialAccount[];
}) {
  if (!socialAccounts || socialAccounts.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-4">
        No social accounts found.
      </div>
    );
  }

  const handleSocialClick = (
    url: string | null | undefined,
    platform: string,
  ) => {
    if (!url) {
      console.warn("No URL provided for platform:", platform);
      return;
    }

    // Check if we're in a Farcaster environment
    const isInFarcaster =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("farcaster") ||
        window.location.hostname.includes("warpcast") ||
        // Check for Farcaster-specific globals
        (window as any).farcasterFrame ||
        // Check user agent for Farcaster
        navigator.userAgent.includes("Farcaster"));

    if (isInFarcaster) {
      // Use async function for Farcaster SDK, but don't await it to keep the function synchronous
      openExternalUrl(url).catch((error) => {
        console.error("Failed to open social URL:", error);
      });
    } else {
      // Regular browser - open immediately to avoid popup blockers
      try {
        const newWindow = window.open(url, "_blank", "noopener,noreferrer");
        // Note: newWindow can be null even when successful in some browsers
        // Only focus if we have a window reference
        if (newWindow) {
          newWindow.focus();
        }
      } catch (error) {
        console.error("window.open failed:", error);
      }
    }
  };

  return (
    <div className="space-y-3">
      {socialAccounts.map((account, idx) => {
        const Icon = platformIcons[account.source] || CircleUserRound;
        const followers =
          account.followerCount !== null && account.followerCount !== undefined
            ? formatK(account.followerCount)
            : "—";

        return (
          <div
            key={`${account.source}-${account.handle || idx}`}
            className="flex items-center gap-3 py-2"
          >
            <Icon className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {account.handle || "—"}
              </div>
              <div className="text-xs text-muted-foreground">
                {account.displayName || account.source}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground text-right">
                {followers !== "—" ? `${followers} followers` : "—"}
              </div>
              {account.profileUrl && (
                <button
                  onClick={() =>
                    handleSocialClick(account.profileUrl, account.source)
                  }
                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Open ${account.displayName || account.source} profile`}
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WalletAddressesList({
  fid,
  isOpen,
}: {
  fid?: number;
  isOpen: boolean;
}) {
  const {
    walletData,
    loading,
    error: walletError,
  } = useProfileWalletAddresses(isOpen ? fid : undefined);

  if (!fid) {
    return (
      <div className="text-muted-foreground text-sm py-4">
        No addresses found.
      </div>
    );
  }

  if (loading) {
    return <div className="text-muted-foreground text-sm py-4">Loading...</div>;
  }

  if (walletError) {
    return <div className="text-destructive text-sm py-4">{walletError}</div>;
  }

  if (!walletData || walletData.addresses.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-4">
        No addresses found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {walletData.addresses.map((address: string) => (
        <div key={address} className="flex items-center gap-3 py-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 3L16.2 3.6V21.7L16 21.9L7.1 17.1L16 3Z"
              fill="#232323"
            />
            <path d="M16 3L24.9 17.1L16 21.9V12.2V3Z" fill="#232323" />
            <path
              d="M16 23.6L16.1 23.8V28.7L16 29L7.1 18.7L16 23.6Z"
              fill="#232323"
            />
            <path d="M16 29V23.6L24.9 18.7L16 29Z" fill="#232323" />
            <path d="M16 21.9L7.1 17.1L16 12.2V21.9Z" fill="#232323" />
            <path d="M24.9 17.1L16 21.9V12.2L24.9 17.1Z" fill="#232323" />
          </svg>
          <span className="flex-1 text-foreground font-mono text-sm truncate">
            {truncateAddress(address)}
          </span>
          <button
            type="button"
            className="p-1 rounded hover:bg-accent"
            onClick={() => navigator.clipboard.writeText(address)}
            aria-label="Copy address"
          >
            <Copy className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ))}
    </div>
  );
}

function SheetContent({
  fid,
  socialAccounts,
  isOpen,
}: {
  fid?: number;
  socialAccounts: SocialAccount[];
  isOpen: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Socials Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Socials</h3>
        <SocialAccountsList socialAccounts={socialAccounts} />
      </div>

      {/* Wallets Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Wallets</h3>
        <WalletAddressesList fid={fid} isOpen={isOpen} />
      </div>
    </div>
  );
}

export function ProfileAccountsSheet({
  name,
  fid,
  socialAccounts,
}: ProfileAccountsSheetProps) {
  const [open, setOpen] = React.useState(false);
  const [triggerRect, setTriggerRect] = React.useState<DOMRect | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleTriggerClick = () => {
    if (isDesktop && triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect());
    }
    setOpen(!open);
  };

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open]);

  // Close on outside click for desktop
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isDesktop &&
        open &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        const overlay = document.querySelector("[data-profile-sheet-overlay]");
        if (overlay && !overlay.contains(e.target as Node)) {
          setOpen(false);
        }
      }
    };

    if (open && isDesktop) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, isDesktop]);

  const trigger = (
    <button
      ref={triggerRef}
      onClick={handleTriggerClick}
      className="flex items-center gap-1 text-xl font-bold leading-tight focus:outline-none"
    >
      <span>{name}</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </button>
  );

  if (isDesktop) {
    return (
      <>
        {trigger}
        {open && triggerRect && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            {/* Desktop Overlay */}
            <div
              data-profile-sheet-overlay
              className="fixed z-50 w-80 bg-background border border-border rounded-lg shadow-lg p-4"
              style={{
                top: triggerRect.bottom + 8,
                left: triggerRect.left,
              }}
            >
              <SheetContent
                fid={fid}
                socialAccounts={socialAccounts}
                isOpen={open}
              />
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="max-w-sm mx-auto w-full p-4 rounded-t-2xl">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{name} Profile Details</DrawerTitle>
          <DrawerDescription>
            View social accounts and wallet addresses for {name}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-2 pb-4" role="dialog" aria-modal="true">
          <SheetContent
            fid={fid}
            socialAccounts={socialAccounts}
            isOpen={open}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
