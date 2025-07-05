# Creator Score Miniapp - Migration Guide

## Overview

You are helping migrate a **Creator Score Miniapp** from an old repository to a new one, following a **strict modular architecture**. The new app must follow these core principles:

```
External APIs → Services → Hooks → Pure UI Components
```

## Migration Strategy

**Order of Operations**: Foundation → Navigation → Leaderboard → Profile → Integration
**Commit Strategy**: One commit per component with descriptive messages that tell the story

## Project Context

### Current State
- **Old Repo**: Has working Creator Score Miniapp with mixed architecture
- **New Repo**: Started with Base Minikit (Next.js bootstrap) - no shadcn/ui yet
- **Target**: Modular architecture with pure UI components and centralized data fetching

### Architecture Principles
1. **Pure UI Components**: All components receive data via props only (no API calls)
2. **Centralized Data Fetching**: Custom hooks handle all API calls and business logic
3. **Service Layer**: External API interactions abstracted into services
4. **Consistent Patterns**: All hooks return `{data, loading, error}` interface

## Phase 1: Foundation Setup

### 1.1 Project Setup
**Goal**: Set up the basic project structure and dependencies

**Tasks**:
- Install and configure shadcn/ui
- Set up Tailwind CSS with proper configuration
- Create basic folder structure (`components/`, `hooks/`, `lib/`, `services/`)
- Install required dependencies (React Query, etc.)

**Commit**: `feat: initial project setup with shadcn/ui and folder structure`

### 1.2 Shared Utilities
**Goal**: Create shared utilities and constants

**Files to create**:
- `lib/constants.ts` - Cache durations, platform names, etc.
- `lib/utils.ts` - Formatting functions (`formatK`, `truncateAddress`, etc.)
- `lib/user-resolver.ts` - Universal user identifier resolution

**Commit**: `feat: add shared utilities and constants`

### 1.3 shadcn/ui Components
**Goal**: Install required shadcn/ui components

**Components needed**:
- `button`, `card`, `avatar`, `badge`, `tabs`, `drawer`, `dialog`, `skeleton`, `progress`

**Commit**: `feat: install required shadcn/ui components`

## Phase 2: Navigation Components

### 2.1 Header Component
**Goal**: Create pure UI header component

**Component**: `components/navigation/Header.tsx`
- Receives user data via props
- No API calls or business logic
- Uses shadcn/ui components

**Mock Data**: Create simple mock user data for testing

**Commit**: `feat: add Header component with mock data`

### 2.2 Bottom Navigation
**Goal**: Create mobile bottom navigation

**Component**: `components/navigation/BottomNav.tsx`
- Pure UI component
- Navigation state via props
- Mobile-first design

**Commit**: `feat: add BottomNav component`

### 2.3 Navigation Hook
**Goal**: Create centralized navigation logic

**Hook**: `hooks/useUserNavigation.ts`
- Handles user authentication state
- Provides navigation items
- Returns `{user, navigationItems, loading, error}`

**Commit**: `feat: add useUserNavigation hook`

### 2.4 Connect Navigation
**Goal**: Connect Header and BottomNav to navigation hook

**Integration**: Update components to use `useUserNavigation`

**Commit**: `feat: connect navigation components to useUserNavigation hook`

## Phase 3: Leaderboard System

### 3.1 LeaderboardRow Component
**Goal**: Create individual leaderboard entry component

**Component**: `components/leaderboard/LeaderboardRow.tsx`
- Pure UI component
- Receives user data via props
- Uses shadcn/ui components

**Commit**: `feat: add LeaderboardRow component`

### 3.2 Leaderboard Data Hooks
**Goal**: Create leaderboard data fetching hooks

**Hooks**:
- `hooks/useLeaderboard.ts` - Paginated leaderboard data
- `hooks/useLeaderboardStats.ts` - Leaderboard statistics
- `hooks/useUserCreatorScore.ts` - Current user's score

**Pattern**: All return `{data, loading, error}` interface

**Commit**: `feat: add leaderboard data hooks`

### 3.3 Leaderboard Page
**Goal**: Create leaderboard page using hooks

**Page**: `app/leaderboard/page.tsx`
- Uses leaderboard hooks for data
- Renders LeaderboardRow components
- Handles loading and error states

**Commit**: `feat: add leaderboard page with hook integration`

### 3.4 Services Integration
**Goal**: Connect hooks to actual API services

**Services**:
- `services/talentService.ts` - Talent Protocol API
- `services/neynarService.ts` - Neynar/Farcaster API

**Commit**: `feat: integrate leaderboard hooks with API services`

## Phase 4: Profile System

### 4.1 Profile UI Components
**Goal**: Create all profile UI components

**Components**:
- `components/profile/ProfileHeader.tsx` - Header with avatar/stats
- `components/profile/StatCard.tsx` - Individual stat display
- `components/profile/AccountCard.tsx` - Social account card
- `components/profile/AccountGrid.tsx` - Grid of accounts
- `components/profile/ProfileTabs.tsx` - Tabs with score breakdown

**All components**: Pure UI, receive data via props

**Commit**: `feat: add profile UI components`

### 4.2 Profile Data Hooks
**Goal**: Create specialized profile data hooks

**Hooks**:
- `hooks/useProfileHeaderData.ts` - User info, earnings, followers
- `hooks/useProfileCreatorScore.ts` - Creator score and breakdown
- `hooks/useProfileSocialAccounts.ts` - Social platform connections
- `hooks/useProfileTotalEarnings.ts` - ETH earnings calculation

**Commit**: `feat: add profile data hooks`

### 4.3 Profile Page
**Goal**: Create profile page using hooks

**Page**: `app/[identifier]/page.tsx`
- Uses profile hooks for data
- Renders profile components
- Handles loading and error states

**Commit**: `feat: add profile page with hook integration`

### 4.4 Profile Modal
**Goal**: Create profile modal for leaderboard

**Component**: `components/leaderboard/MinimalProfileDrawer.tsx`
- Uses profile hooks
- Drawer component for mobile
- Modal for desktop

**Commit**: `feat: add profile modal drawer`

## Phase 5: Integration & Polish

### 5.1 Error Handling
**Goal**: Implement consistent error handling

**Components**: Add error states using `Callout` component
**Hooks**: Ensure all hooks handle errors gracefully

**Commit**: `feat: add comprehensive error handling`

### 5.2 Loading States
**Goal**: Add skeleton loading components

**Components**: Create skeleton versions of main components
**Integration**: Use in all pages and components

**Commit**: `feat: add skeleton loading states`

### 5.3 Caching Strategy
**Goal**: Implement proper caching in hooks

**Caching TTLs**:
- Profile data: 5 minutes
- Score data: 30 minutes
- Leaderboard: 5 minutes

**Commit**: `feat: implement caching strategy in hooks`

### 5.4 Final Integration
**Goal**: Connect all remaining pieces

**Tasks**:
- Ensure all components use hooks
- Remove any remaining API calls from components
- Test all screens and interactions

**Commit**: `feat: complete modular architecture integration`

## Commit Message Guidelines

Use conventional commit format with descriptive messages:

```
feat: add Header component with user navigation
feat: create useLeaderboard hook with pagination
fix: resolve loading state in profile components
refactor: extract common utilities to lib/utils
```

Each commit should tell the story of building the app piece by piece.

## Testing Strategy

**Per Component**:
- Test with mock data first
- Verify component renders correctly
- Check responsive design

**Per Hook**:
- Test loading states
- Test error handling
- Verify data structure

**Per Integration**:
- Test component + hook integration
- Verify caching works
- Check performance

## Key Patterns to Follow

### Hook Interface
```typescript
interface HookReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
```

### Component Props
```typescript
interface ComponentProps {
  // All display data passed as props
  user: User;
  stats: Stats;
  // No API calls in component
}
```

### Service Functions
```typescript
// Clean API abstractions
export async function fetchUserProfile(uuid: string): Promise<User> {
  // Handle API calls, error transformation
}
```

## Success Criteria

- ✅ All components are pure UI (no API calls)
- ✅ All data fetching through hooks
- ✅ Consistent error handling
- ✅ Proper loading states
- ✅ Responsive design
- ✅ Clean commit history that tells the story

## Final Notes

- **Stay lean**: Only build what's needed
- **Test incrementally**: Verify each component works before moving on
- **Commit frequently**: One commit per component/feature
- **Follow patterns**: Use established patterns consistently
- **Document decisions**: Update architecture docs if needed

The goal is to create a maintainable, modular codebase that clearly separates concerns and follows modern React patterns. 