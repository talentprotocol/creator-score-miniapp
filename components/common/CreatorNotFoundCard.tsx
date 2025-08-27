"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

export function CreatorNotFoundCard() {
  const [countdown, setCountdown] = useState(20);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push("/leaderboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <main className="flex-1 overflow-y-auto relative">
      <div className="max-w-xl mx-auto px-4 py-8">
        <Card className="p-6 text-center space-y-4">
          <h1 className="text-xl font-semibold">Creator Not Found</h1>
          <p className="text-muted-foreground text-sm">
            This creator profile doesn&apos;t exist. Try searching for them on
            the leaderboard.
          </p>
          <div className="space-y-2">
            <Button asChild variant="default" className="w-full">
              <Link href="/explore">
                <Search className="w-4 h-4 mr-2" />
                Explore Creators
              </Link>
            </Button>
            <Button asChild variant="default" className="w-full">
              <Link href="/leaderboard">
                <Trophy className="w-4 h-4 mr-2" />
                Go to Leaderboard
              </Link>
            </Button>
          </div>
          <div className="pt-4 text-xs text-muted-foreground">
            Redirecting to home in {countdown} second
            {countdown !== 1 ? "s" : ""}...
          </div>
        </Card>
      </div>
    </main>
  );
}
