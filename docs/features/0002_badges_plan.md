****## Creator Score Badges — Technical Plan (0002)

### Context
- Build a Badges experience for the Creator Score app. MVP is compute-on-read (no DB tables), using config-driven logic and server-side caching. Only private routes for MVP: `app/badges/page.tsx` and `app/badges/[badgeSlug]/page.tsx`. Public profile routes deferred to post-MVP.
- Badge categories and levels per the brief in `docs/temp/creator_badges_brief.md`:
  - Creator Score Level (6 levels based on `LEVEL_RANGES` in `lib/constants.ts`)
  - Records: Total Earnings (10, 100, 1k, 10k, 25k, 100k); Total Followers (100, 1k, 10k, 25k, 100k, 250k)
  - Communities: Talent ($TALENT 100, 1k, 10k via token balance); Base (onchain_out_transactions 10, 100, 1k)
- Rules: "Total Followers" sums across all connected socials; Earned date is shown simply as "Earned" (no timestamp) until persistence exists; Share images out-of-scope for this phase.
- UI: Custom artwork for badges (not brand colors); use semantic colors for UI elements; Typography component for all text.

### File mapping
- New
  - `app/api/badges/route.ts`: Returns computed badges for the current user (grouped sections + badge states, with progress info).
  - `app/api/badges/[badgeSlug]/route.ts`: Returns computed details for a single badge (to power the detail page).
  - `app/badges/[badgeSlug]/page.tsx`: Private badge details page (SSR/RSC), uses the API above.
  - `app/services/badgesService.ts`: Pure service that computes badges from existing profile data and credentials. No client-side external API calls.
  - `lib/badge-content.ts`: Centralized badge content configuration (titles, descriptions, thresholds, labels) separated from business logic.
- Updates
  - `hooks/useBadges.ts`: Fetch from `/api/badges` instead of returning mock data.
  - `components/badges/BadgeCard.tsx` and `components/badges/BadgeModal.tsx`: Ensure props cover Earned/Locked states, artwork URLs, “X more needed” copy, and optional thin progress bar.
  - `app/badges/page.tsx`: Continue to render sections/grid, but now backed by real data from the hook.

### Data sources to reuse
- Creator score: `app/services/scoresService.ts#getCreatorScoreForTalentId` + `lib/constants.ts#LEVEL_RANGES`.
- Followers: `app/services/socialAccountsService.ts#getSocialAccountsForTalentId` (sum `followerCount` across all returned socials).
- $TALENT balance: `app/services/tokenBalanceService.ts#getCachedUserTokenBalance` (sums `talent_protocol_talent_holder` + `talent_vault`).
- Base transactions and other metrics: `app/services/credentialsService.ts#getCredentialsForTalentId` and use credential-level fields (`slug`, `readable_value`, `uom`, `max_score`).
- IMPORTANT: Ignore `points_calculation_logic` in all logic and display (project rule).

### API shapes
- GET `/api/badges`
  - Request: resolve current user via `lib/user-resolver.ts` patterns (Talent UUID).
  - Response: `{ sections: Array<{ id, title, badges: Array<{ slug, title, description, state: "earned" | "locked", valueLabel, progressPct, artwork: { earnedUrl, lockedUrl } }> }>, summary?: { earnedCount, completionPct } }`.
- GET `/api/badges/[badgeSlug]`
  - Request: `{ badgeSlug }` + resolve current user via `lib/user-resolver.ts`.
  - Response: `{ slug, title, state, valueLabel, progressPct, earnedLevels?: number, peersStat?: { text: string } }`.

### Computation rules (pseudocode)
- Shared helpers
  - parseNumber(readableValue: string | number | null): number
  - clampToPct(x: number): number = Math.max(0, Math.min(100, x))
  - nextThresholdProgress(current: number, thresholds: number[]): { pct: number, missing: number, next?: number }
  - formatValueLabel for display: if Earned → "Earned"; if Locked → "X more needed" with `uom` when relevant (e.g., `$TALENT`, `followers`, `transactions`, `points`).

- Creator Score Level (slug: `creator-score` with sub-levels 1..6)
  - score = await getCreatorScoreForTalentId(talentUuid).score
  - Determine earned level by scanning `LEVEL_RANGES` from `lib/constants.ts` and finding the bracket containing `score`.
  - For each level i in [1..6]:
    - earned if `score >= LEVEL_RANGES[i-1].min`
    - if locked: missing = `LEVEL_RANGES[i-1].min - score` (floored to ≥ 0)
    - progressPct = if locked: `(score / LEVEL_RANGES[i-1].min) * 100`, else 100
    - valueLabel: earned → "Earned"; locked → `${score} of ${LEVEL_RANGES[i-1].min}`

- Total Earnings (slug: `total-earnings-*` thresholds [10,100,1k,10k,25k,100k])
  - creds = await getCredentialsForTalentId(talentUuid)
  - sumUSD = sum over all credential items where `slug` ∈ `getCreatorEarningsCredentials()` from `lib/total-earnings-config.ts`, using `parseNumber(readable_value)`
  - For each threshold T: earned if `sumUSD >= T`; if locked: missing = `T - sumUSD`; progressPct = `(sumUSD / T) * 100`
  - valueLabel: earned → "Earned"; locked → `$${format(sumUSD)} of $${format(T)}`

- Total Followers (slug: `total-followers-*` thresholds [100,1k,10k,25k,100k,250k])
  - socials = await getSocialAccountsForTalentId(talentUuid)
  - followers = sum of `followerCount` where not null
  - For each threshold T: earned if `followers >= T`; if locked: missing = `T - followers`; progressPct = `(followers / T) * 100`
  - valueLabel: earned → "Earned"; locked → `${format(followers)} of ${format(T)}`

- Platform: Talent (slug: `platform-talent-*` thresholds [$TALENT 100, 1k, 10k])
  - balance = await getCachedUserTokenBalance(talentUuid)(process.env.TALENT_API_KEY)
  - For each T: earned if `balance >= T`; else missing = `T - balance`; progressPct = `(balance / T) * 100`
  - valueLabel: earned → "Earned"; locked → `${format(balance)} of ${format(T)} $TALENT`

- Platform: Base (slug: `platform-base-l*` thresholds [10,100,1k])
  - creds = await getCredentialsForTalentId(talentUuid)
  - tx = parseNumber(`readable_value`) of credential where `slug === "onchain_out_transactions"`
  - For each T: earned if `tx >= T`; else missing = `T - tx`; progressPct = `(tx / T) * 100`
  - valueLabel: earned → "Earned"; locked → `${format(tx)} of ${format(T)} transactions`

### Service design (Hook → API Route → Service)
- badgesService.ts
  - getBadgesForUser(talentUuid: string): returns sections and badge states per above. Uses `unstable_cache` with proper cache keys from `lib/cache-keys.ts` and tags: `USER_BADGES-{talentUuid}`; revalidate 5min.
  - getBadgeDetail(talentUuid: string, badgeSlug: string): computes a single badge detail.
- API routes
  - `/api/badges`: uses `lib/user-resolver.ts` to resolve current user's `talentUuid`, calls `getBadgesForUser`, returns JSON with proper error handling.
  - `/api/badges/[badgeSlug]`: uses `lib/user-resolver.ts` to resolve `talentUuid`, calls `getBadgeDetail`.
- Client
  - `useBadges`: fetch `/api/badges`; return `{data, loading, error}` pattern with sections and derived completion summary.
  - Detail page: RSC/server fetch to `/api/badges/[badgeSlug]` and render with error boundaries.

### Content-Logic Separation Architecture
- **Content Configuration**: `lib/badge-content.ts` contains all badge titles, descriptions, thresholds, and labels
- **Business Logic**: `badgesService.ts` focuses purely on computation and data transformation

### Badge Structure & Hierarchy
- **Sections** (Top level): Trophies, Records, Special, Accounts (hidden), Content (hidden)
- **Badges** (Second level): Creator Score, Daily/Weekly Streaks, Pay It Forward, Total Earnings/Followers/Collectors, Talent Protocol, Base
- **Levels** (Third level): Threshold-based naming (e.g., "100", "500", "1K" for Creator Score; "1 Day", "2 Days" for Streaks)

### Canonical Badge Terminology
- **Badge Slug** (`badgeSlug`): Badge family identifier (e.g., "creator-score", "total-earnings")
- **Badge Title** (`badgeTitle`): Human-readable family name (e.g., "Creator Score", "Talent Protocol")
- **Badge Level** (`badgeLevel`): Achievement tier number (1, 2, 3, etc.) - always 1-based
- **Level Label** (`levelLabel`): Human-readable level description (e.g., "100 $TALENT", "1K Followers")
- **Level Threshold** (`levelThreshold`): Minimum value required for a specific level
- **Progress Label** (`progressLabel`): Dynamic progress display (e.g., "$50 left", "Earned")
- **Level Artwork** (`levelArtwork`): Level-specific images (earned/locked states)

### UI/Design-system notes
- Use existing `components/ui/*` and `components/badges/*`. Follow semantic-first color approach; use `components/ui/typography.tsx` for all text. Mobile-first; interactions on click (not hover).
- Badge grid: 3 columns on mobile per brief; use Tailwind utilities matching existing patterns.
- Earned vs Locked:
  - Earned: full-color custom artwork and valueLabel "Earned".
  - Locked: grayscale custom artwork, thin progress bar, valueLabel "X more needed" derived from thresholds.
- Artwork paths: `public/images/badges/<badge-slug>/<level_slug>-earned.png` and `...-locked.png`. Fallback to placeholder when missing.
- Error handling: Include skeleton loaders, error boundaries, graceful fallbacks - no crashes.

### Minimal data contract for components
- BadgeCard input: `{ slug, title, state, artworkUrl, onClick }` (follows existing patterns)
- BadgeModal input: `{ slug, title, state, valueLabel, progressPct, artwork: { earnedUrl, lockedUrl } }`
- All text via Typography component; follow `{data, loading, error}` pattern in hooks

### Phase scope (MVP)
- Compute-on-read only (no DB). No public profile routes yet. No share images.
- Ship: API routes, service, config, detail page, hook + listing page wired to real data.

## Implementation Deltas & Discoveries

### 🔧 Technical Adjustments Made
- **Section restructuring**: Renamed sections to user-centric categories:
  - `trophies`: Creator Score, Daily/Weekly Streaks, Pay It Forward
  - `records`: Total Earnings, Total Followers, Total Collectors
  - `special`: Talent Protocol, Base Network (sponsored badges)
- **New badges added**: Pay It Forward (opt-out based), Total Collectors (aggregated from 5 credential sources)
- **WalletConnect cleanup**: Removed all old commented implementation code
- **Credential abstraction**: Moved collector credentials to `total-earnings-config.ts` for centralized management
- **Content centralization**: All badge content now centralized in `lib/badge-content.ts` with improved descriptions

### 🎨 UI/UX Improvements  
- **Dynamic badge system**: Single badge per category with 6 dynamic states (replaced 36+ individual badges)
- **Conditional sections**: 18-badge threshold for section activation (flat grid below threshold)
- **3-column grid**: Consistent 3-column layout on all screens with responsive gap spacing
- **Percentage-only UI**: Removed badge counts, show only completion percentages in headers
- **Progress visualization**: Added thin progress bars for locked badges showing completion percentage
- **Error handling**: Implemented comprehensive error states with skeleton loaders and error boundaries
- **Typography consistency**: All text now uses the `Typography` component as planned

### 📱 Mobile-First Enhancements
- **Touch interactions**: Badge cards use `active:scale-95` for tactile feedback on mobile
- **Modal responsiveness**: BadgeModal automatically switches between Dialog (desktop) and Drawer (mobile) based on screen size
- **Loading states**: Skeleton loaders provide immediate visual feedback during data fetching

### 🚀 Performance Optimizations
- **Server-side caching**: 5-minute cache duration with proper cache keys (`USER_BADGES`) for optimal performance
- **Image optimization**: Graceful fallback to icons prevents broken image requests and improves perceived performance
- **Efficient data fetching**: Single API call loads all badge data, reducing network overhead

### 🏗️ Architecture Improvements
- **Dynamic badge approach**: Single `BadgeState` per category with computed levels and artwork URLs
- **Conditional sections**: `BADGE_SECTION_THRESHOLD = 18` controls section vs. flat layout
- **Dual response format**: `BadgesResponse` supports both `sections?` and `badges?` properties
- **Single source of truth**: All badge content, titles, and descriptions centralized in `badge-content.ts`
- **Scalable structure**: Adding new badge sections automatically updates all consumers

## Follow-Up Plan (Post-MVP)

### 🎯 Phase 2: New Badge Implementations & Artwork
- **WalletConnect badge**: Implement new version using Neynar API data (old implementation removed)
- **Custom artwork**: Design artwork for Pay It Forward and Total Collectors badges (currently using placeholders)
- **Artwork validation**: Add automated checks to ensure all badge artwork files exist

### 🌐 Phase 3: Public Routes & Sharing
- **Public badge pages**: Implement `app/badges/[badgeSlug]/page.tsx` for public badge viewing.
- **Share functionality**: Add share buttons and social media integration for earned badges.
- **Badge URLs**: Create SEO-friendly public URLs for individual badges and badge collections.

### 💾 Phase 4: Persistence & History
- **Database tables**: Create tables for storing badge earning history, dates, and user progress.
- **Badge analytics**: Track badge unlock patterns and user engagement metrics.
- **Achievement system**: Add notifications and celebrations for newly earned badges.

### 🔍 Phase 5: Advanced Features
- **Badge collections**: Group badges into themed collections with special rewards.
- **Seasonal badges**: Implement time-limited badges and special events.
- **Badge marketplace**: Allow users to showcase and trade rare badges (if applicable).

### 📊 Phase 6: Analytics & Insights
- **PostHog integration**: Add comprehensive analytics for badge interactions and user behavior.
- **Performance metrics**: Track badge loading times and user engagement patterns.
- **A/B testing**: Experiment with different badge designs and unlock mechanisms.

### 🧪 Testing & Quality Assurance
- **Unit tests**: Add comprehensive test coverage for badge computation logic.
- **Integration tests**: Test badge API endpoints with various user scenarios.
- **Performance testing**: Validate caching effectiveness and API response times.
- **Accessibility audit**: Ensure badge system meets WCAG guidelines.

### 📚 Documentation & Maintenance
- **API documentation**: Create comprehensive API reference for badge endpoints.
- **Component library**: Document badge components in Storybook or similar tool.
- **Maintenance guide**: Document badge artwork requirements and update procedures.


