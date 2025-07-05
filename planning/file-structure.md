# Creator Score Miniapp - Modular File Structure

This file structure reflects the **completed modular architecture** where UI components are pure (props-only) and all data fetching is handled by specialized hooks and services.

## Core Architecture Principles

- **Pure UI Components**: All components in `components/` receive data via props only
- **Centralized Data Fetching**: Custom hooks in `hooks/` handle all API calls and business logic
- **Modular Service Layer**: External API interactions split into focused, single-responsibility services
- **MiniApp Authentication**: User context provided automatically via MiniKit (no separate auth needed)
- **Shared Utilities**: Common functions and constants in `lib/`

```plaintext
creator-score-miniapp/
  app/                           # Next.js app directory
    api/                         # API route handlers (REFACTORED: ~80% code reduction)
      farcaster-wallets/         # Unified wallet resolution (consolidated from 2 routes)
      leaderboard/               # Leaderboard data aggregation
      notify/                    # Notification handling
      talent-credentials/        # Talent Protocol credentials (simplified with client)
      talent-score/              # Talent Protocol scores (simplified with client)
      talent-socials/            # Social account data (simplified with client)
      talent-user/               # User profile data (simplified with client)
      webhook/                   # Webhook handlers
    [identifier]/                # Dynamic profile routes (Farcaster/GitHub/UUID)
      page.tsx                   # Profile page - uses useProfile* hooks
    leaderboard/                 # Leaderboard page
      page.tsx                   # Leaderboard - uses useLeaderboard* hooks
    settings/                    # Settings page
      page.tsx                   # Settings page (minimal)
    services/                    # Modular service layer (refactored from single file)
      types.ts                   # Shared interfaces and types
      scoresService.ts           # Score-related functions (Builder/Creator scores)
      credentialsService.ts      # Credential fetching and grouping
      socialAccountsService.ts   # Social account data processing
      leaderboardService.ts      # Leaderboard data and statistics
    layout.tsx                   # App layout with providers
    page.tsx                     # Root page (redirects to leaderboard)
    providers.tsx                # React context providers
    globals.css                  # Global styles
    theme.css                    # Theme customizations

  components/                    # Pure UI components (props-only, no API calls)
    leaderboard/                 # Leaderboard UI components
      LeaderboardRow.tsx         # Individual leaderboard entry
      MinimalProfileDrawer.tsx   # Profile modal overlay
    navigation/                  # Navigation components
      BottomNav.tsx              # Mobile bottom navigation
      Header.tsx                 # Top header with user info
      InfoModal.tsx              # About/info modal
    profile/                     # Profile UI components (REFACTORED: ProfileTabs modularized)
      AccountCard.tsx            # Social account display card
      AccountGrid.tsx            # Grid of social accounts
      ProfileHeader.tsx          # Profile header with avatar/stats
      ProfileScreen.tsx          # Main profile layout
      ProfileTabs.tsx            # Profile tabs layout (REFACTORED: 388→85 lines)
      ScoreProgressAccordion.tsx # Creator Score progress display (EXTRACTED from ProfileTabs)
      ScoreDataPoints.tsx        # Credential breakdown display (EXTRACTED from ProfileTabs)
      CredentialIdeasCallout.tsx # Feedback callout component (EXTRACTED from ProfileTabs)
      comingSoonCredentials.ts   # Placeholder credentials config
    settings/                    # Settings UI components (empty)
    ui/                          # shadcn/ui primitives
      accordion.tsx              # Collapsible content
      avatar.tsx                 # User avatar component
      badge.tsx                  # Status badges
      button.tsx                 # Button variants
      Callout.tsx                # Alert/info callouts
      card.tsx                   # Content cards
      dialog.tsx                 # Modal dialogs
      drawer.tsx                 # Bottom sheet/drawer
      progress.tsx               # Progress bars
      skeleton.tsx               # Loading skeletons
      StatCard.tsx               # Individual stat display (MOVED from profile/)
      tabs.tsx                   # Tab navigation

  hooks/                         # Custom React hooks (all data fetching)
    useLeaderboard.ts            # Paginated leaderboard data
    useLeaderboardStats.ts       # Leaderboard statistics
    useProfileCreatorScore.ts    # User creator score and breakdown
    useProfileCredentials.ts     # User credentials data
    useProfileSocialAccounts.ts  # User social accounts
    useProfileTotalEarnings.ts   # ETH earnings calculation
    useUserCreatorScore.ts       # Current user's score with FID caching
    useUserNavigation.ts         # Navigation state and user context

  services/                      # External API integration layer (modular)
    neynarService.ts             # Neynar/Farcaster API client

  lib/                           # Shared utilities and configuration
    api-utils.ts                 # NEW: Shared API utilities (validation, error handling, retry)
    talent-api-client.ts         # NEW: Abstracted Talent Protocol API client
    neynar-client.ts             # NEW: Abstracted Neynar API client
    constants.ts                 # App-wide constants (cache durations, etc.)
    credentialUtils.ts           # NEW: Credential processing utilities (EXTRACTED from ProfileTabs)
    notification-client.ts       # Notification system client
    notification.ts              # Notification helpers
    redis.ts                     # Redis caching utilities
    total-earnings-config.ts     # Total earnings calculation configuration
    user-context.ts              # User context utilities
    user-resolver.ts             # Universal user identifier resolution
    utils.ts                     # Utility functions (formatting, validation)

  public/                        # Static assets
    avatar.png                   # Default avatar
    fc.svg                       # Farcaster icon
    hero.png                     # Hero image
    icon.png                     # App icon
    logo.png                     # App logo
    screenshot.png               # App screenshot
    splash.png                   # Splash screen

  planning/                      # Documentation and planning
    architecture.md              # Core principles and patterns
    migration-plan.md            # Completed migration documentation
    file-structure.md            # This file
    tasks.md                     # Development tasks

  scripts/                       # Development and utility scripts
    leaderboard-test.ts          # Leaderboard testing script

  # Configuration files
  components.json                # shadcn/ui configuration
  next.config.mjs               # Next.js configuration
  package.json                  # Dependencies and scripts
  postcss.config.mjs            # PostCSS configuration
  tailwind.config.ts            # Tailwind CSS configuration
  tsconfig.json                 # TypeScript configuration
  README.md                     # Project documentation
```

## Key Architectural Patterns

### Data Flow Pattern
```
MiniKit Context (User Auth) → External APIs → API Clients (lib/) → Modular Services → API Routes → Hooks → Components
```

### Critical Architecture Rule: Client-Server Separation

**ENFORCED PRINCIPLE**: Client-side code (hooks, components) must never directly import server-side services. All data fetching flows through API routes to ensure proper separation and prevent runtime errors.

**REQUIRED PATTERN**: 
```
❌ PROHIBITED: Hook → Direct Service Import → External API
✅ REQUIRED: Hook → API Route → Service → External API
```

### Service Layer Architecture (NEW)
The service layer has been refactored from a single 926-line file into focused modules:

- **types.ts**: All shared interfaces and constants
- **scoresService.ts**: Builder/Creator score calculations and API calls
- **credentialsService.ts**: Credential fetching and issuer grouping logic
- **socialAccountsService.ts**: Social account data processing and normalization
- **leaderboardService.ts**: Leaderboard data and statistics

### Hook Naming Convention
- `useProfile*` - Profile-specific data (requires talentUUID)
- `useLeaderboard*` - Leaderboard-related data
- `useUser*` - Current authenticated user data

### Component Interface Standards
- **Page Components**: Accept only routing/identifier props
- **UI Components**: Receive all display data via props
- **No API calls** in any component - all handled by hooks

### Caching Strategy
- **Profile Data**: 5 minutes (user info, social accounts)
- **Score Data**: 30 minutes (computationally expensive)
- **Leaderboard**: 5 minutes with background refresh
- **ETH Prices**: 30 minutes with fallback

### Error Handling Pattern
All hooks return: `{ data, loading, error }` consistently
Components display errors using `Callout` component with graceful fallbacks

## Service Layer Refactoring Details

### Before: Single Monolithic File
- `app/services/talentService.ts` - 926 lines, 11 functions, mixed responsibilities

### After: Modular Architecture
- `app/services/types.ts` - 76 lines, all shared types
- `app/services/scoresService.ts` - 180 lines, score-related functions
- `app/services/credentialsService.ts` - 109 lines, credential functions
- `app/services/socialAccountsService.ts` - 122 lines, social account functions
- `app/services/leaderboardService.ts` - 28 lines, leaderboard functions

### Benefits Achieved
- **Reduced Complexity**: 926 lines → 5 focused modules (~150 lines each)
- **Single Responsibility**: Each service handles one domain
- **Easier Testing**: Isolated functions per domain
- **Better Maintainability**: Clear separation of concerns
- **Removed Dead Code**: Eliminated unused Farcaster-specific functions

## File Organization Rules

1. **Components**: Pure UI only, no business logic
2. **Hooks**: All data fetching, caching, and business logic
3. **Services**: External API abstractions, now modular by domain
4. **Lib**: Shared utilities, constants, and configurations
5. **Planning**: All documentation and architectural decisions

This structure enables:
- **Fast development** with clear separation of concerns
- **Easy testing** with isolated business logic
- **Maintainable code** with consistent patterns
- **Reusable components** across different contexts 
- **Focused modules** with single responsibilities 