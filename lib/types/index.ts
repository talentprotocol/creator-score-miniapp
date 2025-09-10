// Re-export all types for convenient imports
// Use this file to import multiple types: import { ProfileResponse, Credential } from "@/lib/types"

// Profile types
export type {
  ProfileResponse,
  UnifiedUserProfile,
  WalletAccount,
  GroupedWalletAccounts,
  WalletAccountsResponse,
  ConnectedAccount,
  ConnectedAccountsResponse,
  GroupedConnectedAccounts,
  UserSettings,
  AccountManagementAction,
} from "./profiles";

// Credential types
export type {
  Credential,
  CredentialsResponse,
  IssuerCredentialGroup,
  HumanityCredential,
  HumanityCredentialsResponse,
} from "./credentials";

// Social account types
export type { SocialAccount, TalentSocialAccount } from "./social-accounts";

// Post types
export type { Post, PostsResponse } from "./posts";

// Search types
export type { SearchProfile, SearchResponse, SearchResult } from "./search";

// Score types
export type { BuilderScore, CreatorScore } from "./scores";
export { SCORER_SLUGS } from "./scores";

// Existing types (already properly organized)
export type {
  LeaderboardEntry,
  LeaderboardSnapshot,
  LeaderboardSnapshotResponse,
} from "./leaderboard";

export type { BadgeState, BadgeSection, BadgesResponse } from "./badges";

export type {
  UserPreferences,
  UserPreferencesResponse,
} from "./user-preferences";

// Reward types
export type { StoredRewardsData, TokenBalanceData } from "./rewards";

// Leaderboard types
export type { LeaderboardResponse } from "./leaderboard";

// Perk types
export type { PerkEntryStatus } from "./perks";

// Wallet types
export type { UserWalletAddresses } from "./wallet";
