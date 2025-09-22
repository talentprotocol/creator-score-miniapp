"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { User, Settings, Search, Award, TrendingUp } from "lucide-react";

export function useUserNavigation() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const { talentUuid } = useFidToTalentUuid();

  // Determine canonical identifier for navigation
  // Priority: Farcaster username > Talent UUID (no FIDs to avoid collisions)
  const canonical = user?.username || talentUuid;

  // Store both possible profile paths for active state check
  const profilePaths = [
    canonical ? `/${canonical}` : "/profile",
    user?.username ? `/${user.username}` : null,
    talentUuid ? `/${talentUuid}` : null,
  ].filter(Boolean) as string[];

  const navItems = [
    {
      href: "/leaderboard",
      icon: TrendingUp,
      label: "Leaderboard",
    },
    {
      href: "/badges",
      icon: Award,
      label: "Badges",
    },
    {
      href: "/explore",
      icon: Search,
      label: "Explore",
    },
    {
      href: profilePaths[0], // Use first path (canonical) for navigation
      icon: User,
      label: "Profile",
      disabled: false,
      // Store all possible paths for active state check
      alternateHrefs: profilePaths.slice(1),
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
