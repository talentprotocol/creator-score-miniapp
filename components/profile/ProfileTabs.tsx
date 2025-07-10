import * as React from "react";
import { useState } from "react";
import { TabNavigation } from "@/components/ui/tabs-navigation";
import type { IssuerCredentialGroup } from "@/app/services/types";
import { useProfileCredentials } from "@/hooks/useProfileCredentials";
import { useProfilePostsPaginated } from "@/hooks/useProfilePostsPaginated";
import { ScoreProgressAccordion } from "./ScoreProgressAccordion";
import { ScoreDataPoints } from "./ScoreDataPoints";
import { CredentialIdeasCallout } from "./CredentialIdeasCallout";
import { PostsList } from "./PostsList";

interface ProfileTabsProps {
  socialAccounts: import("@/app/services/types").SocialAccount[];
  talentUUID: string;
}

export function ProfileTabs({ socialAccounts, talentUUID }: ProfileTabsProps) {
  const { credentials } = useProfileCredentials(talentUUID);
  const {
    posts,
    loading: postsLoading,
    error: postsError,
    hasMore,
    loadMore,
  } = useProfilePostsPaginated(talentUUID, 10);
  const [activeTab, setActiveTab] = useState("score");

  // Calculate credentials count from the hook data
  const credentialsCount = credentials.reduce(
    (sum: number, issuer: IssuerCredentialGroup) => sum + issuer.points.length,
    0,
  );

  const tabs = [
    {
      id: "score",
      label: "Score",
    },
    {
      id: "content",
      label: "Posts",
    },
    {
      id: "credentials",
      label: "Credentials",
      count: credentialsCount,
    },
  ];

  return (
    <div className="w-full flex flex-col">
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="mt-6">
        {activeTab === "score" && (
          <div className="space-y-6">
            {/* Score tab content - empty for now */}
          </div>
        )}
        {activeTab === "content" && (
          <div className="space-y-6">
            <PostsList
              posts={posts}
              loading={postsLoading}
              error={postsError}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
          </div>
        )}
        {activeTab === "credentials" && (
          <div className="space-y-6">
            <ScoreProgressAccordion talentUUID={talentUUID} />
            <CredentialIdeasCallout />
            <ScoreDataPoints talentUUID={talentUUID} />
          </div>
        )}
      </div>
    </div>
  );
}
