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
import { useTalentUuid } from "@/hooks/useTalentUuid";
import { useTalentAuthPresence } from "@/hooks/useTalentAuthPresence";
import { useRef } from "react";

export default function ProfilePage() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const { talentId } = usePrivyAuth({});
  const { talentUuid } = useFidToTalentUuid();
  const { talentUuid: storedTalentUuid } = useTalentUuid();
  const { token: tpToken } = useTalentAuthToken();
  const { hasToken } = useTalentAuthPresence();
  const router = useRouter();
  const attemptedMeRef = useRef(false);

  useEffect(() => {
    // Use Farcaster username as primary identifier, Talent UUID as fallback
    if (user?.username) {
      router.push(`/${user.username}`);
      return;
    }
    if (talentUuid) {
      router.push(`/${talentUuid}`);
      return;
    }
    if (storedTalentUuid) {
      router.push(`/${storedTalentUuid}`);
      return;
    }
    // If we have a valid token but no UUID yet, try fetching /me and redirect
    if (!attemptedMeRef.current && hasToken && tpToken && !storedTalentUuid) {
      attemptedMeRef.current = true;
      (async () => {
        try {
          // Avoid duplicate /me when another tab/page already resolved
          const meFetched =
            typeof window !== "undefined" && sessionStorage.getItem("tpMeFetched") === "1";
          if (meFetched) {
            const id = localStorage.getItem("talentUserId");
            if (id) {
              router.push(`/${id}`);
              return;
            }
          }
          const resp = await fetch("/api/talent-auth/me", {
            method: "GET",
            headers: { "x-talent-auth-token": tpToken },
          });
          if (resp.ok) {
            const data = await resp.json();
            const id = (data?.id as string | undefined) || null;
            if (id) {
              try {
                localStorage.setItem("talentUserId", id);
                try {
                  window.dispatchEvent(
                    new CustomEvent("talentUserIdUpdated", { detail: { talentUserId: id } }),
                  );
                } catch {}
              } catch {}
              try { sessionStorage.setItem("tpMeFetched", "1"); } catch {}
              router.push(`/${id}`);
              return;
            }
          }
        } catch(error) {
          console.error("[Profile] /me error", error);
        }
        // Fallback if /me fails
        router.push("/leaderboard");
      })();
      return;
    }
    if (talentId) {
      router.push(`/${talentId}`);
      return;
    }
    // Only fall back to leaderboard when there is no auth token
    if (!hasToken) {
      router.push("/leaderboard");
    }
  }, [user, router, talentId, talentUuid, tpToken, storedTalentUuid, hasToken]);

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
