/**
 * BADGE TYPE DEFINITIONS
 *
 * This file contains all badge-related TypeScript interfaces and types.
 * Separating types from services ensures clean client-server separation
 * and prevents client components from importing service code.
 */

/**
 * BadgeState represents the computed state of a badge for a user
 */
export interface BadgeState {
  badgeSlug: string; // Badge family identifier (e.g., "creator-score", "total-earnings")
  title: string; // Badge category title (e.g., "Creator Score", "Total Followers")
  currentLevel: number; // 0 = locked, 1+ = earned level
  maxLevel: number; // Total number of levels
  isMaxLevel: boolean;
  levelLabel: string; // Current level display (e.g., "Level 3", "1K Followers")
  progressLabel: string; // Progress to next level (e.g., "50 left", "Max Level")
  progressPct: number; // Progress percentage (0-100)
  artworkUrl: string; // Current artwork URL
  description: string;
  categoryName: string; // Badge category name
  sectionId: string; // Section identifier (e.g., "trophies", "records", "special")
  timesEarned?: number; // For streak badges: how many times this badge has been earned
}

/**
 * BadgeSection represents a group of related badges
 */
export interface BadgeSection {
  id: string;
  title: string;
  badges: BadgeState[];
}

/**
 * BadgesResponse represents the complete response from the badges API
 */
export interface BadgesResponse {
  sections?: BadgeSection[];
  badges?: BadgeState[];
  summary?: {
    earnedCount: number;
    totalCount: number;
    completionPct: number;
  };
  lastCalculatedAt?: string | null;
  user?: {
    id: string;
    identifier: string | null;
  };
}

/**
 * BadgeContent represents the configuration for a badge family
 */
export interface BadgeContent {
  slug: string;
  title: string;
  description: string;
  levelThresholds: number[];
  levelLabels: string[];
  uom?: string;
  isStreakBadge?: boolean;
  sectionId: string;
}

/**
 * BadgeSectionContent represents the configuration for a badge section
 */
export interface BadgeSectionContent {
  id: string;
  title: string;
  description?: string;
}
