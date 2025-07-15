"use client";

import { useRouter, usePathname } from "next/navigation";
import { useMemo } from "react";

export function useBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  const shouldShowBackButton = useMemo(() => {
    return pathname !== "/leaderboard";
  }, [pathname]);

  const handleBack = () => {
    router.back();
  };

  return {
    shouldShowBackButton,
    handleBack,
  };
}
