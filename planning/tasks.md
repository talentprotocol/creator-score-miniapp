# Creator Score Mini App - Development Tasks

## Coding Instructions

- **Write the absolute minimum code required**
- **No sweeping changes**
- **No unrelated edits** - focus on just the task you're on
- **Make code precise, modular, testable**
- **Don't break existing functionality**
- **Avoid custom components as much as possible; prioritize default shadcn components and reuse as many components as possible**
- **If I need to do anything (e.g. Supabase/AWS config), tell me clearly**


## task-manager (cursor rule)
Consider @architechture.md and @tasks.md
- Read both carefully. There should be no ambiguity about what we’re building.
- Follow @tasks.md and complete one task at a time.
- After each task, stop. I’ll test it. 
- If it works, commit to GitHub, mark the task as completed on @tasks.md and move to the next.


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

- [x] **Task 3.1**: Build a list-style leaderboard: rank + avatar + name + creator score + creator rewards
- [x] **Task 3.2**: Rewards campaign; add two stat cards above the leaderboard: "Round Ends" + "Rewards Pool"
- [x] **Task 3.3**: Use the Talent API to get real leaderboard data for top 100 creators by creator score
- [x] **Task 3.3**: calculate an estimation of how much each user will receive in creator rewards as part of the Creator Score Launch campaign (we're distributing 10 ETH to the top 1000 creators by creator score); for now let’s multiply their score with the following multiplier: 0.00005588184343025108


## Phase 4: Settings Screen

- [ ] **Task 4.1**: Create settings screen with two distinct sections and proper spacing
- [ ] **Task 4.2**: Build connect accounts section with three options (Wallet, Twitter, LinkedIn) showing status and buttons
- [ ] **Task 4.3**: Create human verification section with three verification options and status indicators
- [ ] **Task 4.4**: Build account connection status checker that shows real connection status in Settings


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
