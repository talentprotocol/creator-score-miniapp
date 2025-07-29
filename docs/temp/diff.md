

creator-score-miniapp/
  app/                           # Next.js app directory
    api/                         # API route handlers 
      farcaster-wallets/         # Unified wallet resolution **from: creator-score-miniapp**
      leaderboard/               # Leaderboard data aggregation **from: creator-score-miniapp**
      talent-credentials/        # Talent Protocol credentials **from: creator-score-miniapp**
      talent-score/              # Talent Protocol scores **from: creator-score-miniapp**
      talent-socials/            # Social account data **from: creator-score-miniapp**
      talent-user/               # User profile data **from: creator-score-miniapp**
    [identifier]/                # Dynamic profile routes (Farcaster/UUID) **from: creator-score-miniapp**
    leaderboard/                 # Leaderboard page **from: creator-score-miniapp**
    settings/                    # Settings page **from: creator-score-miniapp**
    services/                    # Modular service layer (refactored from single file)
      types.ts                   # Shared interfaces and types **from: creator-score-miniapp**
      scoresService.ts           # Score-related functions (Builder/Creator scores) **from: creator-score-miniapp**
      credentialsService.ts      # Credential fetching and grouping **from: creator-score-miniapp**
      leaderboardService.ts      # **similar**
      socialAccountsService.ts   # Social account data processing **from: creator-score-miniapp**
      leaderboardService.ts      # Leaderboard data and statistics **similar**
      neynarService.ts             # Neynar/Farcaster API client **from: creator-score-miniapp**
    layout.tsx                   # App layout with providers **from: creator-score-miniapp**
    page.tsx                     # Root page  **from: creator-score-miniapp**
    providers.tsx                # React context providers  **from: creator-score-miniapp**
    globals.css                  # Global styles **from: creator-score-miniapp**
    theme.css                    # Theme customizations **from: creator-score-miniapp**

  components/                    # Pure UI components (props-only, no API calls)
    leaderboard/                 # Leaderboard UI components **from: creator-score-miniapp**
    navigation/                  # Navigation components **from: creator-score-miniapp**
    profile/                     # Profile UI components
      AccountCard.tsx            # Social account display card **similar**
      AccountGrid.tsx            # Grid of social accounts **similar**
      ProfileHeader.tsx          # Profile header with avatar/stats **similar**
      ProfileScreen.tsx          # Main profile layout **similar**
      ProfileTabs.tsx            # Profile tabs layout **similar**
      ScoreProgressAccordion.tsx # Creator Score progress display **similar**
      ScoreDataPoints.tsx        # Credential breakdown display **similar**
      CredentialIdeasCallout.tsx # Feedback callout component  **similar**
      comingSoonCredentials.ts   # Placeholder credentials config  **similar**
    ui/                          # shadcn/ui primitives **from: creator-score-miniapp**

  hooks/                         # Custom React hooks (all data fetching)
    useLeaderboard.ts            # Paginated leaderboard data **similar**
    useLeaderboardStats.ts       # Leaderboard statistics **similar**
    useProfileCreatorScore.ts    # User creator score and breakdown **similar**
    useProfileCredentials.ts     # User credentials data **from: creator-score-miniapp**
    useProfileHeaderData.ts      # Profile header data **similar**
    useProfileSocialAccounts.ts  # User social accounts **from: creator-score-miniapp**
    useProfileTotalEarnings.ts   # ETH earnings calculation **from: creator-score-miniapp**
    useProfileWalletAddresses.ts # Profile wallet addresses **from: creator-score-miniapp**
    useUserCreatorScore.ts       # Current user's score with FID caching **from: creator-score-miniapp**
    useUserNavigation.ts         # Navigation state and user context **from: creator-score-miniapp**

  lib/                           # Shared utilities and configuration
    api-utils.ts                 # Shared API utilities (validation, error handling, retry) **Similar**
    constants.ts                 # App-wide constants (cache durations, etc.) **Similar**
    credentialUtils.ts           # Credential processing utilities **Similar**
    neynar-client.ts             # Abstracted Neynar API client **from: creator-score-miniapp**
    talent-api-client.ts         # Abstracted Talent Protocol API client **Similar**
    total-earnings-config.ts     # Total earnings calculation configuration **Similar**
    user-context.ts              # Unified user context utilities **from: creator-score-miniapp**
    user-resolver.ts             # Universal user identifier resolution **from: creator-score-miniapp**
    utils.ts                     # Utility functions (formatting, validation) **from: creator-score-miniapp**

```