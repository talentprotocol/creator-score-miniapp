"use client";

import * as React from "react";

interface RequireFarcasterUserProps {
  children: React.ReactNode;
}

export function RequireFarcasterUser({ children }: RequireFarcasterUserProps) {
  // No gating here; gating will be handled in ProfileScreen or a new overlay
  return <>{children}</>;
}
