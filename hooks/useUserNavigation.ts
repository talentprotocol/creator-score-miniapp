"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useUserResolution } from "@/hooks/useUserResolution";
import { User, Trophy, Settings, Search } from "lucide-react";

export function useUserNavigation() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const { talentUuid } = useUserResolution();

  // Determine canonical identifier for navigation
  // Priority: Talent UUID > Farcaster username > fallback to /profile
  const canonical = talentUuid || user?.username;

  const navItems = [
    {
      href: canonical ? `/${canonical}` : "/profile",
      icon: User,
      label: "Profile",
      disabled: false,
    },
    {
      href: "/leaderboard",
      icon: Trophy,
      label: "Leaderboard",
    },
    {
      href: "/explore",
      icon: Search,
      label: "Explore",
    },
  ];

  // Settings item for top nav
  const settingsItem = {
    href: "/settings",
    icon: Settings,
    label: "Settings",
  };

  return {
    user,
    canonical,
    navItems,
    settingsItem,
    talentUuid, // Export this for other components that might need it
  };
}
