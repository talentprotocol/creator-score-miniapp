# Creator Score Badges Feature - Development Brief

## Context

You are implementing a **Badges page** for the Creator Score app.

## Feature Requirements

### Core User Experience

1. **Discovery**: `/badges` page divided in 3 main section/categories (Trophies, Metrics, Platforms)
2. **Earning**: users sees all badges, either in a locked or earned state; user sees all levels earned (example: if I’m Creato Score Level 5, i see 5 earned badges, one for each level from 1 to 5, and one locked badge, Level 6)
3. **Score Integration**: Some badges display point contributions to the Creator Score
4. **Social Sharing**: Every earned badge has shareable URL with custom OG image
5. **Progress Tracking**: Clear paths showing requirements for locked badges and tiers

### Badge Categories (for MVP)

1. **Trophies** 
    - Creator Score Level (6 badge levels)
        - Title: Creator Level 1-6
        - Value: Earned date / Points missing
        - Map to existing score ranges: 0-39, 40-79, 80-119, 120-169, 170-249, 250+ (see `constants.ts`)
    - Streaks (6 badge levels)
        - Title: 1-6 Day Streak
        - Value: (amount of times)
        - Note: we’re currently not storing this information, but we can implement it later
2. **Metrics**
    - Total Earnings (6 badge levels)
        - Title: $10, $100, $1K, $10K, $25K, $100K in Earnings
        - Value: Earned date / Amount missing
        - Credential mapping: see `total-earnings-config.ts`
    - Total Followers (6 badge levels)
        - Title: 100, 1K, 10K, 25K, 100K, 250K Followers
        - Value: Earned date / Amount missing
        - Credential mapping: see `socialAccountsService.ts`
3. **Platforms**
    - Talent (3 badge levels)
        - Title: Talent: Level 1-3
            - Level 1: 100 in $TALENT
            - Level 2: 1K in $TALENT
            - Level 3: 10K in $TALENT
        - Value: Earned date / Amount missing (in $TALENT)
        - Credential mapping: `talent_protocol_talent_holder`
    - Base (3 badges levels)
        - Title: Base: Level 1-3
            - Level 1: `onchain_out_transactions` → 10+
            - Level 2:  `onchain_out_transactions` → 100+
            - Level 3: `onchain_out_transactions` → 1K+
        - Value: Earned date / Amount missing (transactions)
        - Credential mapping: `onchain_out_transactions`

### Badge States & Visual Hierarchy

- **Earned**: Full color artwork, "Earned on [date]"
- **Locked**: Grayscale artwork, "X more needed" messaging, thin progress bar
- Note: I will provide the finalized artwork for both Earned and Locked state (but they might need to be resized)

### Badge Earning Display Strategy (example)

```
Trophies
├─ ✅ Creator Score, Level 1 (earned on [date])
├─ ✅ Creator Score, Level 2 (earned on [date])  
├─ ✅ Creator Score, Level 3 (earned on [date])
├─ ❌ Creator Score, Level 4 (104 of 120)
├─ ❌ Creator Score, Level 5 (104 of 170)
└─ ❌ Creator Score, Level 6 (104 of 250)

Metrics
├─ ✅ $10 in Earnings (earned on [date])
├─ ✅ $100 in Earnings (earned on [date])  
├─ ✅ $1K in Earnings (earned on [date])
├─ ❌ $10K in Earnings ($4.7K of $10K)
├─ ❌ $25K in Earnings ($4.7K of $25K)
└─ ❌ $100K in Earnings ($4.7K of $100K)

Platform
├─ ✅ Talent: Level 1 (100 $TALENT)
├─ ✅ Talent: Level 2 (1K $TALENT)
├─ ❌ Talent: Level 3 (10K $TALENT)

```

### Page Structure & Navigation

- **Main Badges Page (`/badges`)**:
    - Page title and subtitle (follow app’s pattern, see /Settings)
        - Title: “Badges”
        - Subtitle wiht personal stats “X badges earned, Y% completed”
    - Group badges in 3 sections: Trophies, Metrics, Platforms
        - no subtitle or description
        - inside each section there’s a 3-column badge grid
    - Each badge component shows the following info vertically stacked:
        - Artwork (main element, bigger thant the rest)
        - Title
        - Value (date earned or missing amount)
        - see `badges page 2.jpg` for size/layout reference
    - Clicking on a badge opens a dedicated page with badge details
- **Badge Details Page (`/badges/[badge-slug]`)**:
    - (back button, top left)
    - Large badge artwork in the center
    - Title
    - Value:
        - If Locked: "You’ve done it XX times / X more needed" + Progress bar
        - If Earned: Date earned timestamp (or number of badges earned)
    - Action button:
        - If Locked: "Let’s do this!"
        - If Earned: "Share Badge"
    - Optional footnote: "X creators also achieved this." OR "Y% of creators achieved this"
- **Public Badge URLs**:
    - Format: `/{user-identifier}/badges/{badge-slug}` (tab on public profile)
    - Private: `/badges/{badge-slug}` (personal view)
    
    ---
    
    - Artwork assets under: `public/images/badges/<badge-slug>/`
    - File names: `<level_slug>-earned.png` and `<level_slug>-locked.png`
    - Example: `badges/total-earnings/total-earnings-1k-earned.png`
    - Example: `badges/creator-score/creator-score-level-3-locked.png`
    - Badge slugs (canonical)
        
        ```
        creator-score
        total-earnings
        total-followers
        platform-talent
        platform-base
        
        ```
        
    - Level slugs
        - Creator Score
        
        ```
        creator-score-level-1
        creator-score-level-2
        creator-score-level-3
        creator-score-level-4
        creator-score-level-5
        creator-score-level-6
        
        ```
        
        - Total Earnings
        
        ```
        total-earnings-10
        total-earnings-100
        total-earnings-1k
        total-earnings-10k
        total-earnings-25k
        total-earnings-100k
        
        ```
        
        - Total Followers
        
        ```
        total-followers-100
        total-followers-1k
        total-followers-10k
        total-followers-25k
        total-followers-100k
        total-followers-250k
        
        ```
        
        - Platform Talent
        
        ```
        platform-talent-100
        platform-talent-1k
        platform-talent-10k
        
        ```
        
        - Platform Base
        
        ```
        platform-base-l1
        platform-base-l2
        platform-base-l3
        
        ```
        

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