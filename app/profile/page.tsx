"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // If user exists, redirect to their profile
      const canonical = user.username;
      if (canonical) {
        router.push(`/${canonical}`);
        return;
      }
    } else {
      // If no user context, redirect to leaderboard
      router.push("/leaderboard");
    }
  }, [user, router]);

  return (
    <main className="flex-1 overflow-y-auto relative">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    </main>
  );
}
