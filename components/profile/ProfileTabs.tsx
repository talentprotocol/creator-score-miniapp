import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AccountGrid } from "./AccountGrid";
import { type IssuerCredentialGroup } from "@/app/services/types";
import { useProfileCredentials } from "@/hooks/useProfileCredentials";
import { ScoreProgressAccordion } from "./ScoreProgressAccordion";
import { ScoreDataPoints } from "./ScoreDataPoints";
import { CredentialIdeasCallout } from "./CredentialIdeasCallout";

interface ProfileTabsProps {
  accountsCount: number;
  socialAccounts: import("@/app/services/types").SocialAccount[];
  talentUUID: string;
}

export function ProfileTabs({
  accountsCount,
  socialAccounts,
  talentUUID,
}: ProfileTabsProps) {
  const { credentials } = useProfileCredentials(talentUUID);

  // Calculate credentials count from the hook data
  const credentialsCount = credentials.reduce(
    (sum: number, issuer: IssuerCredentialGroup) => sum + issuer.points.length,
    0,
  );

  return (
    <Tabs defaultValue="accounts" className="w-full flex flex-col">
      <TabsList className="w-full justify-start bg-transparent p-0 h-auto gap-6">
        <TabsTrigger
          value="accounts"
          className={cn(
            "relative px-0 py-2 text-base font-medium",
            "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
            "data-[state=active]:text-foreground data-[state=active]:after:absolute",
            "data-[state=active]:after:bottom-0 data-[state=active]:after:left-0",
            "data-[state=active]:after:right-0 data-[state=active]:after:h-0.5",
            "data-[state=active]:after:bg-primary",
          )}
        >
          Accounts
          <Badge
            variant="secondary"
            className="ml-2 bg-muted text-muted-foreground"
          >
            {accountsCount}
          </Badge>
        </TabsTrigger>
        <TabsTrigger
          value="score"
          className={cn(
            "relative px-0 py-2 text-base font-medium",
            "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
            "data-[state=active]:text-foreground data-[state=active]:after:absolute",
            "data-[state=active]:after:bottom-0 data-[state=active]:after:left-0",
            "data-[state=active]:after:right-0 data-[state=active]:after:h-0.5",
            "data-[state=active]:after:bg-primary",
          )}
        >
          Credentials
          <Badge
            variant="secondary"
            className="ml-2 bg-muted text-muted-foreground"
          >
            {credentialsCount}
          </Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="accounts" className="mt-6 p-2">
        <AccountGrid socialAccounts={socialAccounts} />
      </TabsContent>
      <TabsContent value="score" className="mt-6 space-y-6">
        <ScoreProgressAccordion talentUUID={talentUUID} />
        <CredentialIdeasCallout />
        <ScoreDataPoints talentUUID={talentUUID} />
      </TabsContent>
    </Tabs>
  );
}
