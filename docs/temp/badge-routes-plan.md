# Badge Routes Implementation Plan - Option B

## Overview
Semantic URLs for badge sharing that will be implemented after Badge Profile Section is complete.

## Planned URL Structure

### Current (Temporary)
```
https://creatorscore.app/macedo  # Links to profile, shows badge image in modal
```

### Target (Option B)
```
https://creatorscore.app/macedo/badges/creator-score/level-5
https://creatorscore.app/macedo/badges/total-earnings/level-3
https://creatorscore.app/macedo/badges/daily-streaks/level-7
```

## Route Structure

### Files to Create
```
app/[identifier]/badges/[badgeSlug]/level-[level]/
├── page.tsx          # Badge-specific page
├── layout.tsx        # Badge-specific meta tags
└── opengraph-image.tsx # Dynamic OG images (optional)
```

### Meta Tags per Badge
Each badge route will serve specific meta tags:
- **Title**: `{DisplayName} - {BadgeTitle} Level {Level}`
- **Description**: `{DisplayName} earned the {BadgeTitle} badge at Level {Level}. {BadgeDescription}`
- **Image**: `/api/share-image-badge/{badgeSlug}?talentUUID={id}&level={level}&title={title}`

## ShareContentGenerators Update

### Current Badge Sharing (Temporary)
```typescript
// lib/sharing/sharing.ts
static badge(context: ShareContext, badge: BadgeState): ShareContent {
  // Currently links to profile
  const url = generateShareUrl(handle);
}
```

### Future Badge Sharing (Option B)
```typescript
static badge(context: ShareContext, badge: BadgeState): ShareContent {
  // Will link to dedicated badge page
  const url = `${generateShareUrl(handle)}/badges/${badge.badgeSlug}/level-${badge.currentLevel}`;
}
```

## Implementation Dependencies

### Prerequisites
1. ✅ Badge Profile Section implementation (user's responsibility)
2. ✅ Badge detail pages with proper routing
3. ✅ Badge-specific meta tag generation

### Implementation Steps (Post-Prerequisites)
1. Create dynamic badge route structure
2. Update ShareContentGenerators.badge() 
3. Add badge-specific meta tags
4. Test social media preview functionality
5. Migrate existing badge URLs

## Benefits of Option B

### SEO & Social Sharing
- ✅ Semantic URLs (`/badges/creator-score/level-5`)
- ✅ Badge-specific meta tags and descriptions
- ✅ Dedicated social media previews per badge
- ✅ Clean, shareable URLs without query parameters

### User Experience  
- ✅ URLs are self-describing
- ✅ Direct links to specific badge achievements
- ✅ Better sharing on social platforms
- ✅ Supports dozens of badge types cleanly

### Technical Architecture
- ✅ Isolated route logic per badge type
- ✅ Type-safe route parameters
- ✅ Scalable for new badge categories
- ✅ Clear separation of concerns

## Notes
- Implementation blocked until Badge Profile Section is complete
- Current query parameter approach (?share=optout) works for Pay It Forward
- Badge sharing currently uses profile URLs as temporary solution
