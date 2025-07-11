"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsPage() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      // If no user context, redirect to leaderboard
      router.push("/leaderboard");
    }
  }, [user, router]);

  if (!user) {
    return (
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto relative">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Account Information</h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Display Name:</strong> {user.displayName || "—"}
              </p>
              <p>
                <strong>Username:</strong> {user.username || "—"}
              </p>
              <p>
                <strong>FID:</strong> {user.fid || "—"}
              </p>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Notification settings will be available soon.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
