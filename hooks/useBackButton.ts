"use client";

import { useRouter, usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

export function useBackButton() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  // Track navigation history
  useEffect(() => {
    setNavigationHistory((prev) => {
      // Don't add duplicate consecutive entries
      if (prev[prev.length - 1] !== pathname) {
        return [...prev, pathname];
      }
      return prev;
    });
  }, [pathname]);

  const shouldShowBackButton = useMemo(() => {
    // Show back button if we have navigation history and we're not on the leaderboard
    return navigationHistory.length > 1 && pathname !== "/leaderboard";
  }, [navigationHistory.length, pathname]);

  const handleBack = () => {
    router.back();
  };

  return {
    shouldShowBackButton,
    handleBack,
  };
}
