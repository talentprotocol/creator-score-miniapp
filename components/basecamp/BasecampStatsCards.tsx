"use client";

import * as React from "react";
import { DualMetricStatCard } from "@/components/common/DualMetricStatCard";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import { BasecampStats } from "@/lib/types/basecamp";

interface BasecampStatsCardsProps {
  stats: BasecampStats | null;
  loading: boolean;
}

export function BasecampStatsCards({
  stats,
  loading,
}: BasecampStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <DualMetricStatCard
            key={i}
            loading={true}
            title=""
            primaryValue=""
            primaryLabel=""
            secondaryValue=""
            secondaryLabel=""
          />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <DualMetricStatCard
            key={i}
            loading={true}
            title=""
            primaryValue=""
            primaryLabel=""
            secondaryValue=""
            secondaryLabel=""
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DualMetricStatCard
          title="Coins Launched"
          primaryValue={formatCompactNumber(stats.coinsLaunchedToday)}
          primaryLabel="Today"
          secondaryValue={formatCompactNumber(stats.coinsLaunchedTotal)}
          secondaryLabel="Total"
        />
        <DualMetricStatCard
          title="Market Cap"
          primaryValue={formatCurrency(stats.marketCapToday)}
          primaryLabel="Today"
          secondaryValue={formatCurrency(stats.marketCapTotal)}
          secondaryLabel="Total"
        />
        <DualMetricStatCard
          title="Volume"
          primaryValue={formatCurrency(stats.volumeToday)}
          primaryLabel="Today"
          secondaryValue={formatCurrency(stats.volumeTotal)}
          secondaryLabel="Total"
        />
        <DualMetricStatCard
          title="Holders"
          primaryValue={formatCompactNumber(stats.holdersChangeToday)}
          primaryLabel="Today"
          secondaryValue={formatCompactNumber(stats.holdersTotal)}
          secondaryLabel="Total"
        />
      </div>
    </div>
  );
}
