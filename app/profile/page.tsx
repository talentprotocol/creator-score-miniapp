"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { FarcasterAccessModal } from "@/components/ui/FarcasterAccessModal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user) {
      // If user exists, redirect to their profile
      const canonical = user.username || user.fid;
      if (canonical) {
        router.push(`/${canonical}`);
        return;
      }
    }
    // If no user context, show the modal
    setShowModal(true);
  }, [user, router]);

  return (
    <>
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </main>
      <FarcasterAccessModal
        open={showModal}
        onOpenChange={setShowModal}
        feature="Profile"
      />
    </>
  );
}
