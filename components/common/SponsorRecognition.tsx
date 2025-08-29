"use client";

import Image from "next/image";
import { ACTIVE_SPONSORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export function SponsorRecognition() {
  // Show top 6 sponsors for compact display
  const topSponsors = ACTIVE_SPONSORS.slice(0, 6);

  return (
    <div className="space-y-3">
      {/* Sponsor Grid */}
      <div className="grid grid-cols-3 gap-2">
        {topSponsors.map((sponsor) => (
          <div
            key={sponsor.id}
            className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden mb-1">
              <Image
                src={sponsor.avatar}
                alt={sponsor.name}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Name */}
            <p className="text-xs font-medium truncate w-full">
              {sponsor.name}
            </p>

            {/* Amount */}
            <Badge variant="secondary" className="text-xs px-1 py-0 h-auto">
              ${sponsor.amount.toLocaleString()}
            </Badge>
          </div>
        ))}
      </div>

      {/* Total Pool Info */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Total Pool:{" "}
          <span className="font-medium">
            $
            {ACTIVE_SPONSORS.reduce(
              (sum, s) => sum + s.amount,
              0,
            ).toLocaleString()}
          </span>
        </p>
      </div>
    </div>
  );
}
