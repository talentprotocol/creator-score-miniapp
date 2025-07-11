"use client";

import * as React from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { User, Trophy, Settings } from "lucide-react";

export function useUserNavigation() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const canonical = user?.username || user?.fid;
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalFeature, setModalFeature] = React.useState("");

  const handleRestrictedClick = (feature: string) => {
    if (!canonical) {
      setModalFeature(feature);
      setModalOpen(true);
      return;
    }
    // If user exists, navigate normally
    if (feature === "Profile") {
      window.location.href = `/${canonical}`;
    } else if (feature === "Settings") {
      window.location.href = "/settings";
    }
  };

  const navItems = [
    {
      href: canonical ? `/${canonical}` : undefined,
      icon: User,
      label: "Profile",
      disabled: false, // Always enabled
      onClick: canonical ? undefined : () => handleRestrictedClick("Profile"),
    },
    {
      href: "/leaderboard",
      icon: Trophy,
      label: "Leaderboard",
      disabled: false,
    },
    {
      href: "/settings",
      icon: Settings,
      label: "Settings",
      disabled: false, // Always enabled
      onClick: canonical ? undefined : () => handleRestrictedClick("Settings"),
    },
  ];

  return {
    user,
    canonical,
    navItems,
    modalOpen,
    modalFeature,
    setModalOpen,
  };
}
