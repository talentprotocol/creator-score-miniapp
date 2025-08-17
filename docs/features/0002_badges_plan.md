****## Creator Score Badges — Technical Plan (0002)

### Context
- Build a Badges experience for the Creator Score app. MVP is compute-on-read (no DB tables), using config-driven logic and server-side caching. Only private detail route now: `app/badges/[badgeSlug]/page.tsx`.
- Badge categories and levels per the brief in `docs/temp/creator_badges_brief.md`:
  - Creator Score Level (6 levels based on `LEVEL_RANGES` in `lib/constants.ts`)
  - Metrics: Total Earnings (10, 100, 1k, 10k, 25k, 100k); Total Followers (100, 1k, 10k, 25k, 100k, 250k)
  - Platforms: Talent ($TALENT 100, 1k, 10k via token balance); Base (onchain_out_transactions 10, 100, 1k)
- Rules: “Total Followers” sums across all connected socials; Earned date is shown simply as “Earned” (no timestamp) until persistence exists; Share images out-of-scope for this phase.

### File mapping
- New
  - `app/api/badges/route.ts`: Returns computed badges for the current user (grouped sections + badge states, with progress info).
  - `app/api/badges/[badgeSlug]/route.ts`: Returns computed details for a single badge (to power the detail page).
  - `app/badges/[badgeSlug]/page.tsx`: Private badge details page (SSR/RSC), uses the API above.
  - `app/services/badgesService.ts`: Pure service that computes badges from existing profile data and credentials. No client-side external API calls.
- Updates
  - `lib/badge-data.ts`: Replace mock with a config map (badge slugs, categories, thresholds, artwork paths). Keep types; export constants for categories/levels and helpers.
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
  - Request: infer current user via existing user context/resolver (Talent UUID).
  - Response: `{ sections: Array<{ id, title, badges: Array<{ slug, title, description, state: "earned" | "locked", valueLabel, progressPct, artwork: { earnedUrl, lockedUrl } }> }>, summary?: { earnedCount, completionPct } }`.
- GET `/api/badges/[badgeSlug]`
  - Request: `{ badgeSlug }` + current user (Talent UUID).
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
  - getBadgesForUser(talentUuid: string): returns sections and badge states per above. Uses `unstable_cache` keyed by `{talentUuid}` and tags: `USER_BADGES-{talentUuid}`; revalidate ~15m.
  - getBadgeDetail(talentUuid: string, badgeSlug: string): computes a single badge detail.
- API routes
  - `/api/badges`: resolves current user’s `talentUuid`, calls `getBadgesForUser`, returns JSON.
  - `/api/badges/[badgeSlug]`: resolves `talentUuid`, calls `getBadgeDetail`.
- Client
  - `useBadges`: fetch `/api/badges`; return sections, derived completion summary.
  - Detail page: RSC/server fetch to `/api/badges/[badgeSlug]` and render.

### UI/Design-system notes
- Use existing `components/ui/*` and `components/badges/*`. No brand colors on icons; use semantic tokens. Mobile-first; interactions on click (not hover).
- Badge grid: 3 columns on mobile per brief; use Tailwind utilities matching existing patterns (semantic classes, Typography component where applicable).
- Earned vs Locked:
  - Earned: full-color artwork and valueLabel "Earned".
  - Locked: grayscale artwork, thin progress bar, valueLabel "X more needed" derived from thresholds.
- Artwork paths: `public/images/badges/<badge-slug>/<level_slug>-earned.png` and `...-locked.png`. Fallback to placeholder when missing.

### Minimal data contract for components
- BadgeCard input: `{ slug, title, state, artworkUrl, onClick }`
- BadgeModal input: `{ slug, title, state, valueLabel, progressPct, artwork: { earnedUrl, lockedUrl } }`

### Phase scope (MVP)
- Compute-on-read only (no DB). No public profile routes yet. No share images.
- Ship: API routes, service, config, detail page, hook + listing page wired to real data.


