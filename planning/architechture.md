# Creator Score Mini App - Architecture

## Overview

A Farcaster mini app with three main screens, bottom navigation, and external API integrations for Creator Score data.

## File Structure

```
/app
  page.jsx                - Main app entry point with routing
  layout.jsx              - Root layout with providers
  globals.css             - Global styles and design tokens

/components
  /ui                     - shadcn/ui components (auto-generated)
    button.jsx
    card.jsx
    tabs.jsx
    dialog.jsx
    badge.jsx
    avatar.jsx

  /navigation
    Header.jsx            - Top navigation with title and info icon
    BottomNav.jsx         - Three-tab bottom navigation
    InfoModal.jsx         - Creator Score explanation modal

  /profile
    ProfileScreen.jsx     - Main profile page container
    ProfileHeader.jsx     - User image, name, action buttons
    AccountsTab.jsx       - Connected accounts grid
    ScoreTab.jsx          - Score breakdown with dropdowns

  /leaderboard
    LeaderboardScreen.jsx - Main leaderboard page container
    LeaderboardEntry.jsx  - Individual creator row component
    UserPosition.jsx      - Highlighted user position component

  /settings
    SettingsScreen.jsx    - Main settings page container
    ConnectAccounts.jsx   - Account connection section
    HumanVerification.jsx - Verification options section
```

## Component Architecture

### Navigation Layer

- **Header**: Fixed top bar, manages info modal state
- **BottomNav**: Controls active screen state, passes to parent
- **InfoModal**: Standalone modal, triggered by header

### Screen Components

- **ProfileScreen**: Container managing profile tabs state
- **LeaderboardScreen**: Handles leaderboard data fetching and display
- **SettingsScreen**: Manages connection flows and status

### Shared Components

- **Card-based UI**: Consistent styling across all screens
- **Reusable Entries**: Same component pattern for accounts, scores, leaderboard

## Layout

- Mobile-first
- On desktop 

## Design System

- **Minimalist, mobile-first layout**: optimized for mobile viewing with appropriate touch targets and plenty of white space; on desktop, the app centers its mobile-style content in a fixed-width column, hides the bottom navigation bar, and relies on the top header for navigation.
- **Neutral colors**: White background, dark text, soft shadows and subtle borders
- **Modular components**: use shadcn/ui components and Lucide React icons as default; all UI elements are modular, reusable, and follow a consistent visual hierarchy; 
- **Clean typography**: Clear hierarchy with bold names, subtle secondary text in modern sans-serif font
- **Interactive elements**: Hover states, smooth transitions, expandable sections
- **Loading & Error States**: skeleton screens for loading + graceful error messages and retry options

## Performance Considerations

### Caching Strategy

- **Profile data**: Cache for 5 minutes
- **Leaderboard**: Cache for 1 minute, background refresh
- **Score breakdown**: Cache until profile updates

### Loading States

- **Skeleton screens**: For initial data loading
- **Progressive enhancement**: Show basic info first, enhance with details
- **Optimistic updates**: For connection status changes

### Error Handling

- **API failures**: Graceful degradation with retry options
- **Network issues**: Offline state indicators
- **OAuth failures**: Clear error messages and retry flows
