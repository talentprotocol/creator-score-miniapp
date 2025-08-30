/**
 * Shared types for leaderboard functionality
 * Used by hooks, components, and services
 */

export type LeaderboardEntry = {
  rank: number;
  name: string;
  pfp?: string;
  score: number;
  id: string;
  talent_protocol_id: string | number;
  isBoosted?: boolean;
  isOptedOut?: boolean;
  baseReward?: number;
  boostedReward?: number;
};

// Leaderboard snapshot types for frozen data storage
export interface LeaderboardSnapshot {
  talent_uuid: string;
  rank: number;
  rewards_amount: number;
  created_at: string;
}

export interface LeaderboardSnapshotResponse {
  snapshots: LeaderboardSnapshot[];
  total_count: number;
  created_at: string;
}

// Leaderboard data response type
export interface LeaderboardData {
  entries: LeaderboardEntry[];
  lastUpdated?: string | null;
  nextUpdate?: string | null;
}
