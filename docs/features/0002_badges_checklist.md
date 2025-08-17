## Creator Score Badges — Implementation Checklist (0002)

### Setup & scaffolding
- [ ] Create `app/services/badgesService.ts` with `getBadgesForUser(talentUuid)` and `getBadgeDetail(talentUuid, badgeSlug)` (use `unstable_cache`).
- [ ] Add local helpers in service: `parseNumber`, `formatNumber`, `nextThresholdProgress`, `formatValueLabel`.
- [ ] Ensure architecture follows Hook → API Route → Service → External API pattern.

### Data integrations
- [ ] Wire `getCreatorScoreForTalentId` for Creator Score levels using `LEVEL_RANGES` from `lib/constants.ts`.
- [ ] Wire `getSocialAccountsForTalentId` and sum `followerCount` across socials.
- [ ] Wire `getCachedUserTokenBalance` for `$TALENT` balance thresholds.
- [ ] Wire `getCredentialsForTalentId` for Total Earnings (creator-only slugs from `lib/total-earnings-config.ts`) and Base onchain txs (`onchain_out_transactions`).
- [ ] Respect project rule: ignore `points_calculation_logic` everywhere; use top-level credential fields only.

### API routes
- [ ] Implement `app/api/badges/route.ts` → returns sections with badge states, progress, and optional summary.
- [ ] Implement `app/api/badges/[badgeSlug]/route.ts` → returns single badge detail.

### Client hook & pages
- [ ] Update `hooks/useBadges.ts` to fetch from `/api/badges` and expose loading/error/data.
- [ ] Ensure `app/badges/page.tsx` renders sections from real data (keeps current UX and empty/error states).
- [ ] Add `app/badges/[badgeSlug]/page.tsx` (private) to render badge detail using server data.

### UI components
- [ ] Update `components/badges/BadgeCard.tsx` to accept `state (earned|locked)`, `artworkUrl`, and optional `progressPct`.
- [ ] Update `components/badges/BadgeModal.tsx` to show detail: `valueLabel`, `progressPct`, `artwork { earnedUrl, lockedUrl }`, and CTA if applicable.

### Config & assets
- [ ] Replace mocks in `lib/badge-data.ts` with config map (badge slugs, categories, thresholds, artwork paths).
- [ ] Add placeholder artwork under `public/images/badges/<badge-slug>/...` (earned/locked variants) with graceful fallback.

### Design-system & analytics
- [ ] Verify semantic colors, Typography, and mobile-first layout; no brand colors on icons; interactions on click.
- [ ] Add basic analytics events for badge card click and modal view (PostHog), following project analytics conventions.

### QA, docs & versioning
- [ ] Manual QA: creators with different scores/followers/balances; empty states and error handling.
- [ ] Update `docs/features/0002_badges_plan.md` with any deltas discovered during implementation.
- [ ] Commit changes in logical batches and bump version if applicable; update changelog when version changes.

### Deferred (post-MVP)
- [ ] Share images endpoint and templates.
- [ ] Persist earned dates and history (DB tables).


