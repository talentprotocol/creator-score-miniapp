"use client";

import * as React from "react";
import { StatCard } from "@/components/common/StatCard";
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
          <StatCard key={i} title="Loading..." value="—" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCard key={i} title="Error" value="—" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Creator Earnings"
          value={formatCurrency(stats.totalCreatorEarnings)}
        />
        <StatCard
          title="Coins Market Cap"
          value={formatCurrency(stats.totalMarketCap)}
        />
        <StatCard
          title="Builder Rewards"
          value={`${stats.totalBuilderRewards.toFixed(2)} ETH`}
        />
        <StatCard
          title="Contracts Deployed"
          value={formatCompactNumber(stats.totalContractsDeployed)}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Data as of {new Date(stats.calculationDate).toLocaleDateString()}
      </p>
    </div>
  );
}
