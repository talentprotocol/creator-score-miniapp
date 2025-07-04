"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { User, Trophy, Settings } from "lucide-react";

export function useUserNavigation() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const canonical = user?.username || user?.fid;

  const navItems = [
    {
      href: canonical ? `/${canonical}` : undefined,
      icon: User,
      label: "Profile",
      disabled: !canonical,
    },
    {
      href: "/leaderboard",
      icon: Trophy,
      label: "Leaderboard",
    },
    {
      href: "/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  return {
    user,
    canonical,
    navItems,
  };
}
