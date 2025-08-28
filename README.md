# Creator Score App

A Farcaster MiniApp that shows creator scores, leaderboards, and rewards.

## Features

- **Creator Score Display** - View your creator score and ranking
- **Leaderboard** - See top creators and sponsors
- **Rewards Calculation** - Calculate potential rewards based on leaderboard position
- **Pay It Forward** - Opt out of rewards to redistribute them to other creators while keeping leaderboard position
- **Profile Management** - Connect wallets and social accounts
- **Account association** - Allows users to add your frame to their account, enables notifications

### Core Functionality
- Creator score display and ranking
- Leaderboard with pagination
- Reward calculations
- Profile management

### Account Management
- Wallet connection (Ethereum, Base, etc.)
- Social account linking (Farcaster, Lens, etc.)
- Credential management

### Rewards System
- **Boost Multiplier** - 10% reward boost for users holding 100+ $TALENT tokens
- **Pay It Forward** - Allow creators to donate their entire reward allocation to other creators
- **Smart Redistribution** - Opted-out rewards are redistributed proportionally among remaining eligible creators

### Badge System
- **Dynamic Achievement Badges** - 6-level progression system for creator milestones
- **Multiple Categories** - Trophies (Creator Score, Streaks), Records (Earnings, Followers), Special (Platform badges)
- **Progress Tracking** - Visual progress bars and artwork for earned/locked states
- **Real-time Updates** - Badges automatically unlock based on user metrics

### Notifications
- In-app notification system
- Ready-to-use notification endpoints in `api/notify` and `api/webhook`
- Notification client utilities in `lib/notification-client.ts`
