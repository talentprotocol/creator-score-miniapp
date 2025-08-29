# TALENT Token Boost Feature - PRD

## Elevator Pitch
Add a 10% reward boost for creators holding 1000+ TALENT tokens, displayed through subtle visual indicators on the main leaderboard and a dedicated "Boosts" leaderboard tab. This incentivizes token holding while creating a premium tier of creators, driving both engagement and token utility.

## Goals & Success Metrics

### Primary Goal
- **Increase token adoption**: Drive TALENT token holding among top creators

### Success Metrics (30-day post-launch)
- **Token Growth**: 25% increase in creators holding 1000+ TALENT tokens

## Functional Requirements

### Core Boost Logic
- **Eligibility**: Creators with 1000+ TALENT tokens receive 10% reward boost
- **Boost Amount**: Fixed 10% regardless of token quantity above threshold
- **Pool Source**: Boosts are redistributed from the existing rewards pool using weighted scoring (Creator Score × 1.10 for token holders)
- **Update Frequency**: Boost status updates when load the /leaderboard page
- **Immediate Effect**: Boost lost instantly if holdings drop below 1000 tokens

### Data Integration
- Token balance data included in existing Talent API leaderboard endpoint (the data point slug is `talent_protocol_talent_holder`)
- Calculate boosted reward amounts in real-time
- Display token count in UI components

### Visual Indicators
- **Main Leaderboard**: Subtle indicator using Talent Protocol logo + "+10%" text
- **My Rewards Component**: Display base reward + boost amount + token balance
- **Token Acquisition CTA**: External link to Aerodrome via modal



## User Stories

### For Token Holders (1000+ TALENT)
- **As a creator with 1000+ tokens**, I can see a subtle boost indicator next to my name on the leaderboard, so I know I'm receiving the 10% bonus
- **As a boosted creator**, I can view my boosted reward amount and token balance in the "My Rewards" section, so I understand the financial benefit of holding tokens
- **As a token holder**, I can see my token count displayed in the "My Rewards" component and on the "Boosts" leaderboard, so I can track my holding status

### For Non-Token Holders
- **As a creator without tokens**, I see a clear callout explaining the 10% boost opportunity with a CTA to acquire tokens
- **As a potential token buyer**, I can access Aerodrome directly from the app, so I can easily acquire tokens

### For All Users
- **As any user**, I can switch to the "Boosts" tab to see only boosted creators, so I can view the premium tier of token-holding creators

## User Interface

### Main Leaderboard Enhancements
- **Boost Indicator**: Subtle Talent Protocol icon + "+10%" badge next to creator names (token holders only)
- **Tab Addition**: New "Boosts" tab with badge counter showing boosted creators in top 200 (creators with boost AND non-zero rewards)
- **My Rewards Update**: Show "Base: $45 | Boost: $4.50 | Tokens: 1,250"

### Boosts Leaderboard Tab
- **Filtered View**: Shows only creators with 1000+ tokens AND non-zero rewards (top 200 eligible)
- **Tab Badge**: Displays count of qualifying boosted creators (e.g., "Boosts (47)")
- **Enhanced Data**: Display token count below creator name
- **Same Layout**: Maintains existing leaderboard design and ranking system
- **Empty State**: Message when no boosted creators exist in top 200
- **Data Freshness**: Shows "Token balances as of [timestamp]. Next update in [countdown]"

### Token Acquisition Flow
- **Callout Component**: Existing callout component placed under MyRewards on /leaderboard
- **Content**: Talent icon + "Hold 1000+ TALENT tokens for 10% reward boost"
- **CTA**: "Get Tokens" button opens modal with external Aerodrome link



## Implementation Plan

### Phase 1: Core Boost Logic (COMPLETED)
- **Token Balance Integration**: Add token data to existing leaderboard API response
- **Boost Calculation**: Implement weighted scoring (Creator Score × 1.10 for token holders)
- **Caching Strategy**: Implement hybrid caching with background refresh
- **Performance Optimization**: Non-blocking cache access with graceful fallback

### Phase 2: Main Leaderboard UI & Boosts Tab (COMPLETED)
- **Boost Indicators**: Add subtle "+10%" badges for token holders
- **MyRewards Enhancement**: Display token balance and boost breakdown
- **Boosts Tab**: Create filtered view with badge counter for boosted creators in top 200
- **Request Deduplication**: Prevent duplicate API calls

### Phase 3: Token Acquisition Flow (PENDING)
- **Callout Component**: Add boost explanation under MyRewards for non-holders
- **Token Modal**: Implement external link modal for token purchase
- **Integration Testing**: End-to-end testing of acquisition funnel

### Phase 4: Polish & Launch (PENDING)
- **Error Handling**: Implement all edge cases and fallback states
- **Analytics Integration**: Add PostHog event tracking
- **QA & Deployment**: Full regression testing and production release

## Technical Implementation

### Architecture Overview
- **Client-Server Separation**: All token logic in API routes, hooks only fetch data
- **Caching Strategy**: Hybrid approach with `unstable_cache` (24-hour TTL) and background refresh
- **Performance**: Non-blocking cache access with 2-second timeout and graceful fallback

### Cache Implementation
- **Primary Cache**: `unstable_cache` with 24-hour TTL using cache key `["token-balances-v2"]`
- **Background Refresh**: Vercel Cron Job every 6 hours via `/api/cron/refresh-token-balances`
- **Fallback Strategy**: If cache empty, return leaderboard without token data immediately
- **Request Deduplication**: In-flight request tracking prevents duplicate API calls

### Token Balance Calculation
- **Data Source**: Talent API `/credentials` endpoint with `talent_protocol_talent_holder` slug
- **Calculation Logic**: Sum all `readable_values` from `data_points` array (not just maximum)
- **Format Parsing**: Handle K (thousands) and M (millions) suffixes in `readable_value`
- **Threshold**: 1000+ tokens = boost eligibility (inclusive)

### API Response Structure
```json
{
  "entries": [...],
  "boostedCreatorsCount": 7,
  "tokenDataAvailable": true,
  "lastUpdated": "2024-01-15T10:30:00Z",
  "nextUpdate": "2024-01-15T16:30:00Z"
}
```

### Performance Optimizations
- **Non-blocking Cache**: 2-second timeout prevents blocking response
- **Progressive Enhancement**: First request shows zeros, subsequent requests show real data
- **Request Deduplication**: `inFlightTalentUserRequests` Map prevents duplicate calls
- **Background Population**: Cache refresh happens in background for next request

### Error Handling
- **Graceful Degradation**: If token API fails, show leaderboard without boost data
- **Stale Data**: Use cached data with timestamp indicators
- **Timeout Handling**: 2-second timeout with fallback to empty token data
- **API Failures**: Log errors but don't break leaderboard functionality

### Performance Metrics
- **First Load**: 2-4 seconds (with timeout)
- **Subsequent Loads**: 1-2 seconds (from cache)
- **Cache Hit Rate**: 99% after first load
- **API Calls**: Reduced from 200+ to 1 per request

### Data Flow
1. **Leaderboard Request** → Check cache for token balances
2. **Cache Hit** → Return leaderboard with token data
3. **Cache Miss** → Return leaderboard with empty data + background refresh
4. **Background Refresh** → Populate cache for next request

## Edge Cases & Error Handling

### Token Balance Edge Cases
- **Exactly 1000 tokens**: User receives boost (inclusive threshold)
- **Balance drops below 1000**: Boost removed immediately on next score refresh
- **New token acquisition**: Boost applied on next score refresh cycle
- **Wallet disconnection**: Boost status preserved until next successful balance check

### Error States
- **Token data unavailable**: Hide boost indicators, show standard leaderboard
- **API timeout**: Graceful degradation - show cached boost status with staleness indicator
- **Invalid token balance**: Treat as zero tokens, no boost applied
- **External link failure**: Show error message with manual Aerodrome URL
- **Cache miss**: Return leaderboard immediately with empty token data

### Data Consistency
- **Cross-tab consistency**: Boost status consistent between main and Boosts leaderboards
- **Reward calculation**: Boost only applies to current reward period (Sept 1st distribution)
- **Cache invalidation**: 24-hour TTL with 6-hour background refresh

## Analytics Plan

### PostHog Events
- `talent_tab_opened` - User switches to Boosts leaderboard tab
- `token_acquisition_clicked` - User clicks "Get Tokens" CTA
- `boost_earned` - User qualifies for boost (1000+ tokens in top 200)

### Key Metrics Dashboard
- Boost adoption rate by creator score tier
- Token acquisition funnel conversion rates
- Retention comparison: boosted vs non-boosted creators

## FAQ

**Q: How often is my token balance checked?**
A: Your token balance updates whenever your Creator Score refreshes. You can refresh once every hour in your profile.

**Q: What happens if my token balance drops below 1000?**
A: You'll lose the 10% boost immediately on the next score update. The boost will return once you hold 1000+ tokens again.

**Q: Where can I buy TALENT tokens?**
A: Click "Get Tokens" in the app to access Aerodrome, where you can swap for TALENT tokens.

**Q: Does the boost apply to all future rewards?**
A: The boost applies to the current reward period. For the September 1st distribution, you need to hold 1000+ tokens when final calculations are made.