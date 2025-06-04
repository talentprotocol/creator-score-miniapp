"use client";

import * as React from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { FarcasterWarningModal } from "./FarcasterWarningModal";

interface RequireFarcasterUserProps {
  children: React.ReactNode;
}

export function RequireFarcasterUser({ children }: RequireFarcasterUserProps) {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const isProduction = process.env.NODE_ENV === "production";

  // In production, only render children if we have a user context
  // In development, always render children
  if (isProduction && !user) {
    return <FarcasterWarningModal />;
  }

  return <>{children}</>;
}
