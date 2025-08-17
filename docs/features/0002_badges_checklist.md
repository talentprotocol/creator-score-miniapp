## Creator Score Badges — Implementation Checklist (0002)

### Setup & scaffolding
- [x] Create `app/services/badgesService.ts` with `getBadgesForUser(talentUuid)` and `getBadgeDetail(talentUuid, badgeSlug)` (use `unstable_cache`).
- [x] Add local helpers in service: `parseNumber`, `formatNumber`, `nextThresholdProgress`, `formatValueLabel`.
- [x] Ensure architecture follows Hook → API Route → Service → External API pattern.
- [x] Wire user resolution via `lib/user-resolver.ts` and `lib/user-context.ts` patterns.
- [x] Use 5min cache duration and proper keys from `lib/cache-keys.ts`.

### Data integrations
- [x] Wire `getCreatorScoreForTalentId` for Creator Score levels using `LEVEL_RANGES` from `lib/constants.ts`.
- [x] Wire `getSocialAccountsForTalentId` and sum `followerCount` across socials.
- [x] Wire `getCachedUserTokenBalance` for `$TALENT` balance thresholds.
- [x] Wire `getCredentialsForTalentId` for Total Earnings (creator-only slugs from `lib/total-earnings-config.ts`) and Base onchain txs (`onchain_out_transactions`).
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
- [x] Update `components/badges/BadgeCard.tsx` to accept `state (earned|locked)`, `artworkUrl`, and optional `progressPct`.
- [x] Update `components/badges/BadgeModal.tsx` to show detail: `valueLabel`, `progressPct`, `artwork { earnedUrl, lockedUrl }`, and CTA if applicable.
- [x] Use `components/ui/typography.tsx` for all badge text (titles, descriptions, values).
- [x] Implement semantic colors for UI elements (custom artwork handles badge colors).

### Config & assets
- [x] Replace mocks in `lib/badge-data.ts` with config map (badge slugs, categories, thresholds, artwork paths).
- [x] Add placeholder artwork under `public/images/badges/<badge-slug>/...` (earned/locked variants) with graceful fallback.

### Design-system & analytics
- [x] Verify semantic colors, Typography, and mobile-first layout; no brand colors on icons; interactions on click.
- [ ] Add basic analytics events for badge card click and modal view (PostHog), following project analytics conventions.

### QA, docs & versioning
- [x] Manual QA: creators with different scores/followers/balances; empty states and error handling.
- [X] Update `docs/features/0002_badges_plan.md` with any deltas discovered during implementation.

### Deferred (post-MVP)
- [ ] Share images endpoint and templates.
- [ ] Persist earned dates and history (DB tables).


