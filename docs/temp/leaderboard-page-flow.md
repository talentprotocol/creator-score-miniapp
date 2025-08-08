# Leaderboard Page Execution Flow

## TL;DR

- **User Navigation**: User navigates to `/leaderboard` route
- **Page Initialization**: `LeaderboardPage` component renders with `PageContainer` and `Suspense`
- **Data Fetching**: Multiple hooks fetch leaderboard data, user scores, and profile information
- **API Calls**: `/api/leaderboard/basic` fetches top 200 creators from Talent Protocol API
- **User Resolution**: User identity resolved via Farcaster FID or Talent Protocol UUID
- **State Management**: Local state manages visible entries, active tabs, and loading states
- **Rendering**: Components render leaderboard entries, user rewards, and tab navigation
- **Interactions**: Users can view different tabs (creators, boosts, sponsors) and load more entries

## Detailed Execution Flow

### 1. Route Resolution and Page Initialization

**File**: `app/leaderboard/page.tsx` (lines 1-514)

When a user navigates to `/leaderboard`, Next.js resolves the route and renders the `LeaderboardPage` component:

```typescript
export default function LeaderboardPage() {
  return (
    <PageContainer noPadding>
      <Section variant="header">
        <Suspense fallback={<Skeleton className="h-16 w-full" />}>
          <LeaderboardContent />
        </Suspense>
      </Section>
    </PageContainer>
  );
}
```

**Components Involved**:
- `PageContainer`: Provides layout wrapper with max-width and padding
- `Section`: Wraps content with header styling
- `Suspense`: Shows skeleton loading while content loads
- `LeaderboardContent`: Main component containing all logic

### 2. User Context and Authentication

**File**: `app/leaderboard/page.tsx` (lines 35-40)

The component immediately attempts to resolve user identity through multiple paths:

```typescript
const { context } = useMiniKit();
const user = getUserContext(context);
const { talentUuid: userTalentUuid } = useUserResolution();
```

**Hooks Involved**:
- `useMiniKit()`: Gets Farcaster Mini App context
- `getUserContext()`: Extracts user data from context
- `useUserResolution()`: Resolves FID to Talent Protocol UUID

**User Resolution Flow** (`hooks/useUserResolution.ts`):
1. Checks if `talentId` exists from Privy auth
2. Falls back to FID-based resolution via `resolveFidToTalentUuid()`
3. Caches results in session-level cache
4. Returns `talentUuid` for API calls

### 3. Data Fetching Phase

**File**: `app/leaderboard/page.tsx` (lines 45-65)

Multiple hooks fetch data concurrently:

```typescript
// Leaderboard data
const {
  entries: top200Entries,
  loading: top200Loading,
  rewardsLoading,
  error: top200Error,
  boostedCreatorsCount,
} = useLeaderboardOptimized(page, perPage);

// User scores (both auth paths)
const { creatorScore: fidScore, loading: fidScoreLoading } = useUserCreatorScore(user?.fid);
const { creatorScore: uuidScore, loading: uuidScoreLoading } = useProfileCreatorScore(userTalentUuid || "");

// Profile data
const { profile, loading: profileLoading } = useProfileHeaderData(userTalentUuid || "");

// Token balance
const { balance: tokenBalance, loading: tokenLoading } = useUserTokenBalance(userTalentUuid);
```

#### 3.1 Leaderboard Data Fetching

**File**: `hooks/useLeaderboardOptimized.ts` (lines 1-87)

The `useLeaderboardOptimized` hook manages leaderboard data:

1. **Initial State**: Sets loading to `true`, entries to empty array
2. **API Call**: Fetches from `/api/leaderboard/basic?page=${page}&per_page=${perPage}`
3. **Data Processing**: Receives entries with ranks, scores, and boosted status
4. **State Update**: Updates entries, loading, and error states

**API Endpoint**: `app/api/leaderboard/basic/route.ts` (lines 125-362)

The API route handles two scenarios:

**Cached Request (page=1, perPage=200)**:
1. Uses `unstable_cache` for 10-minute caching
2. Fetches top 200+ profiles from Talent Protocol API
3. Filters out project accounts
4. Integrates boosted profiles data
5. Maps profiles to leaderboard entries
6. Sorts by score and assigns ranks
7. Returns cached response

**Paginated Request**:
1. Fetches specific page of profiles
2. Applies same filtering and mapping logic
3. Returns paginated results

**External API Integration**:
- **Talent Protocol API**: `https://api.talentprotocol.com/search/advanced/profiles`
- **Query Parameters**: Score-based search with creator_score scorer
- **Pagination**: Handles large datasets with batching
- **Filtering**: Excludes project accounts defined in constants

#### 3.2 User Score Fetching

**File**: `hooks/useUserCreatorScore.ts` (lines 1-103)

Fetches user's creator score via FID:

1. **Cache Check**: Checks local cache first
2. **API Call**: Calls `/api/talent-score?fid=${fid}&account_source=farcaster&scorer_slug=creator_score`
3. **Error Handling**: Handles 404 (no account) gracefully
4. **State Update**: Updates score, loading, and error states

**File**: `hooks/useProfileCreatorScore.ts` (lines 1-125)

Fetches user's creator score via Talent UUID:

1. **Global Cache**: Uses in-memory cache with 5-minute TTL
2. **Deduplication**: Prevents concurrent fetches for same UUID
3. **Service Call**: Calls `getCreatorScoreForTalentId()` service
4. **State Management**: Handles calculating states and errors

### 4. State Management and Data Processing

**File**: `app/leaderboard/page.tsx` (lines 70-120)

The component processes and combines data from multiple sources:

```typescript
// Combine data from both auth paths
const creatorScore = fidScore ?? uuidScore ?? 0;
const avatarUrl = user?.pfpUrl ?? profile?.image_url;
const name = user?.displayName ?? user?.username ?? profile?.display_name ?? profile?.fname ?? "Unknown user";

// Update visible entries when data changes
useEffect(() => {
  if (top200Entries.length > 0) {
    const shouldShowAll = perPageParam !== null;
    setVisibleEntries(shouldShowAll ? top200Entries : top200Entries.slice(0, 10));
  }
}, [top200Entries, perPageParam]);
```

**Key State Variables**:
- `visibleEntries`: Currently displayed leaderboard entries
- `activeTab`: Current tab (creators, talent, sponsors)
- `countdown`: Time remaining until round ends
- `howToEarnOpen`: Modal state

### 5. Component Rendering

**File**: `app/leaderboard/page.tsx` (lines 200-514)

The component renders several sections:

#### 5.1 My Rewards Section

**File**: `components/leaderboard/MyRewards.tsx` (lines 1-96)

Renders user's rewards and score information:

```typescript
<MyRewards
  rewards={creatorScore ? getUsdcRewards(creatorScore, userTop200Entry?.rank, userTop200Entry?.isBoosted) : "$0"}
  score={creatorScore}
  avatarUrl={avatarUrl}
  name={name}
  isLoading={loadingStats || (top200Loading && !userTop200Entry)}
  rank={userTop200Entry?.rank}
  pointsToTop200={pointsToTop200}
  onHowToEarnClick={() => setHowToEarnOpen(true)}
  tokenBalance={tokenBalance}
  tokenLoading={tokenLoading}
/>
```

**Features**:
- Displays user's creator score or rewards
- Shows avatar and name
- Indicates rank and points needed for top 200
- Shows token balance
- Provides "How to Earn" button

#### 5.2 Stat Cards

Renders key statistics:

```typescript
<div className="grid grid-cols-2 gap-4 mt-6">
  <StatCard title="Rewards Pool" value={`$${formatWithK(TOTAL_SPONSORS_POOL)}`} />
  <StatCard title="Rewards Distribution" value={`${countdown.days}d ${countdown.hours}h`} />
</div>
```

#### 5.3 Tab Navigation

**File**: `components/common/tabs-navigation.tsx`

Renders tab navigation with counts:

```typescript
<TabNavigation
  tabs={[
    { id: "creators", label: "Leaderboard", count: perPage },
    { id: "talent", label: "Boosts", count: boostedCreatorsCount || 0 },
    { id: "sponsors", label: "Sponsors", count: ACTIVE_SPONSORS.length },
  ]}
  activeTab={activeTab}
  onTabChange={handleTabChange}
/>
```

#### 5.4 Content Sections

**Creators Tab**:
- Renders `CreatorList` component with leaderboard entries
- Shows loading skeletons during data fetch
- Implements "Load More" functionality
- Displays rewards and creator scores

**Talent Tab**:
- Filters for boosted creators only
- Shows boost amounts and creator scores
- Handles empty state

**Sponsors Tab**:
- Lists active sponsors from constants
- Shows sponsor avatars, names, and amounts
- Provides external links

### 6. Data Flow Diagram

```mermaid
graph TD
    A[User navigates to /leaderboard] --> B[LeaderboardPage renders]
    B --> C[useMiniKit gets context]
    C --> D[useUserResolution resolves user]
    D --> E[useLeaderboardOptimized fetches data]
    E --> F[/api/leaderboard/basic]
    F --> G[Talent Protocol API]
    G --> H[Process and cache data]
    H --> I[Update component state]
    I --> J[Render MyRewards]
    I --> K[Render StatCards]
    I --> L[Render TabNavigation]
    I --> M[Render CreatorList]
    M --> N[User interactions]
    N --> O[Tab changes]
    N --> P[Load more entries]
    N --> Q[Navigate to profiles]
```

### 7. Key Data Structures

#### LeaderboardEntry Interface

**File**: `app/services/types.ts` (lines 102-112)

```typescript
export type LeaderboardEntry = {
  rank: number;
  name: string;
  pfp?: string;
  score: number;
  id: string;
  talent_protocol_id: string | number;
  isBoosted?: boolean;
  baseReward?: number;
  boostedReward?: number;
};
```

#### CreatorItem Interface

**File**: `components/common/CreatorList.tsx` (lines 8-16)

```typescript
export interface CreatorItem {
  id: string;
  name: string;
  avatarUrl?: string;
  rank?: number;
  primaryMetric?: string;
  primaryMetricLoading?: boolean;
  secondaryMetric?: string;
  badge?: React.ReactNode;
}
```

### 8. Performance Optimizations

1. **Caching Strategy**:
   - 10-minute cache for leaderboard data
   - 5-minute cache for user scores
   - Session-level cache for user resolution

2. **Lazy Loading**:
   - Initial load shows first 10 entries
   - "Load More" button for additional entries
   - Skeleton loading states

3. **Deduplication**:
   - Prevents concurrent API calls for same data
   - Global in-memory cache for scores

4. **Error Handling**:
   - Graceful fallbacks for missing data
   - User-friendly error messages
   - Retry mechanisms

### 9. External Dependencies

- **Talent Protocol API**: Primary data source for profiles and scores
- **Farcaster SDK**: User authentication and context
- **Coinbase OnchainKit**: Mini app framework
- **PostHog**: Analytics tracking
- **Lucide React**: Icons

### 10. Configuration Constants

**File**: `lib/constants.ts` (lines 131-187)

- `ACTIVE_SPONSORS`: List of active sponsors
- `TOTAL_SPONSORS_POOL`: Total rewards pool amount
- `ROUND_ENDS_AT`: Round end date
- `PROJECT_ACCOUNTS_TO_EXCLUDE`: Accounts to exclude from leaderboard

This documentation provides a comprehensive understanding of the leaderboard page execution flow, enabling new developers to understand the architecture and data flow without examining the source code. 