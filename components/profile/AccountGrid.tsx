import * as React from "react";
import { AccountCard } from "./AccountCard";
import type { SocialAccount } from "@/app/services/types";

interface AccountGridProps {
  socialAccounts: SocialAccount[];
}

export function AccountGrid({ socialAccounts }: AccountGridProps) {
  if (!socialAccounts || socialAccounts.length === 0) {
    return (
      <div className="text-muted-foreground text-sm p-4">
        No accounts found.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4">
      {socialAccounts.map((account, idx) => {
        return (
          <AccountCard
            key={`${account.source}-${account.handle || idx}`}
            platform={account.source}
            handle={account.handle || "—"}
            accountAge={account.accountAge || "—"}
            followers={
              account.followerCount !== null &&
              account.followerCount !== undefined
                ? account.followerCount.toLocaleString()
                : "—"
            }
            displayName={account.displayName || undefined}
            profileUrl={account.profileUrl || undefined}
            className="h-full"
          />
        );
      })}
    </div>
  );
}
