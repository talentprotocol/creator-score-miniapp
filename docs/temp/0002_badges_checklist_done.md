## Creator Score Badges — Implementation Checklist (0002)

### Setup & scaffolding  
- [x] Create `app/services/badgesService.ts` with dynamic badge system using single `BadgeState` per category
- [x] Implement conditional sections with `BADGE_SECTION_THRESHOLD = 18` for automatic layout switching  
- [x] Add `createDynamicBadge()` helper for unified badge computation across all categories
- [x] Ensure architecture follows Hook → API Route → Service → External API pattern
- [x] Wire user resolution via `lib/user-resolver.ts` and `lib/user-context.ts` patterns
- [x] Use 5min cache duration and proper keys from `lib/cache-keys.ts`

### Data integrations
- [x] Wire `getCreatorScoreForTalentId` for Creator Score levels using `LEVEL_RANGES` from `lib/constants.ts`.
- [x] Wire `getSocialAccountsForTalentId` and sum `followerCount` across socials.
- [x] Wire `getCachedUserTokenBalance` for `$TALENT` balance thresholds.
- [x] Wire `getCredentialsForTalentId` for Total Earnings and Base onchain txs.
- [x] Implement Pay It Forward badge using `OptoutService.isOptedOut()`.
- [x] Implement Total Collectors badge using 5 collector credential sources.
- [x] Abstract collector credentials in `total-earnings-config.ts` for centralized management.
- [x] Respect project rule: ignore `points_calculation_logic` everywhere; use top-level credential fields only.

### API routes
- [x] Implement `app/api/badges/route.ts` → returns sections with badge states, progress, and optional summary.
- [x] Implement `app/api/badges/[badgeSlug]/route.ts` → returns single badge detail.

### Client hook & pages
- [x] Update `hooks/useBadges.ts` to fetch from `/api/badges` and expose `{data, loading, error}` pattern.
- [x] Ensure `app/badges/page.tsx` renders sections from real data (keeps current UX and empty/error states).
- [ ] Add `app/badges/[badgeSlug]/page.tsx` (private) to render badge detail using server data.
- [x] Add skeleton loaders and error boundaries per coding principles.****

### UI components
- [x] Update `components/badges/BadgeCard.tsx` for dynamic badge display with `currentLevel` and `progressPct`
- [x] Update `components/badges/BadgeModal.tsx` with simplified dynamic badge details and current level indicators
- [x] Implement 3-column grid layout (`grid-cols-3`) on all screens with responsive gap spacing
- [x] Add conditional section rendering: flat grid below 18 badges, sections above threshold
- [x] Replace badge counts with completion percentages in all UI text
- [x] Use `components/ui/typography.tsx` for all badge text (titles, descriptions, values)
- [x] Implement semantic colors for UI elements (custom artwork handles badge colors)

### Config & assets
- [x] Restructure sections: Trophies, Records, Special, Accounts (hidden), Content (hidden).
- [x] Add Pay It Forward and Total Collectors badge content in `lib/badge-content.ts`.
- [x] Create placeholder artwork for new badges (Pay It Forward, Total Collectors).
- [x] Remove old WalletConnect/Reown implementation and artwork.
- [x] Improve badge descriptions for better user understanding.

### Design-system & analytics
- [x] Verify semantic colors, Typography, and mobile-first layout; no brand colors on icons; interactions on click.
- [ ] Add basic analytics events for badge card click and modal view (PostHog), following project analytics conventions.

### QA, docs & versioning
- [x] Manual QA: creators with different scores/followers/balances; empty states and error handling.
- [X] Update `docs/features/0002_badges_plan.md` with any deltas discovered during implementation.

### Deferred (post-MVP)
- [ ] Share images endpoint and templates.
- [ ] Persist earned dates and history (DB tables).


