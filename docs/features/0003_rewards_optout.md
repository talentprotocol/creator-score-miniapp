# Rewards Opt-Out Feature - Technical Plan

## Context Description

Allow creators to signal their intent to donate their entire reward allocation back to the rewards pool before distribution, while maintaining their leaderboard position. This transforms the leaderboard from purely competitive to community-driven, allowing creators to give back while receiving social recognition for their generosity.

Users can opt out of receiving rewards to pay them forward to other creators. The opt-out is all-or-nothing (entire reward amount) and cannot be changed once confirmed. Final rewards calculations use scores at distribution time, and remaining creators get proportionally larger shares of the total pool.

## File Mapping

### New Files to Create:
- `app/api/user-preferences/optout/route.ts` - API endpoint for opt-out requests
- `app/services/optoutService.ts` - Service layer for opt-out logic
- `components/settings/PayItForwardSection.tsx` - Settings section for rewards opt-out (note: named differently from plan)
- `hooks/useOptOutStatus.ts` - Custom hook for managing opt-out status across top-200 and non-top-200 users
- `app/services/rewardsCalculationService.ts` - Centralized rewards calculation service with opt-out support

### Existing Files to Modify:
- `lib/constants.ts` - Enable optout callout flag
- `app/leaderboard/page.tsx` - Update callout to navigate directly to settings
- `components/leaderboard/MyRewards.tsx` - Add "PAY FORWARD" badge and crossed-out rewards
- `components/common/CreatorList.tsx` - Add OptOut badge to leaderboard entries
- `app/services/leaderboardService.ts` - Modify rewards calculation to exclude opted-out users
- `app/services/userPreferencesService.ts` - Add opt-out preference handling
- `lib/types/user-preferences.ts` - Add opt-out preference type
- `hooks/useLeaderboardData.ts` - Enhanced with opt-out status management

### Database Changes:
- `user_preferences` table: Add `rewards_optout` boolean field with default `false`

## Algorithm Explanation

### Rewards Redistribution Algorithm:
1. **Collect Opt-out Status**: Query all users with `rewards_optout = true`
2. **Filter Eligible Users**: At distribution time, filter opted-out users who are in top 200
3. **Apply Boost Calculation**: Calculate boosted scores (1.1x multiplier) **only for users with 100+ TALENT tokens**
4. **Calculate Pool**: Total rewards pool remains constant ($8,850)
5. **Redistribute**: Remaining eligible creators (top 200 minus opted-out) share the full pool proportionally
6. **Formula**: `individual_reward = (boosted_score / total_remaining_boosted_scores) * total_pool`
7. **Opt-out Contribution**: Opted-out users contribute their boosted amount to the pool

**Note**: Boost multiplier (1.1x) is applied **only** to users holding 100+ TALENT tokens, not to all users.

### Opt-out Badge Priority:
- OptOut badge takes precedence over Boost badge
- If user is both boosted and opted-out, show only OptOut badge
- Use green brand variant with HandHeart icon

## Enhanced User Experience Features (Beyond Basic Plan)

### Confetti Celebration System:
- **Custom ConfettiButton Component**: Built using `canvas-confetti` with brand green color scheme
- **Auto-fire on Success**: Automatically triggers confetti when opt-out is successful
- **Success State Transition**: Shows "Successfully Paid Forward!" message with confetti animation
- **Completion Callback**: After confetti finishes, transitions to share button

### Social Sharing Capabilities:
- **ShareStatsModal Integration**: Uses existing modal component with custom Pay It Forward messaging
- **Multi-Platform Support**: 
  - Farcaster: Native SDK integration + web fallback
  - Twitter: Web intent URLs with custom messaging
- **Custom Share Text**: "I paid forward 100 percent of my Creator Score rewards to support onchain creators"
- **Analytics Tracking**: PostHog events for share interactions

### Enhanced State Management:
- **Real-time Updates**: Immediate UI updates with scheduled cache refresh
- **Cross-Component Sync**: Leaderboard data updates instantly across all components
- **Persistent State**: Remembers opt-out status across sessions

## Architecture Compliance

### Hook → API Route → Service Pattern:
- **Hook**: `useOptOutStatus` + `useLeaderboardData` - handles state management and cache updates
- **API Route**: `POST /api/user-preferences/optout` - handles opt-out requests
- **Service**: `optoutService.ts` - manages opt-out business logic
- **External API**: None required, uses existing Supabase user_preferences table
- **Direct Access**: Users can access opt-out directly via settings page without callout interaction

### Client-Server Separation:
- Client: Settings UI, callout navigation, badge display, confetti, sharing
- Server: Opt-out processing, rewards calculation modification
- No external API calls from client side

## Design System

### UI Components:
- **Settings Section**: Use existing `SectionAccordion` component
- **Opt-out Form**: Use image content structure (warning, consequences, confirmation) with existing design system styling
- **Badges**: Extend existing badge system, use green brand variant
- **Typography**: Use `Typography` component for all text elements
- **Mobile-First**: Ensure responsive design for mobile devices
- **Confetti**: Custom green theme matching brand colors
- **Share Modal**: Consistent with existing modal patterns

### Color Usage:
- OptOut badge: Green brand variant (`bg-brand-green-light`, `text-brand-green`)
- Crossed-out rewards: Use green color to match "pay it forward" theme
- Confetti: Brand green color palette (`#84cc16`, `#65a30d`, `#4ade80`, `#86efac`, `#bbf7d0`)
- No custom brand colors unless necessary

## Code Reuse

### Existing Components:
- Reuse `SectionAccordion` for settings layout
- Extend existing badge system for OptOut badge
- Use existing `Callout` component (already implemented)
- Leverage existing user preferences service structure
- Integrate with existing `ShareStatsModal` component
- Use existing `ButtonFullWidth` and `Typography` components

### Existing Services:
- Extend `userPreferencesService.ts` for opt-out preferences
- Modify `leaderboardService.ts` for rewards calculation
- Use existing Supabase client and error handling patterns
- Leverage existing PostHog analytics setup

## Phase Breakdown

### Phase 1: Data Layer
1. Add `rewards_optout` field to user_preferences table
2. Update user preferences types and service
3. Create opt-out service layer

### Phase 2: API & Backend
1. Create opt-out API endpoint
2. Modify rewards calculation logic
3. Update leaderboard service
4. Create centralized rewards calculation service

### Phase 3: UI Implementation
1. Create Pay It Forward settings section
2. Update leaderboard badges and rewards display
3. Enable callout and configure navigation to settings
4. Implement confetti celebration system
5. Add social sharing capabilities
6. Refactor existing inline rewards calculations to use the new centralized service

### Phase 4: Integration & Testing
1. Connect all components
2. Test rewards calculation with opt-outs
3. Verify badge display and priority logic
4. Test confetti and sharing flows
5. Validate analytics tracking

## Commit Strategy

### Milestone 1: Database Schema
```bash
git add lib/types/user-preferences.ts app/services/userPreferencesService.ts
git commit -m "feat: add rewards opt-out preference to user preferences"
```

### Milestone 2: Backend Services
```bash
git add app/services/optoutService.ts app/api/user-preferences/optout/route.ts
git commit -m "feat: implement opt-out service and API endpoint"
```

### Milestone 3: Rewards Calculation
```bash
git add app/services/leaderboardService.ts app/services/rewardsCalculationService.ts
git commit -m "feat: modify rewards calculation to handle opted-out users"
```

### Milestone 4: Settings UI & Enhanced UX
```bash
git add components/settings/PayItForwardSection.tsx hooks/useOptOutStatus.ts
git commit -m "feat: add Pay It Forward settings section with confetti and sharing"
```

### Milestone 5: Leaderboard Updates
```bash
git add components/leaderboard/MyRewards.tsx components/common/CreatorList.tsx
git commit -m "feat: add OptOut badges and crossed-out rewards to leaderboard"
```

### Milestone 6: Callout & Integration
```bash
git add lib/constants.ts app/leaderboard/page.tsx hooks/useLeaderboardData.ts
git commit -m "feat: enable opt-out callout and configure navigation to settings"
```

## Implementation Notes

### Naming Differences from Plan:
- **Plan**: `RewardsDistributionSection.tsx`
- **Actual**: `PayItForwardSection.tsx`
- **Rationale**: Better reflects the user-facing feature name and purpose

### Enhanced Features Beyond Plan:
- **Confetti System**: Provides immediate positive feedback for generous acts
- **Social Sharing**: Amplifies the "Pay It Forward" message across platforms
- **Real-time Updates**: Immediate UI synchronization across components
- **Analytics Integration**: Comprehensive tracking of user interactions

### Technical Enhancements:
- **Custom Hook**: `useOptOutStatus` handles complex state management
- **Centralized Service**: `rewardsCalculationService` provides clean separation of concerns
- **Cache Management**: Intelligent cache invalidation and real-time updates
- **Error Handling**: Comprehensive error states and user feedback
