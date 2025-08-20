# Creator Score Badges Feature - Development Brief
## Product Context

You are implementing a **Badges System** for the Creator Score app, to help make the scoring system intuitive and the app more engaging

**Current State**: Users currently see a full breakdown of their score components (credentials with points) in the Score tab on their profile. Users see the same info that the Talent API serves. 

## Feature Requirements

### Core User Experience

1. **Discovery**: `/badges` page divided in 3 main section/categories (Trophies, Metrics, Platforms)
2. **Earning**: users sees all badges, either in a locked or earned state; user sees all levels earned (example: if I’m Creato Score Level 5, i see 5 earned badges, one for each level from 1 to 5, and one locked badge, Level 6)
3. **Score Integration**: Some badges display point contributions to the Creator Score
4. **Social Sharing**: Every earned badge has shareable URL with custom OG image
5. **Progress Tracking**: Clear paths showing requirements for locked badges and tiers

### Badge Categories (for MVP)

1. **Trophies** 
    - *Represents engagement with the app; no Creator Score points*
    - Creator Score (6 badge levels)
        - Map to existing score ranges: 0-39, 40-79, 80-119, 120-169, 170-249, 250+ (see `constants.ts`)
        - Display as: "Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6"
        - Pure status recognition, no point contribution
    - Streaks (6 badge levels)
        - 3 Days in a Row
        - 1 Week in a Row
        - 2 Weeks in a Row
        - 3 Weeks in a Row
        - 4 Weeks in a Row
        - 5 Weeks in a Row
        - (we’re currently not storing this information, but we can implement it later)
2. **Metrics**
    - *quantititative creator milestones reached; displays Creator Score points*
    - *we show current/max points per category, not per individual badge*
    - Total Earnings (6 badge levels)
        - Levels: $10, $100, $1K, $10K, $25K, $100K Earnings
        - Credentials: see `total-earnings-config.ts`
    - Total Followers (6 badge levels)
        - 100, 1K, 10K, 25K, 100K, 250K Followers
        - Credentials: see `socialAccountsService.ts`
3. **Platforms**
    - *creator activity per channel; displays Creator Score points*
    - *3-level system per platform*
    - Talent (3 badge levels)
        - **Level 1**: Account exists + basic activity
            - Credential: `talent_protocol_talent_holder` → 100 in $TALENT
        - **Level 2**: Meaningful engagement
            - Credential: `talent_protocol_talent_holder` → 1K in $TALENT
        - **Level 3**: Power user status
            - Credential:  `talent_protocol_talent_holder` → 10K in $TALENT
    - Base (3 badges levels)
        - **Level 1**: Account exists + basic activity (account age or 1 post/transaction)
            - Credential: `basename`
        - **Level 2**: Meaningful engagement (100+ followers/collectors)
            - Credential: `onchain_out_transactions` → 100+
        - **Level 3**: Power user status (1K+ followers/collectors)
            - Credential:  `deployed_nfts` ?

### Badge States & Visual Hierarchy

- **Earned**: Full color artwork, "Earned on [date]"
- **Locked**: Grayscale artwork, "X more needed" messaging, thin progress bar

### Badge Earning Display Strategy

```
"Trophies" categories (show this way):
"Creator Score"
├─ ✅ Level 1 (earned on [date])
├─ ✅ Level 2 (earned on [date])  
├─ ✅ Level 3 (earned on [date])
├─ ❌ Level 4 (104 of 120)
├─ ❌ Level 5 (104 of 170)
└─ ❌ Level 6 (104 of 250)

"Metrics" categories (show this way):
"Total Earnings: 47/100 points"
├─ ✅ $10 Earnings (earned on [date])
├─ ✅ $100 Earnings (earned on [date])  
├─ ✅ $1K Earnings (earned on [date])
├─ ❌ $10K Earnings ($4.7K of $10K)
├─ ❌ $25K Earnings ($4.7K of $25K)
└─ ❌ $100K Earnings ($4.7K of $100K)

"Platform" categories (show this way):
"Talent: 15/40 points"
├─ ✅ Level 1 (100 $TALENT)
├─ ✅ Level 2 (1K $TALENT)
├─ ❌ Level 3 (10K $TALENT)

```

### Page Structure & Navigation

**Main Badges Page (`/badges`)**:

- Page title and subtitle (follow app’s pattern, see /Settings)
    - Title: “Badges”
    - Subtitle wiht personal stats “X badges earned, Y% completion”
- We group badges in 3 sections: Trophies, Metrics, Platforms
- Inside each section there’s a 3-column badge grid
- Each badge component shows: Artwork, Title, Value (date earned or missing amount)
- Clicking a badge opens a dedicated page with badge details
- Force refresh button to check new achievements

**Badge Details Modal (`/badges/[badge-slug]`)**:

- Large badge artwork
- Badge title
- Badge description: “Earn this badge when …”
- State:
    - If Locked: "You’ve done it XX times / X more needed" + Progress bar
    - If Earned: Date earned timestamp (or number of badges earned)
- Action button:
    - If Locked: "Get Badge" (external URL where user can make progress)
    - If Earned: "Share Badge" (triggers share modal, same as we use in the profile but with different image
- Optional: "X creators also earned this badge." OR "Y% of creators achieved this"

**Public Badge URLs**:

- Format: `/{user-identifier}/badges/{badge-slug}` (tab on public profile)
- Private: `/badges/{badge-slug}` (personal view)

## Technical Architecture Requirements

### Data Architecture

You'll need to create a badge system that integrates with existing user profile data without duplicating credentials logic. Badge eligibility should be computed from existing Talent API data points.

### **Mapping Structure**

- **1 to Many Relationship (Badge → Credentials)**
    - **One badge** can represent **multiple credentials**
    - **Each credential** maps to **only one badge** (no overlaps)
- We should probably store the credential for each badge type
    - A mapping between badge slug and credential/data point slug
    - We will also need to store the condition/logic to earn each badge

### **Badge Schema (open for review/improvement)**

**Table 1: `badges`**

```
id (UUID, Primary Key)
slug (String, Unique) - e.g., "total-earnings-1k"
title (String) - e.g., "$1K Earnings"
description (String)
category (String) - "levels", "trophies", "metrics", "platforms"
subcategory (String) - e.g., "total-earnings", "farcaster-creator"
artwork_earned_url (String)
artwork_locked_url (String)
credential_mappings (JSON Array) - ["coop_records_earnings", "zora_coin_earnings"]
earning_threshold (Number) - e.g., 1000
max_points (Number) - null for non-point badges
uom (String) - "USD", "followers", "collectors", "years", null
sort_order (Number)
is_active (Boolean)

```

**Table 2: `user_badges`**

```
id (UUID, Primary Key)
user_id (String) - Talent UUID
badge_slug (String) - References badges.slug
is_earned (Boolean)
earned_at (Timestamp of the first time the user earned)
times_earned (Number) - Default 0, useful for recurring badges
current_value (Number) - e.g., 2500.75
readable_value (String) - e.g., "$2.5K"
current_points (Number)
progress_percentage (Number) - 0-100
last_updated (Timestamp)

UNIQUE(user_id, badge_slug)
```

## Badge System Development Plan

### Phase 1: Database & Core Logic

1. **Create database schema**
    - `badges` table with all badge definitions (supabase)
    - `user_badges` table for user-specific data
    - Seed initial 30 badges with proper credential mappings
2. **Build badge service layer**
    - Badge eligibility checker (maps credentials to badge requirements)
    - User badge calculator (aggregates points, determines earned status)
    - Progress calculator (percentage toward next badge)
3. **Create API endpoints**
    - `GET /api/badges` - All badge definitions
    - `GET /api/user/badges` - User's badge status
    - `POST /api/user/badges/refresh` - Force refresh user badges

### Phase 2: Backend Validation

1. **Integration with Talent API**
    - Map existing credential data to badge system
    - Verify point calculations match current scoring
    - Test badge earning logic with real user data
2. **Basic frontend validation**
    - Simple JSON display page showing user badges
    - Manual refresh button to test badge updates
    - Verify all 30 badges earn correctly

### Phase 3: UI Components

1. **Badge page components**
    - `/badges` main page with 3 sections
    - Badge card component (earned/locked states)
    - Badge detail modal with progress indicators
2. **Profile integration**
    - Replace credential breakdown with badge display
    - Trophy case component for earned badges
    - Category point summaries ("Total Earnings: 47/100 pts")

### Phase 4: Polish & Analytics

1. **Social sharing**
    - Public badge URLs (`/[user]/badges/[slug]`)
    - OG image generation for shared badges
    - Share buttons and viral mechanics
2. **Analytics implementation**
    - PostHog events for badge interactions
    - User engagement tracking
    - Badge earning rate monitoring

### Validation Gates

- **Phase 1**: Badge earning logic works correctly for test users
- **Phase 2**: All existing scores preserved, badge points match credentials
- **Phase 3**: Badge page replaces credential breakdown seamlessly
- **Phase 4**: Sharing drives measurable traffic, analytics capture engagement