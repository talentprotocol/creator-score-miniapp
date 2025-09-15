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
          title="Coin Market Cap 24h"
          primaryValue={formatCurrency(stats.marketCapToday)}
          primaryLabel=""
          secondaryValue={`Total: ${formatCurrency(stats.marketCapTotal)}`}
          secondaryLabel=""
        />
        <DualMetricStatCard
          title="Coin Volume 24h"
          primaryValue={formatCurrency(stats.volumeToday)}
          primaryLabel=""
          secondaryValue={`Total: ${formatCurrency(stats.volumeTotal)}`}
          secondaryLabel=""
        />
        <DualMetricStatCard
          title="New Coins Launched"
          primaryValue={formatCompactNumber(stats.coinsLaunchedToday)}
          primaryLabel=""
          secondaryValue={`Total: ${formatCompactNumber(stats.coinsLaunchedTotal)}`}
          secondaryLabel=""
        />
        <DualMetricStatCard
          title="New Coin Holders"
          primaryValue={formatCompactNumber(stats.holdersChangeToday)}
          primaryLabel=""
          secondaryValue={`Total: ${formatCompactNumber(stats.holdersTotal)}`}
          secondaryLabel=""
        />
      </div>
    </div>
  );
}
