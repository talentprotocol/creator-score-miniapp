"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";

// Mock sponsor data (top 3 only)
const SPONSORS = [
  {
    id: "base",
    name: "Base",
    avatar:
      "https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=576/https%3A%2F%2Fi.imgur.com%2F7Q0QBrm.jpg",
    amount: 5000,
    date: "2025-07-15",
    rank: 1,
  },
  {
    id: "zora",
    name: "Zora",
    avatar:
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/1b471987-45b1-48e3-6af4-44929b6e4900/anim=false,fit=contain,f=auto,w=576",
    amount: 2500,
    date: "2025-07-18",
    rank: 2,
  },
  {
    id: "farcaster",
    name: "Farcaster",
    avatar:
      "https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=576/https%3A%2F%2Fi.imgur.com%2FI2rEbPF.png",
    amount: 2500,
    date: "2025-07-12",
    rank: 3,
  },
];

interface TopSponsorsCardProps {
  loading?: boolean;
}

export function TopSponsorsCard({ loading }: TopSponsorsCardProps) {
  if (loading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          Top Sponsors
        </span>
        <Link
          href="/leaderboard"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          See leaderboard
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {SPONSORS.map((sponsor) => (
          <div key={sponsor.id} className="flex items-center gap-3">
            <span className="text-sm font-medium w-4 text-muted-foreground">
              #{sponsor.rank}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={sponsor.avatar} />
              <AvatarFallback>{sponsor.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{sponsor.name}</p>
              <p className="text-xs text-muted-foreground">
                ${sponsor.amount.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
