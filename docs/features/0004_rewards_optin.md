# Rewards Distribution Opt-in System

## Context
Creators who opt out of rewards currently have their money redistributed to remaining creators. We need a system where opted-out money goes to a separate future rewards pool, with an explicit opt-in/opt-out flow for top 200 creators before September 15th.

## Timeline
- **ROUND_ENDS_AT**: August 31st, 2025 (leaderboard freezes)
- **Decision Deadline**: September 15th, 2025, 11:59 PM UTC (default opt-out)
- **Distribution**: September 17th, 2025 (manual distribution)

## Decision Rules
- **Opt-out is IRREVERSIBLE**: Once opted-out, cannot change to opt-in
- **Opt-in is REVERSIBLE**: Can change to opt-out until deadline
- **Default**: All undecided users default to opt-out after deadline

## Rewards Styling Logic
The leaderboard displays rewards amounts with different styling based on user decision status:

- **Undecided users**: Gray text (`text-muted-foreground`) - Users who haven't made a decision yet
- **Opted-in users**: Blue text (`text-brand-blue`) - Users who explicitly opted in
- **Opted-out users**: Green text (`text-brand-green`) + strikethrough + "PAID FORWARD" badge - Users who opted out

**Note**: Users without a record in `user_preferences` table are considered "undecided" and should show gray text.

## Implementation Status

### ✅ Phase 1: Separate Pool Logic - COMPLETE
- Database migration: Added `rewards_decision`, `decision_made_at`, `future_pool_contribution`, `primary_wallet_address` fields
- Updated rewards calculation to use separate pools
- Migration completed: 2,108 total users, 180 with decisions (all opted-out)

### ✅ Phase 2: Opt-in/Opt-out Flow - COMPLETE
- **UI Components**: `RewardsDecisionModal` (two-step flow), `RewardsDecisionModalHandler`, `WalletSelectionStep`
- **API Layer**: `/api/user-preferences/optout`, `/api/user-preferences/opted-out-percentage`, `/api/leaderboard/snapshot`
- **Admin Interface**: `/admin/snapshot` page for manual snapshot creation
- **Integration**: Modal shows to top 200 users on leaderboard page
- **Wallet Logic**: Farcaster primary → Farcaster verified → Talent verified

### ✅ Phase 3: Testing - COMPLETE
- All API endpoints tested and working
- Integration testing completed
- Production build successful

### ✅ Phase 4: Code Simplification - COMPLETE
- **Simplified Data Flow**: Consolidated to single `rewardsDecision` value instead of multiple boolean flags
- **Removed Duplicate Logic**: Eliminated `useOptOutStatus.ts` hook, consolidated to `useUserRewardsDecision.ts`
- **Cleaner Interface**: Modal now receives `rewardsDecision` directly instead of `hasMadeDecision` and `isOptedOut`
- **Better Maintainability**: Single source of truth for decision logic

## Current State
- **Total Users**: 2,108 in database
- **Users with Decisions**: 180 (8.5%)
- **Opted-out Rate**: 100% (dynamically calculated via API, no hardcoded values)
- **Modal Status**: Fully functional and tested
- **Wallet Integration**: Complete (fetches verified wallets for rewards distribution)
- **Production Ready**: Yes

## Pending Tasks
1. **August 31st**: Create leaderboard snapshot manually via `/admin/snapshot`
2. **September 15th**: Manually process undecided users (default to opt-out) via database query
3. **September 17th**: Manual rewards distribution
4. **Post-distribution**: Remove legacy `rewards_optout` field

## Key Files
- **New**: `components/modals/RewardsDecisionModal.tsx`, `components/common/RewardsDecisionModalHandler.tsx`, `hooks/useOptedOutPercentage.ts`
- **Modified**: `hooks/useUserRewardsDecision.ts` (simplified to return single `rewardsDecision` value), `app/leaderboard/page.tsx` (uses simplified interface)
- **Removed**: `hooks/useOptOutStatus.ts` (consolidated into `useUserRewardsDecision.ts`)
- **API**: `/api/user-preferences/optout`, `/api/user-preferences/opted-out-percentage`, `/api/leaderboard/snapshot`, `/api/admin/snapshot/trigger`

## Business Logic
- Modal shows only to top 200 users without decisions
- Always fetches from database (no complex caching)
- Opt-out users get "PAID FORWARD" badge, boosted users get "BOOSTED" badge
- Separate pool system: opted-out rewards go to `future_rewards_pool`
