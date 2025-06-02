# Creator Score Mini App - Development Tasks

## Coding Instructions

- **Write the absolute minimum code required**
- **No sweeping changes**
- **No unrelated edits** - focus on just the task you're on
- **Make code precise, modular, testable**
- **Don't break existing functionality**
- **Avoid custom components as much as possible; prioritize default shadcn components and reuse as many components as possible**
- **If I need to do anything (e.g. Supabase/AWS config), tell me clearly**

## Phase 1: Basic Structure & Navigation

- [x] **Task 1.1**: Set up main app file with routing between three screens (Profile, Leaderboard, Settings)
- [x] **Task 1.2**: Build header with "Creator Score" title and clickable question mark icon
- [x] **Task 1.3**: Create three-icon bottom navigation that highlights active screen
- [x] **Task 1.4**: Create info modal with Creator Score explanation (3 bullets + CTA)

## Phase 2: Profile Screen Foundation

- [x] **Task 2.1**: Create profile screen container with proper spacing and layout structure
- [x] **Task 2.2**: Build profile header with image (rightleft), name (left), and total followers
- [x] **Task 2.3**: Stats component for Creator Score and Total Rewards
- [x] **Task 2.4**: Create tab interface switching between Accounts and Score views
- [x] **Task 2.5**: Build two-column grid layout for account cards with rounded corners
- [x] **Task 2.6**: Create expandable score categories list with dropdown functionality

## Phase 3: Leaderboard Screen

- [ ] **Task 3.1**: Create leaderboard screen container with scrollable list layout
- [ ] **Task 3.2**: Build leaderboard entry component (rank + avatar + name + score)
- [ ] **Task 3.3**: Create highlighted user position component with distinct styling
- [ ] **Task 3.4**: Render complete leaderboard with user position at top, separated from others

## Phase 4: Settings Screen

- [ ] **Task 4.1**: Create settings screen with two distinct sections and proper spacing
- [ ] **Task 4.2**: Build connect accounts section with three options (Wallet, Twitter, LinkedIn) showing status and buttons
- [ ] **Task 4.3**: Create human verification section with three verification options and status indicators

## Phase 5: API Integration

- [ ] **Task 5.1**: Create Creator Score API service that returns profile data with expected structure
- [ ] **Task 5.2**: Connect real Creator Score and profile data to Profile screen display
- [ ] **Task 5.3**: Create leaderboard API service that returns list of creators with scores
- [ ] **Task 5.4**: Connect real leaderboard data to Leaderboard screen with accurate user position
- [ ] **Task 5.5**: Build account connection status checker that shows real connection status in Settings

## Phase 6: Interactive Features

- [ ] **Task 6.1**: Add working wallet connection using MiniKit with status updates
- [ ] **Task 6.2**: Implement Twitter OAuth flow that completes and updates connection status
- [ ] **Task 6.3**: Implement LinkedIn OAuth flow that completes and updates connection status
- [ ] **Task 6.4**: Add real score breakdown data to Score tab with working dropdowns

## Phase 7: Polish & Error Handling

- [ ] **Task 7.1**: Add loading indicators for all API calls that appear and disappear appropriately
- [ ] **Task 7.2**: Add user-friendly error messages for failed API calls with retry options
- [ ] **Task 7.3**: Add helpful empty state messages when no data available
- [ ] **Task 7.4**: Optimize mobile layout ensuring proper touch targets and responsive design
- [ ] **Task 7.5**: Add API response caching for improved performance and faster navigation

## Testing Checkpoints

After completing each phase:

- **Phase 1**: Navigation works smoothly between all screens
- **Phase 2**: Profile screen displays correctly with tabs and layout
- **Phase 3**: Leaderboard shows properly formatted list
- **Phase 4**: Settings screen has clear sections and buttons
- **Phase 5**: Real data displays throughout the app
- **Phase 6**: All interactive features work as expected
- **Phase 7**: App feels polished and handles edge cases well
