"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";

export default function ProfilePage() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const { talentId } = usePrivyAuth({});
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // If user exists, redirect to their profile
      const canonical = user.username;
      if (canonical) {
        router.push(`/${canonical}`);
        return;
      }
    } else if (talentId) {
      router.push(`/${talentId}`);
    } else {
      router.push("/leaderboard");
    }
  }, [user, router, talentId]);

  return (
    <main className="flex-1 overflow-y-auto relative">
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-sm text-muted-foreground">Redirecting...</span>
        </div>
      </div>
    </main>
  );
}
