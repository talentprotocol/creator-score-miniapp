"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BasecampProfile,
  SortColumn,
  SortOrder,
  BasecampTab,
} from "@/lib/types/basecamp";
import { formatCompactNumber, formatCurrency, cn } from "@/lib/utils";

interface BasecampDataTableProps {
  data: BasecampProfile[];
  sortColumn: SortColumn;
  sortOrder: SortOrder;
  onSort: (column: SortColumn, order: SortOrder) => void;
  onRowClick?: (profile: BasecampProfile) => void;
  pinnedIndex?: number;
  tab?: BasecampTab;
}

interface SortableHeaderProps {
  column: SortColumn;
  title: string;
  sortColumn: SortColumn;
  sortOrder: SortOrder;
  onSort: (column: SortColumn, order: SortOrder) => void;
}

function SortableHeader({
  column,
  title,
  sortColumn,
  sortOrder,
  onSort,
}: SortableHeaderProps) {
  const isActive = sortColumn === column;
  const nextOrder: SortOrder =
    isActive && sortOrder === "desc" ? "asc" : "desc";

  return (
    <button
      className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => onSort(column, nextOrder)}
    >
      {title}
      {isActive ? (
        sortOrder === "desc" ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )
      ) : (
        <ChevronDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

// Column configurations for different tabs
const COLUMN_CONFIGS = {
  reputation: [
    { key: "creator", title: "Creator", sortable: false as const },
    { key: "zora_handle", title: "Zora Handle", sortable: false as const },
    {
      key: "creator_score",
      title: "Creator Score",
      sortable: "creator_score" as SortColumn,
    },
    {
      key: "builder_score",
      title: "Builder Score",
      sortable: "builder_score" as SortColumn,
    },
    {
      key: "total_earnings",
      title: "Total Earnings",
      sortable: "total_earnings" as SortColumn,
    },
    {
      key: "total_collectors",
      title: "Total Collectors",
      sortable: "total_collectors" as SortColumn,
    },
    {
      key: "total_followers",
      title: "Total Followers",
      sortable: "total_followers" as SortColumn,
    },
    {
      key: "total_posts",
      title: "Total Posts",
      sortable: "total_posts" as SortColumn,
    },
  ],
  coins: [
    { key: "creator", title: "Creator", sortable: false as const },
    {
      key: "zora_handle",
      title: "Zora Handle / Symbol",
      sortable: false as const,
    },
    {
      key: "market_cap",
      title: "Market Cap",
      sortable: "zora_creator_coin_market_cap" as SortColumn,
    },
    {
      key: "market_cap_24h",
      title: "Market Cap 24h Δ",
      sortable: "zora_creator_coin_market_cap_24h" as SortColumn,
    },
    {
      key: "total_volume",
      title: "Total Volume",
      sortable: "zora_creator_coin_total_volume" as SortColumn,
    },
    {
      key: "volume_24h",
      title: "Volume 24h",
      sortable: "zora_creator_coin_24h_volume" as SortColumn,
    },
    {
      key: "holders",
      title: "Holders",
      sortable: "zora_creator_coin_unique_holders" as SortColumn,
    },
    {
      key: "holders_24h_delta",
      title: "Holder 24h Δ",
      sortable: false as const,
    },
  ],
};

export function BasecampDataTable({
  data,
  sortColumn,
  sortOrder,
  onSort,
  onRowClick,
  pinnedIndex,
  tab = "reputation",
}: BasecampDataTableProps) {
  const columns = COLUMN_CONFIGS[tab];

  // Helper function to render cell content based on column key
  const renderCellContent = (profile: BasecampProfile, columnKey: string) => {
    switch (columnKey) {
      case "creator":
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {profile.image_url ? (
                <AvatarImage src={profile.image_url} />
              ) : (
                <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
              )}
            </Avatar>
            <span className="font-medium text-sm truncate">
              {profile.display_name}
            </span>
          </div>
        );

      case "zora_handle":
        return (
          <span className="text-sm text-muted-foreground">
            {profile.zora_creator_coin_symbol || "—"}
          </span>
        );

      case "market_cap":
        return (
          <span className="text-sm font-medium">
            {profile.zora_creator_coin_market_cap
              ? formatCurrency(profile.zora_creator_coin_market_cap)
              : "—"}
          </span>
        );

      case "market_cap_24h":
        const marketCapDelta = profile.zora_creator_coin_market_cap_24h;
        return (
          <span
            className={cn(
              "text-sm font-medium",
              marketCapDelta && marketCapDelta > 0
                ? "text-green-600"
                : marketCapDelta && marketCapDelta < 0
                  ? "text-red-600"
                  : "",
            )}
          >
            {marketCapDelta !== undefined && marketCapDelta !== null
              ? marketCapDelta > 0
                ? `+${formatCurrency(marketCapDelta)}`
                : formatCurrency(marketCapDelta)
              : "—"}
          </span>
        );

      case "total_volume":
        return (
          <span className="text-sm font-medium">
            {profile.zora_creator_coin_total_volume
              ? formatCurrency(profile.zora_creator_coin_total_volume)
              : "—"}
          </span>
        );

      case "volume_24h":
        return (
          <span className="text-sm font-medium">
            {profile.zora_creator_coin_24h_volume
              ? formatCurrency(profile.zora_creator_coin_24h_volume)
              : "—"}
          </span>
        );

      case "holders":
        return (
          <span className="text-sm font-medium">
            {profile.zora_creator_coin_unique_holders
              ? formatCompactNumber(profile.zora_creator_coin_unique_holders)
              : "—"}
          </span>
        );

      case "holders_24h_delta":
        const holdersDelta = profile.zora_creator_coin_holders_24h_delta;
        return (
          <span
            className={cn(
              "text-sm font-medium",
              holdersDelta && holdersDelta > 0
                ? "text-green-600"
                : holdersDelta && holdersDelta < 0
                  ? "text-red-600"
                  : "",
            )}
          >
            {holdersDelta !== undefined
              ? holdersDelta > 0
                ? `+${holdersDelta}`
                : holdersDelta.toString()
              : "—"}
          </span>
        );

      case "creator_score":
        return (
          <span className="text-sm font-medium">
            {profile.creator_score
              ? formatCompactNumber(profile.creator_score)
              : "—"}
          </span>
        );

      case "builder_score":
        return (
          <span className="text-sm font-medium">
            {profile.builder_score
              ? formatCompactNumber(profile.builder_score)
              : "—"}
          </span>
        );

      case "total_earnings":
        return (
          <span className="text-sm font-medium">
            {profile.total_earnings
              ? formatCurrency(profile.total_earnings)
              : "—"}
          </span>
        );

      case "total_collectors":
        return (
          <span className="text-sm font-medium">
            {profile.total_collectors
              ? formatCompactNumber(profile.total_collectors)
              : "—"}
          </span>
        );

      case "total_followers":
        return (
          <span className="text-sm font-medium">
            {profile.total_followers
              ? formatCompactNumber(profile.total_followers)
              : "—"}
          </span>
        );

      case "total_posts":
        return (
          <span className="text-sm font-medium">
            {profile.total_posts
              ? formatCompactNumber(profile.total_posts)
              : "—"}
          </span>
        );

      default:
        return <span className="text-sm">—</span>;
    }
  };

  return (
    <div className="bg-background rounded-xl border border-input overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b">
            {columns.map((column) => (
              <TableHead key={column.key}>
                {column.sortable ? (
                  <SortableHeader
                    column={column.sortable}
                    title={column.title}
                    sortColumn={sortColumn}
                    sortOrder={sortOrder}
                    onSort={onSort}
                  />
                ) : (
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {column.title}
                  </span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((profile, index) => (
            <TableRow
              key={profile.talent_uuid}
              className={cn(
                "cursor-pointer hover:bg-muted transition-colors",
                pinnedIndex === index && "bg-secondary",
              )}
              onClick={() => onRowClick?.(profile)}
            >
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {renderCellContent(profile, column.key)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
