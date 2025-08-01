import * as React from "react";
import { CredentialAccordion } from "@/components/common/CredentialAccordion";

import { COMING_SOON_CREDENTIALS } from "./comingSoonCredentials";
import { useProfileContext } from "@/contexts/ProfileContext";
import {
  mergeCredentialsWithComingSoon,
  sortCredentialsByTotal,
} from "@/lib/credentialUtils";

export function ScoreDataPoints() {
  const { profileData } = useProfileContext();

  // Extract data from server-fetched profileData
  const { credentials } = profileData;

  // No loading states needed - data comes from server
  const isLoading = false;
  const error = null;

  // Type assertion for server data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedCredentials = credentials as any;

  // Merge credentials with coming soon credentials using utility
  const allCredentials = mergeCredentialsWithComingSoon(
    typedCredentials,
    COMING_SOON_CREDENTIALS,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-muted-foreground">
          Loading score breakdown...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  if (!typedCredentials || typedCredentials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="text-muted-foreground text-sm">
          No score data available.
        </span>
        <span className="text-muted-foreground text-xs mt-2">
          Try calculating or refreshing your Creator Score to see detailed
          breakdown.
        </span>
      </div>
    );
  }

  if (allCredentials.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">
          No score data available
        </div>
      </div>
    );
  }

  const sortedCredentials = sortCredentialsByTotal(allCredentials);

  return (
    <CredentialAccordion
      credentials={sortedCredentials}
      onCredentialClick={() => {
        // Handle credential click - this will be called by CredentialAccordion
        // The component handles the SDK logic internally
      }}
    />
  );
}
