"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { resolveFidToTalentUuid } from "@/lib/user-resolver";
import { User, Trophy, Settings } from "lucide-react";
import { useState, useEffect } from "react";

export function useUserNavigation() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const [talentUuid, setTalentUuid] = useState<string | null>(null);

  console.log("[useUserNavigation] User context:", user);

  // Resolve FID to Talent UUID for navigation
  useEffect(() => {
    async function resolveTalentUuid() {
      if (user?.fid) {
        console.log(
          "[useUserNavigation] Resolving FID to Talent UUID:",
          user.fid,
        );
        const uuid = await resolveFidToTalentUuid(user.fid);
        console.log("[useUserNavigation] Resolved Talent UUID:", uuid);
        setTalentUuid(uuid);
      }
    }

    resolveTalentUuid();
  }, [user?.fid]);

  // Determine canonical identifier for navigation
  // Priority: Talent UUID > Farcaster username > fallback to /profile
  const canonical = talentUuid || user?.username;
  console.log("[useUserNavigation] Canonical identifier:", canonical);

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
      href: "/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  console.log("[useUserNavigation] Profile href:", navItems[0].href);

  return {
    user,
    canonical,
    navItems,
    talentUuid, // Export this for other components that might need it
  };
}
