"use client";

import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Copy, WalletMinimal } from "lucide-react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useProfileWalletAddresses } from "@/hooks/useProfileWalletAddresses";
import { truncateAddress } from "@/lib/utils";

export function ProfileHeader({
  followers,
  displayName,
  profileImage,
}: {
  followers?: string;
  displayName?: string;
  profileImage?: string;
}) {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const name =
    displayName || user?.displayName || user?.username || "Unknown user";
  const image =
    profileImage ||
    user?.pfpUrl ||
    "https://api.dicebear.com/7.x/identicon/svg?seed=profile";
  const fid = user?.fid; // Only use real fid, no fallback

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const {
    walletData,
    loading,
    error: walletError,
  } = useProfileWalletAddresses(drawerOpen ? fid : undefined);

  const handleOpenChange = (open: boolean) => {
    setDrawerOpen(open);
  };

  return (
    <div className="flex items-center justify-between w-full gap-4">
      {/* Left: Name, dropdown, stats */}
      <div className="flex-1 min-w-0">
        <Drawer open={drawerOpen} onOpenChange={handleOpenChange}>
          <DrawerTrigger asChild>
            <button className="flex items-center gap-1 text-xl font-bold leading-tight focus:outline-none">
              <span>{name}</span>
              <WalletMinimal className="h-4 w-4 text-muted-foreground" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-w-sm mx-auto w-full p-4 rounded-t-2xl">
            <DrawerHeader>
              <DrawerTitle className="text-lg font-semibold mb-2">
                Wallet Addresses
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                List of all wallet addresses and ENS names associated with your
                account. Tap the copy icon to copy an address.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-2 pb-4 flex flex-col gap-3">
              {!fid ? (
                <div className="text-muted-foreground text-sm">
                  No addresses found.
                </div>
              ) : loading ? (
                <div className="text-muted-foreground text-sm">Loading...</div>
              ) : walletError ? (
                <div className="text-destructive text-sm">{walletError}</div>
              ) : walletData && walletData.addresses.length > 0 ? (
                walletData.addresses.map((address: string) => (
                  <div
                    key={address}
                    className="flex items-center gap-3 h-14 px-3 bg-muted rounded-xl"
                  >
                    {/* Use ETH icon for now, could be improved with ENS/base detection */}
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
                      <path
                        d="M16 3L24.9 17.1L16 21.9V12.2V3Z"
                        fill="#232323"
                      />
                      <path
                        d="M16 23.6L16.1 23.8V28.7L16 29L7.1 18.7L16 23.6Z"
                        fill="#232323"
                      />
                      <path d="M16 29V23.6L24.9 18.7L16 29Z" fill="#232323" />
                      <path
                        d="M16 21.9L7.1 17.1L16 12.2V21.9Z"
                        fill="#232323"
                      />
                      <path
                        d="M24.9 17.1L16 21.9V12.2L24.9 17.1Z"
                        fill="#232323"
                      />
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
                      <Copy className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-sm">
                  No addresses found.
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
        <div className="mt-1 flex flex-col gap-0.5">
          <span className="text-muted-foreground text-sm">
            {followers ?? "—"} total followers
          </span>
        </div>
      </div>
      {/* Right: Profile picture with badge overlay */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-16 w-16">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
