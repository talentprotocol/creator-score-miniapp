"use client";

import * as React from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import type { HumanityCredential } from "@/app/services/types";

interface ProofOfHumanitySectionProps {
  credentials: HumanityCredential[] | null;
}

export function ProofOfHumanitySection({
  credentials,
}: ProofOfHumanitySectionProps) {
  // Deduplicate credentials by slug, preferring verified ones (points > 0)
  const uniqueCredentials = React.useMemo(() => {
    if (!credentials || credentials.length === 0) return credentials;

    const credentialMap = new Map<string, HumanityCredential>();

    credentials.forEach((credential) => {
      const existing = credentialMap.get(credential.slug);

      if (!existing) {
        credentialMap.set(credential.slug, credential);
      } else {
        // Prefer the credential with points > 0 (verified)
        if (credential.points > 0 && existing.points === 0) {
          credentialMap.set(credential.slug, credential);
        }
      }
    });

    return Array.from(credentialMap.values());
  }, [credentials]);

  // Helper function to remove data issuer name from credential name if redundant
  const cleanCredentialName = (
    name: string,
    dataIssuerName: string,
  ): string => {
    // Remove data issuer name from the beginning or end of credential name
    const lowerName = name.toLowerCase();
    const lowerIssuer = dataIssuerName.toLowerCase();

    // Check if name starts with issuer name
    if (lowerName.startsWith(lowerIssuer)) {
      return name.substring(dataIssuerName.length).trim();
    }

    // Check if name contains issuer name and remove it
    const issuerIndex = lowerName.indexOf(lowerIssuer);
    if (issuerIndex !== -1) {
      const before = name.substring(0, issuerIndex).trim();
      const after = name.substring(issuerIndex + dataIssuerName.length).trim();
      return (before + " " + after).trim();
    }

    return name;
  };

  if (credentials === null) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!uniqueCredentials || uniqueCredentials.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          No humanity credentials found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {uniqueCredentials.map((credential, index) => {
        const isVerified = credential.points > 0;
        const cleanedName = cleanCredentialName(
          credential.name,
          credential.data_issuer_name,
        );
        // Use index as part of key to ensure uniqueness even if slugs somehow duplicate
        const uniqueKey = `${credential.slug}-${index}`;

        return (
          <div
            key={uniqueKey}
            className="flex items-center justify-between p-4 bg-background border rounded-lg"
          >
            <div className="flex-1">
              <div className="font-medium text-sm">
                {credential.data_issuer_name}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {cleanedName}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isVerified ? (
                <CheckCircle className="h-5 w-5 text-black" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
