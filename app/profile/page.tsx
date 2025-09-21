"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { useTalentAuthToken } from "@/hooks/useTalentAuthToken";

export default function ProfilePage() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const { talentId } = usePrivyAuth({});
  const { talentUuid } = useFidToTalentUuid();
  const { token: tpToken } = useTalentAuthToken();
  const router = useRouter();

  useEffect(() => {
    // Prioritize talentUuid to avoid FID/username collisions
    if (talentUuid) {
      router.push(`/${talentUuid}`);
      return;
    }
    if (talentId) {
      router.push(`/${talentId}`);
      return;
    }
    if (user) {
      // Fallback to username only if no Talent UUID is available
      const canonical = user.username;
      if (canonical) {
        router.push(`/${canonical}`);
        return;
      }
    }
    router.push("/leaderboard");
  }, [user, router, talentId, talentUuid, tpToken]);

  return (
    <PageContainer>
      <Section variant="content">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-sm text-muted-foreground">Redirecting...</span>
        </div>
      </Section>
    </PageContainer>
  );
}
