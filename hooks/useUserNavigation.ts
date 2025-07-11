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

  // Debug logging for production
  React.useEffect(() => {
    console.log("[useUserNavigation] Debug info:", {
      hasContext: !!context,
      hasUser: !!user,
      canonical,
      userFid: user?.fid,
      username: user?.username,
    });
  }, [context, user, canonical]);

  const handleRestrictedClick = (feature: string) => {
    console.log(
      "[useUserNavigation] Restricted click:",
      feature,
      "canonical:",
      canonical,
    );
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

  // Debug log the nav items
  React.useEffect(() => {
    console.log(
      "[useUserNavigation] Nav items:",
      navItems.map((item) => ({
        label: item.label,
        hasHref: !!item.href,
        hasOnClick: !!item.onClick,
        hasIcon: !!item.icon,
        iconName: item.icon?.name || item.icon?.displayName || "unknown",
      })),
    );
  }, [canonical]);

  return {
    user,
    canonical,
    navItems,
    modalOpen,
    modalFeature,
    setModalOpen,
  };
}
