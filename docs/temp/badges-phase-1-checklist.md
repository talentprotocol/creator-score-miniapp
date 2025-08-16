## Badges – Phase 1 (Database & Core Logic) Checklist

- [ ] DB: Create tables
  - [ ] `badges`
  - [ ] `badge_levels`
  - [ ] `badge_credentials`
  - [ ] `user_badges`
  - [ ] `user_badge_levels`
- [ ] DB: Indexes & constraints
  - [ ] `user_badges` unique `(user_id, badge_slug)`
  - [ ] `user_badge_levels` unique `(user_id, badge_slug, level)`
  - [ ] `badge_levels` index `(badge_slug, level)`
  - [ ] `badge_credentials` unique `(credential_slug)` and index `(badge_slug)`
- [ ] DB: RLS/policies
  - [ ] Public read for `badges`, `badge_levels`, `badge_credentials`
  - [ ] Server-only writes for all tables
- [ ] Seed: Badge definitions & levels (with placeholder artwork URLs)
  - [ ] Trophies: `creator-score` levels 1–6
  - [ ] Metrics: `total-earnings` levels [$10, $100, $1K, $10K, $25K, $100K]
  - [ ] Metrics: `total-followers` levels [100, 1K, 10K, 25K, 100K, 250K]
  - [ ] Platforms: `platform-talent` levels [100, 1K, 10K $TALENT]
  - [ ] Platforms: `platform-base` levels [L1 presence, L2 ≥100 out tx, L3 >1000 out tx]
  - [ ] Mappings: `badge_credentials` for `total-earnings` (from `lib/total-earnings-config.ts`) and platform credentials
- [ ] Service: Server-cached price service
  - [ ] `getEthUsdPrice()` 24h cache
  - [ ] `getPolUsdPrice()` 24h cache
- [ ] Service: `getAllBadges()` with caching (10–30 min)
- [ ] Service: `computeUserBadges(talentUuid)`
  - [ ] Fetch credentials/socials/score via our API routes
  - [ ] Ignore `points_calculation_logic`; use top-level `readable_value` + `uom`
  - [ ] Trophies: derive level from `LEVEL_RANGES`
  - [ ] Metrics: total earnings (ETH→USD, POL→USD) and total followers (farcaster, lens, twitter, efp, github)
  - [ ] Platforms: talent `$TALENT` thresholds; base presence + tx thresholds
  - [ ] Compute per-level earned/progress + summary aggregates (points/max_points)
- [ ] Service: `upsertUserBadges(talentUuid, results)` transactional
- [ ] Service: `getUserBadges(talentUuid)`
  - [ ] 60m freshness window
  - [ ] Background recompute when stale
- [ ] API: `GET /api/badges`
- [ ] API: `GET /api/user/badges?uuid=...`
- [ ] API: `POST /api/user/badges/refresh?uuid=...`
- [ ] Integration: `[identifier]/` page load uses persisted `user_badges` (+ background revalidation)
- [ ] Validation: fixtures + manual checks on known users
- [ ] Docs: Replace placeholder artwork URLs with final assets when provided

### Conventions (approved)

- Level slugs (per-level):
  - Creator Score: `creator-score-level-1` … `creator-score-level-6`
  - Total Earnings: `total-earnings-10`, `-100`, `-1k`, `-10k`, `-25k`, `-100k`
  - Total Followers: `total-followers-100`, `-1k`, `-10k`, `-25k`, `-100k`, `-250k`
  - Platform Talent: `platform-talent-100`, `-1k`, `-10k`
  - Platform Base: `platform-base-l1`, `-l2`, `-l3`

### Artwork placement & naming

- Path: `public/images/badges/<badge-slug>/`
- Files: `<level_slug>-earned.png` and `<level_slug>-locked.png`
  - Example: `public/images/badges/total-earnings/total-earnings-1k-earned.png`
  - Example: `public/images/badges/creator-score/creator-score-level-3-locked.png`
- Until assets are ready, use placeholder URLs in seed data.


