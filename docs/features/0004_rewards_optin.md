# Rewards Distribution Opt-in System - Technical Plan

## Context Description
Currently, creators who opt out of rewards have their money automatically redistributed to remaining creators in the same pool. We need to implement a new system where opted-out money goes to a separate future rewards pool, and later add an explicit opt-in/opt-out flow for all top 200 creators before the August 31st deadline.

## Timeline & Deadlines

### Key Dates:
- **ROUND_ENDS_AT**: August 31st (leaderboard freezes)
- **Decision Deadline**: September 15th, 11:59 PM (default opt-out)
- **Distribution Date**: September 17th (manual distribution)

### Decision Rules Timeline:
- **Before September 15th**: Users can change from opt-in to opt-out
- **September 15th, 11:59 PM**: Deadline for all decisions
- **After Deadline**: All undecided users automatically default to opt-out
- **Opt-out is IRREVERSIBLE**: Once opted-out, cannot change to opt-in

### Phase 1: Separate Pool Logic Algorithm:
1. **Pool Calculation**: When calculating rewards, separate opted-out users' contributions into `future_rewards_pool`
2. **Active Pool**: `TOTAL_SPONSORS_POOL - future_pools_total` = money available for opted-in creators
3. **Future Pool**: Accumulate all opted-out amounts for later distribution
4. **Data Migration**: Update existing opted-out users to have `rewards_decision: 'opted_out'` and calculate their `future_pool_contribution`

### Phase 2: Opt-in/Opt-out Flow Algorithm:
1. **Snapshot Creation**: On `ROUND_ENDS_AT`, create frozen copy of top 200 leaderboard entries
2. **Modal Display**: Show `RewardsDecisionModal` to top 200 users when they visit `/leaderboard` page
3. **Decision Storage**: Store user's choice in `user_preferences.rewards_decision` field
4. **Decision Rules**: 
   - **Opt-out is IRREVERSIBLE**: Once opted-out, users cannot change to opt-in
   - **Opt-in is REVERSIBLE**: Users can change from opt-in to opt-out until the deadline
   - **Deadline**: September 15th, 11:59 PM - after this, all undecided users default to opt-out
5. **Default Behavior**: If no decision by deadline, default to opt-out

### Pool Separation Algorithm:
```typescript
// Calculate active pool (for opted-in creators)
const activePool = TOTAL_SPONSORS_POOL - futurePoolTotal;

// Calculate future pool (accumulated opted-out amounts)
const futurePool = optedOutUsers.reduce((sum, user) => 
  sum + user.future_pool_contribution, 0
);

// Distribute active pool only to opted-in creators
const multiplier = activePool / totalOptedInBoostedScores;
```

## File Mapping

### New Files to Create:
- `components/modals/RewardsDecisionModal.tsx` - Modal asking users to opt-in or opt-out (forked from HowToEarnModal)
- `components/common/RewardsDecisionModalHandler.tsx` - Handler for the rewards decision modal

### Existing Files to Modify:
- `lib/constants.ts` - Add new constants for rewards distribution dates and pool separation
- `app/services/rewardsCalculationService.ts` - Modify to use separate pools (active vs. future)
- `app/services/optoutService.ts` - Modify to handle new opt-in/opt-out system and track future pool contributions
- `app/api/user-preferences/optout/route.ts` - Update to handle new rewards decision system
- `lib/types/user-preferences.ts` - Add new fields for rewards decision and future pool tracking
- `app/services/userPreferencesService.ts` - Add handling for new rewards decision fields
- `app/leaderboard/page.tsx` - Add RewardsDecisionModalHandler to show modal to top 200 users
- `hooks/useOptOutStatus.ts` - Extend existing hook to handle new rewards decision system

### Database Changes:
- **REPLACE** existing `rewards_optout` boolean field with new `rewards_decision` enum field ('opted_in', 'opted_out', null)
- Add `decision_made_at` timestamp field
- Add `future_pool_contribution` numeric field to track how much each opted-out user contributed to future pool
- Add `primary_wallet_address` field to store the selected wallet address for rewards (default: Farcaster primaryEthAddress, fallback: first Talent verified wallet)
- `leaderboard_snapshots` table: New table to store frozen leaderboard data at `ROUND_ENDS_AT`

## Database Migration Strategy

### Field Replacement Approach:
- **Replace** `rewards_optout` boolean with `rewards_decision` enum
- **Migration Logic**: 
  - `rewards_optout = true` → `rewards_decision = 'opted_out'`
  - `rewards_optout = false` → `rewards_decision = 'opted_in'`
  - `rewards_optout = null` → `rewards_decision = null`
- **Future Pool Calculation**: For users with `rewards_decision = 'opted_out'`, calculate their historical contribution to the rewards pool and set `future_pool_contribution`

### Migration Steps:
1. Add new fields to `user_preferences` table
2. Create migration script to populate `rewards_decision` based on existing `rewards_optout` values
3. Calculate and populate `future_pool_contribution` for opted-out users
4. Populate `primary_wallet_address` field with verified addresses from Farcaster (primaryEthAddress preferred) and Talent Protocol
5. Drop old `rewards_optout` field after successful migration

## Architecture Compliance

### Hook → API Route → Service → External API Pattern:
- **Client Hook**: `useOptOutStatus` (extended) manages local state and API calls
- **API Route**: Existing `/api/user-preferences/optout` handles both opt-in and opt-out requests
- **Service**: Extended `OptoutService` manages business logic for both decisions and pool tracking
- **Database**: Supabase stores future pool data and user decisions

### Client-Server Separation:
- All rewards calculations happen server-side using separate pool logic
- Client only displays decisions and handles user interactions
- No live pool calculations on client side

## Design System Compliance

### UI Components:
- Fork `HowToEarnModal` to create `RewardsDecisionModal` with two-step flow:
  - **Step 1**: Opt-in/Opt-out decision
  - **Step 2**: Wallet selection (only shown for opt-in users)
- Use existing `useAutoModal` hook for modal persistence
- Follow existing modal patterns for mobile-first responsive design (bottom sheet on mobile, overlay on desktop)
- Use semantic colors: green for opt-out, purple for boost
- **Wallet Selection UI**: Radio buttons for important choice, showing truncated address + copy address button
- **Wallet Labels**: Include subtle labels for Farcaster custodyAddress, Farcaster primaryEthAddress, and Talent verified wallets
- **Default Selection**: Farcaster primaryEthAddress (fallback: first Talent verified wallet)
- **Confirmation**: Wallet selection mandatory for opt-in, with "Confirm" button before saving decision

### Sponsor Recognition in Modal:
- **Requirement**: The opt-in/opt-out modal should prominently mention and thank all sponsors who contributed to the rewards pool
- **Implementation**: Display a list of sponsor names/logos in the modal to acknowledge their contribution
- **Purpose**: Increase transparency and show creators who is funding their potential rewards
- **Design**: Use existing sponsor logo components and maintain consistent styling with the modal

### Typography and Layout:
- Use existing `Typography` component for consistent text styling
- Follow existing modal layout patterns with proper padding and spacing
- Maintain mobile-first approach with bottom sheet on mobile

## Code Reuse

### Existing Components:
- Fork `HowToEarnModal.tsx` for the new rewards decision modal
- Reuse `useAutoModal` hook for modal persistence logic
- Leverage existing `userPreferencesService` for storing decisions
- Use existing modal components (`Dialog`, `Drawer`) for responsive behavior
- Extend existing `useOptOutStatus` hook instead of creating new one

### Existing Services:
- Extend `rewardsCalculationService` for separate pool calculations
- Modify `optoutService` to handle new decision system and future pool tracking
- Reuse existing Supabase patterns and error handling
- Use existing `/api/user-preferences/optout` endpoint for both decisions

## Phase Breakdown

### Phase 1: Separate Pool Logic (Foundation) - IMPLEMENT FIRST
1. **Database Migration**: Replace `rewards_optout` with `rewards_decision` and add future pool fields
2. **Service Updates**: Modify rewards calculation to use separate pools
3. **API Updates**: Update opt-out endpoint to handle pool separation
4. **Testing**: Verify pool separation works correctly with real data

### Phase 2: Opt-in/Opt-out Flow (User Experience) - AFTER PHASE 1
1. **Database Schema**: Add leaderboard snapshots table
2. **Service Extensions**: Add snapshot functionality and decision management
3. **UI Components**: Create modal and handler components with sponsor recognition
4. **Integration**: Connect all components and services
5. **Scheduled Job**: Implement cron job at ROUND_ENDS_AT to create leaderboard snapshot
6. **Data Source Switch**: Update leaderboard logic to fetch from snapshot DB after ROUND_ENDS_AT instead of Talent API (but keep Talent API as fallback code)
7. **UI Updates**: Change rewards amount display to text-muted-foreground for "no decision" users

### Phase 3: Testing & Validation
1. **Pool Logic Testing**: Verify separate pools work correctly with real opted-out users
2. **User Flow Testing**: Test opt-in/opt-out decision flow
3. **Integration Testing**: End-to-end testing of complete system
4. **Performance Testing**: Ensure no impact on existing leaderboard performance

### Phase 4: Production Migration & Cleanup
1. **Final Migration Check**: Before merging to production, re-run migration to catch any new opted-out users
2. **Remove Redundant Fields**: After confirming all users migrated, remove `rewards_optout` field


## Implementation Notes

### Testing Strategy:
- Use real data with existing opted-out users to test pool separation
- No need for mock data scenarios
- Focus on verifying calculations match expected outcomes

### UI Restrictions:
- No UI elements to show future pool amounts
- **Opt-out decisions are irreversible** - no UI to change from opt-out to opt-in
- **Opt-in decisions are reversible** - users can change to opt-out until September 15th deadline in the /settings page
- Modal only shows to top 200 users on `/leaderboard` page
- After deadline, all undecided users automatically default to opt-out

### Security & Validation:
- Server-side validation prevents opt-out to opt-in changes (irreversible)
- Server-side validation allows opt-in to opt-out changes until September 15th deadline
- No client-side manipulation of pool calculations
- All critical logic handled in services layer
- Wallet address validation ensures decisions are tied to verified addresses
- Store both `rewards_decision` and `primary_wallet_address` in same database record
- Wallet selection mandatory for opt-in users
