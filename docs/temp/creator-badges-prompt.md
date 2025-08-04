# Creator Score Badges Feature - Development Brief

## Product Context

You are implementing a **Badges System** for the Creator Score app that transforms the technical score breakdown into an engaging collectible experience. This replaces the current credential breakdown UI while preserving the existing scoring algorithm.

**Current State**: React/Next.js app with Talent Protocol API integration. Users currently see a technical breakdown of their score components (credentials with points). Users see the same info that the Talent API serves. We're replacing this presentation layer with badges while keeping the underlying scoring unchanged.

**Business Goal**: Increase DAU/WAU by 40%+ through gamified badge collection while building foundation for branded partnership monetization. Badges make the scoring system intuitive: users understand "this badge represents my total earnings and contributes X points."

## Feature Requirements

### Core User Experience
1. **Badge Discovery**: New `/badges` page with 4 categories (Levels, Trophies, Metrics, Platforms)
2. **Score Integration**: Some badges will display point contributions, replacing technical credential breakdown
3. **Achievement Collection**: Users earn all qualifying milestone badges (not just highest)
4. **Social Sharing**: Every earned badge has shareable URL with custom OG image for viral growth
5. **Progress Tracking**: Clear paths showing requirements for locked badges and tiers

### Badge Categories (30 total for MVP)

**Creator Score Levels (6 badges - no points)**
- Map to existing score ranges: 0-39, 40-79, 80-119, 120-169, 170-249, 250+
- Display as: "Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6"
- Pure status recognition, no point contribution

**Trophies (15 badges - no points)**
- Top Earner rankings: Farcaster/Zora/Mirror/Paragraph Top 1K/100/10 (12 badges)
- Years Onchain: 3 badges (1 Year, 2 Years, 5 Years) based on oldest account

**Metrics (12 badges - category points)**
- Total Earnings (6 badges): $10, $100, $1K, $10K, $25K, $100K (award all qualifying badges)
- Total Followers (6 badges): 100, 1K, 10K, 100K, 250K, 1M (award all qualifying badges) 
- *Show current/max points per category, not per individual badge*

**Platforms (20+ badges - individual points)**
- 3-tier system per platform (Basic/Advanced/Expert)
  - Tier 1: Account exists + earliest post/transaction
  - Tier 2: Meaningful engagement (100+ followers/collectors)  
  - Tier 3: Power user status (1K+ followers/collectors)

### Badge States & Visual Hierarchy
- **Earned**: Full color artwork, "Earned on [date]"
- **Locked**: Grayscale artwork, "X more needed" messaging, thin progress bar

### Badge Categories in UI
```
Tab Structure: Levels | Trophies | Metrics | Platforms

Levels: 6 badges, no points, pure status display
Trophies: ~15 badges, no points, ranking-based achievements  
Metrics: ~12 badges, category points shown ("Total Earnings: 47/100 pts"), growth-focused
Platforms: ~12 platforms / 36 badges, individual points shown, 3-tier presence system
```

### Badge Earning Display Strategy
```
Metrics Categories (Show this way):
"Total Earnings: 47/100 points"
├─ ✅ $10 Earnings (earned)
├─ ✅ $100 Earnings (earned)  
├─ ✅ $1K Earnings (earned)
├─ ❌ $10K Earnings (need $5K more)
└─ ❌ $25K Earnings (need $20K more)

Platform Categories (Show this way):
"Farcaster Creator (Tier 2): 15 points"
├─ ✅ Basic (account exists)
├─ ✅ Advanced (100+ followers)
├─ ❌ Expert (need 900 more followers)
```

### Page Structure & Navigation

**Main Badge Page (`/badges`)**:
- Badge grid showing: Artwork, Title, Readable Value OR "X more needed"
- Click opens full-screen modal with badge details
- Force refresh button to check new achievements

**Badge Details Modal (`/badges/[badge-slug]`)**:
- Badge title and description  
- Large badge artwork
- Readable value (coming from the Talent API data point)
- **If Locked**: "X more needed" + Progress bar 
- **If Earned**: Date earned timestamp
- Action button: "Complete Achievement" (locked) or "Share Badge" (earned)

**Public Badge URLs**:
- Format: `/{user-identifier}/badges/{badge-slug}` (tab on public profile)
- Private: `/badges/{badge-slug}` (personal view)



## Technical Architecture Requirements

### Data Architecture
You'll need to create a badge system that integrates with existing user profile data without duplicating credentials logic. Badge eligibility should be computed from existing Talent API data points.

### API Integration Points
- **Existing**: User profile data, Creator Score, credentials from Talent API
- **New**: Badge definitions, user badge tracking, eligibility checking, share URL generation


## Development Phases

### Phase 1: Core Badge System

**Deliverables**:
1. **Badge Management System**
   - Badge definitions with requirements, artwork URLs, categories
   - Badge eligibility logic based on existing credential data
   - User badge claiming and storage system

2. **Basic /badges Page**
   - Badge grid layout with filtering (All, Earned, Locked)
   - Badge cards showing: artwork, title, readable value
   - Force refresh button for checking new achievements
   - Category tabs 

3. **Badge Details Modal**
   - Full-screen modal for badge details (`/badges/[badge-slug]`)
   - Large artwork, title, description, readable value
   - Progress bar for locked badges, earned date for completed badges
   - Action buttons: "Complete Achievement" or "Share Badge"

**Success Criteria**: Users can view badges, see progress toward locked badges, and automatically earn badges when criteria met

### Phase 2: Social Sharing System

**Deliverables**:
1. **Shareable URLs**
   - Private badge URLs: `/badges/{badge-slug}` (personal modal)
   - Badge details page with proper meta tags for social sharing
   - Integration with user public profiles
   - Public badge URLs: `/{user-identifier}/badges/{badge-slug}` (profile tab)

2. **OG Image Generation**
   - Dynamic OG images showing badge artwork + user achievement
   - Optimized for Farcaster, Twitter, and other social platforms
   - Template system for consistent branding across badge types

3. **Social Integration**
   - Share buttons with platform-specific optimization
   - Pre-written share copy templates
   - Integration with Farcaster cast composer if possible
   - Share analytics tracking (PostHog events)

**Success Criteria**: Badge sharing drives measurable traffic and new user discovery


## Analytics & Tracking

Implement PostHog events for:
- `badge_page_viewed` (user engagement)
- `badge_earned` (automatic achievement tracking)  
- `badge_shared` (viral coefficient)
- `badge_share_clicked` (inbound traffic)
- `badge_refresh_triggered` (manual data refresh usage)

Track key metrics: earning rate, time-to-earn, share-to-click conversion, return visit rate, refresh button usage.