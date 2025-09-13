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
import { Icon } from "@/components/ui/icon";
import { ChevronDown, Copy } from "lucide-react";
import { useProfileAccounts } from "@/hooks/useProfileAccounts";
import {
  truncateAddress,
  formatCompactNumber,
  openExternalUrl,
} from "@/lib/utils";
import type { SocialAccount } from "@/lib/types";
import {
  X,
  Linkedin,
  CircleUserRound,
  GitBranch,
  WalletMinimal,
  Sprout,
  BadgeCheck,
  Users,
  Globe,
} from "lucide-react";

interface ProfileAccountsSheetProps {
  name: string;
  socialAccounts: SocialAccount[];
  talentUUID?: string;
}

const platformIcons: Record<string, typeof ChevronDown> = {
  base: WalletMinimal,
  ethereum: WalletMinimal,
  github: GitBranch,
  farcaster: BadgeCheck,
  lens: Sprout,
  twitter: X,
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
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

function SocialAccountsList({
  socialAccounts,
}: {
  socialAccounts: SocialAccount[];
}) {
  // Process accounts: filter EFP duplicates and sort by follower count
  const processedAccounts = React.useMemo(() => {
    let accounts = [...socialAccounts];

    // Filter EFP accounts - keep only the one with most followers
    const efpAccounts = accounts.filter((acc) => acc.source === "efp");
    if (efpAccounts.length > 1) {
      // Find EFP account with highest follower count
      const bestEfp = efpAccounts.reduce((best, current) => {
        const bestCount = best.followerCount ?? -1;
        const currentCount = current.followerCount ?? -1;
        return currentCount > bestCount ? current : best;
      });

      // Remove all EFP accounts and add back the best one
      accounts = accounts.filter((acc) => acc.source !== "efp");
      accounts.push(bestEfp);
    }

    // Sort by follower count (descending), treating null/undefined as -1
    return accounts.sort((a, b) => {
      const aCount = a.followerCount ?? -1;
      const bCount = b.followerCount ?? -1;
      return bCount - aCount;
    });
  }, [socialAccounts]);

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
        "farcasterFrame" in window ||
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

  if (
    !socialAccounts ||
    socialAccounts.length === 0 ||
    processedAccounts.length === 0
  ) {
    return (
      <div className="text-muted-foreground text-sm py-4">
        No social accounts found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {processedAccounts.map((account, idx) => {
        const IconComponent = platformIcons[account.source] || CircleUserRound;
        const followers =
          account.followerCount !== null &&
          account.followerCount !== undefined &&
          account.followerCount > 0
            ? formatCompactNumber(account.followerCount)
            : "—";

        return (
          <div
            key={`${account.source}-${account.handle || idx}`}
            className={`flex items-center gap-3 py-2 transition-colors ${
              account.profileUrl ? "cursor-pointer active:bg-muted" : ""
            }`}
            onClick={
              account.profileUrl
                ? () => handleSocialClick(account.profileUrl, account.source)
                : undefined
            }
          >
            <Icon icon={IconComponent} size="md" color="muted" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {account.handle || "—"}
              </div>
              <div className="text-xs text-muted-foreground">
                {account.displayName || account.source}
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              {followers !== "—" ? `${followers} followers` : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WalletAddressesList({
  talentUUID,
  isOpen,
}: {
  talentUUID?: string;
  isOpen: boolean;
}) {
  const [copiedAddress, setCopiedAddress] = React.useState<string | null>(null);
  const {
    wallet: walletData,
    loading,
    error: walletError,
  } = useProfileAccounts(isOpen ? talentUUID : undefined);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);

    // Reset after 1 second
    setTimeout(() => {
      setCopiedAddress(null);
    }, 1000);
  };

  if (!talentUUID) {
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

  if (
    !walletData ||
    (walletData.farcasterVerified.length === 0 &&
      walletData.talentVerified.length === 0)
  ) {
    return (
      <div className="text-muted-foreground text-sm py-4">
        No addresses found.
      </div>
    );
  }

  const WalletItem = ({ address }: { address: string }) => (
    <div
      key={address}
      className="flex items-center gap-3 py-2 cursor-pointer transition-colors active:bg-muted"
      onClick={() => handleCopyAddress(address)}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16 3L16.2 3.6V21.7L16 21.9L7.1 17.1L16 3Z" fill="#232323" />
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
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopyAddress(address);
          }}
          className="p-1 hover:bg-muted/50 active:bg-muted rounded transition-colors"
          aria-label={`Copy address ${truncateAddress(address)}`}
        >
          {copiedAddress === address ? (
            <span className="text-xs text-green-600 font-medium">Copied</span>
          ) : (
            <Icon icon={Copy} size="sm" color="muted" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Verified on Talent */}
      {walletData.talentVerified.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Verified on Talent
          </h4>
          <div className="space-y-1">
            {walletData.talentVerified.map((account) => (
              <WalletItem
                key={account.identifier}
                address={account.identifier}
              />
            ))}
          </div>
        </div>
      )}

      {/* Verified on Farcaster */}
      {walletData.farcasterVerified.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Verified on Farcaster
          </h4>
          <div className="space-y-1">
            {walletData.farcasterVerified.map((account) => (
              <WalletItem
                key={account.identifier}
                address={account.identifier}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SheetContent({
  socialAccounts,
  isOpen,
  talentUUID,
}: {
  socialAccounts: SocialAccount[];
  isOpen: boolean;
  talentUUID?: string;
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
        <WalletAddressesList talentUUID={talentUUID} isOpen={isOpen} />
      </div>
    </div>
  );
}

export function ProfileAccountsSheet({
  name,
  socialAccounts,
  talentUUID,
}: ProfileAccountsSheetProps) {
  const [open, setOpen] = React.useState(false);
  const [triggerRect, setTriggerRect] = React.useState<DOMRect | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const drawerContentRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = React.useRef<HTMLElement | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleDesktopTriggerClick = () => {
    if (triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect());
    }
    setOpen(!open);
  };

  // Handle focus management for mobile drawer
  React.useEffect(() => {
    if (!isDesktop) {
      if (open) {
        // Store the previously focused element
        previouslyFocusedElement.current =
          document.activeElement as HTMLElement;

        // Move focus to drawer content
        const timer = setTimeout(() => {
          if (drawerContentRef.current) {
            drawerContentRef.current.focus();
          }
        }, 100); // Small delay to ensure drawer is rendered

        return () => clearTimeout(timer);
      } else {
        // Restore focus when drawer closes
        if (previouslyFocusedElement.current) {
          previouslyFocusedElement.current.focus();
        }
      }
    }
  }, [open, isDesktop]);

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

  if (isDesktop) {
    return (
      <>
        <button
          ref={triggerRef}
          onClick={handleDesktopTriggerClick}
          className="flex items-center gap-1 text-xl font-bold leading-tight focus:outline-none"
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <span>{name}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
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
              className="fixed z-50 w-80 bg-background border border-border rounded-lg shadow-lg p-4 max-h-[80vh] overflow-y-auto"
              style={{
                top: triggerRect.bottom + 8,
                left: triggerRect.left,
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-sheet-title"
              aria-describedby="profile-sheet-description"
            >
              <div id="profile-sheet-title" className="sr-only">
                {name} Profile Details
              </div>
              <div id="profile-sheet-description" className="sr-only">
                View social accounts and wallet addresses for {name}
              </div>
              <SheetContent
                socialAccounts={socialAccounts}
                isOpen={open}
                talentUUID={talentUUID}
              />
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} modal={true}>
      <DrawerTrigger asChild>
        <button
          className="flex items-center gap-1 text-xl font-bold leading-tight focus:outline-none"
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <span>{name}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-w-sm mx-auto w-full p-4 rounded-t-2xl max-h-[80vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{name} Profile Details</DrawerTitle>
          <DrawerDescription>
            View social accounts and wallet addresses for {name}
          </DrawerDescription>
        </DrawerHeader>
        <div
          ref={drawerContentRef}
          className="px-2 pb-4 overflow-y-auto focus:outline-none"
          tabIndex={-1}
        >
          <SheetContent
            socialAccounts={socialAccounts}
            isOpen={open}
            talentUUID={talentUUID}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
