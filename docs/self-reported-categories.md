# Self-Reported Creator Categories

## Overview

This feature allows users to manually set their creator category instead of relying solely on the algorithmic determination. The app still uses the existing algorithm to pre-select a category by default, but users can override this choice.

## Implementation Details

### Key Components

1. **CategorySelectionModal** (`components/profile/CategorySelectionModal.tsx`)
   - Responsive modal (bottom sheet on mobile, dialog on desktop)
   - Uses shadcn/ui RadioGroup component for proper accessibility
   - Compact design with emoji and category name only
   - Radio buttons positioned on the right side
   - Minimal spacing between options
   - Current category pre-selected when modal opens
   - Proper DialogDescription for accessibility compliance

2. **useUserCategory Hook** (`hooks/useUserCategory.ts`)
   - Manages user's self-reported category in localStorage
   - Provides functions to update and clear category preferences
   - Scoped to individual users by talentUUID

3. **Updated useCreatorCategory Hook** (`hooks/useCreatorCategory.ts`)
   - Prioritizes user's self-reported category over algorithmic determination
   - Falls back to algorithmic category when no user preference exists
   - Maintains backward compatibility

4. **Updated ProfileHeader** (`components/profile/ProfileHeader.tsx`)
   - Shows clickable category badge on the same line as total followers
   - Only clickable when viewing own profile
   - Only visible when user has a creator score
   - Uses bullet separator between followers count and category

### Data Flow

```
User clicks category badge → Opens CategorySelectionModal → User selects category → 
updateCategory() called → localStorage updated → useCreatorCategory re-renders → 
ProfileHeader shows new category
```

### Storage

- **Location**: localStorage
- **Key**: `user_creator_category_{talentUUID}`
- **Format**: Category name string (e.g., "Artist", "Writer")
- **Scope**: Per user (scoped by talentUUID)

### Category Options

All categories from `CREATOR_CATEGORIES` are available:
- 🎨 Artist
- 🎬 Video  
- ✍️ Writer
- 💬 Social
- 🎵 Music
- 🎙️ Podcast
- 🔍 Curator

### UI Behavior

1. **Own Profile**: Shows clickable badge with "Edit" indicator
2. **Other Profiles**: Shows non-clickable badge
3. **No Creator Score**: No category badge shown
4. **Modal**: Simple radio button list with emoji and category name

### Modal Design

- **Desktop**: Centered dialog with title and description
- **Mobile**: Bottom sheet with header and description
- **Selection**: shadcn/ui RadioGroup component for proper accessibility
- **Layout**: Clean list without borders, no vertical spacing (padding only)
- **Accessibility**: Full ARIA compliance with proper descriptions and screen reader support

### Future Enhancements

- [ ] API integration for server-side storage
- [ ] Authentication for category updates
- [ ] Category change analytics
- [ ] Category validation based on credentials

## Usage

Users can change their category by:
1. Viewing their own profile
2. Clicking the category badge (only visible if they have a creator score)
3. Selecting a new category from the radio button list
4. Confirming their choice

The change takes effect immediately and persists across sessions. 