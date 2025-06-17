## TASK

- Design a modern mobile-first UI for a web app for content creators called Creator Rewards.
- The app has a clean, minimal design with a white background and strategic use of cards only where needed

## CONTEXT & CONSTRAINTS
 
- We're in design mode. We're not going to be building any backend functionality or business logic. We're just going to use dummy JSON in order to mock up the prototype of our mini app and show the intended behavior.
- Focus just on mobile screens (ignore desktop / responsive for now)

## LAYOUT & NAVIGATION

- 4 main pages: Rewards, Search, Profile, Settings
- Fixed top navigation bar (TopNav) with app title and hamburger menu
- Bottom navigation bar (BottomNav) with minimal icons for switching screens.


## DESIGN SYSTEM & GUIDELINES

- **Minimalist, mobile-first layout**: optimized for mobile viewing with appropriate touch targets and plenty of white space; on desktop, the app centers its mobile-style content in a fixed-width column, hides the bottom navigation bar, and relies on the top header for navigation.
- **Neutral colors**: White background, dark text, soft shadows and subtle borders
- **Modular components**: use shadcn/ui components and Lucide React icons as default; all UI elements are modular, reusable, and follow a consistent visual hierarchy; 
- **Clean typography**: Clear hierarchy with bold names, subtle secondary text in modern sans-serif font
- **Interactive elements**: Hover states, smooth transitions, expandable sections
- **Loading & Error States**: skeleton screens for loading + graceful error messages and retry options


## PAGE STRUCTURE

### Rewards 🏆
- pick sponsor: Base, Celo, Talent
    - button with state: eligible / not eligible (open “how to earn” modal drawer + link to settings)
- pick period (tabs): this week / last week / all time
- 2 stat cards (aggregated data): Rewards Distributed + Builders Rewarded
- 2 stat cards (user data, with progress bar): 
  - Rewards Earned (link to profile/rewards)
  - Rewards Score (0-100 value, open modal drawer with breakdown: Verified Contracts + Public Commits + Farcaster Mini Apps + Boosts)
- leaderboard:
  - List-style leaderboard with: rank + pfp + name + rewards
  - The user appears first, pinned to the top of the leaderboard
  - Scroll enabled for leaderboard, supports infinite scroll for top 100 builders
  - if “all time” selected: add a label/badge for “Hall of Fame”, and sort them chronologically: includes all users who reached 1 ETH in rewards (max amount)
  - if “This Week” selected: add a label/badge for “New Builders” that are in the leaderboard for the first time


### Search 🔍
- simple search bar (search by name only)
- top 100 list (same styling as leaderboard): rank + pfp + name + builder score 

### Profile ⚡️
- Profile header (copy Creator Score: name, pfp, date of first reward)
- AI summary
- 2 personal stat cards: Builder Score + Rewards Earned
- 3 tabs: 
  - Accounts
  - Projects: list repo and contract list with links + ecosystem tag 
  - Rewards: weekly activity rank + rewards earned (and who sponsored)

### Settings ⚙️

- 3 distinct sections and proper spacing: Connect Accounts, Human Verification, Reward Boosts
- Connect accounts section with 3 options (GitHub, Wallet, Twitter) showing status and connect button
  - user can connect multiple wallets, so theres also an "Add new wallet" button visible
  - allow user to choose "Primary Address" (from the available ones) and show label
- Human verification section with 3 verification options with status indicators and buttons
  - Options: Coinbase Verified Account, Self.xyz, World
- Reward Boosts, also 3 options: Basename, Hacker, Base Builder

### Splash page (ignore for now)
- show eligibility criteria
    - builder score ✅ (we don’t need it, but shows progress)
    - GitHub
    - human checkmark
- show top 3 earners (pfp, name, total rewards)
- subtle skip option