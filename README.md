# Creator Score App

A Farcaster MiniApp that shows creator scores, leaderboards, and rewards.

## Features

- **Creator Score Display** - View your creator score and ranking
- **Leaderboard** - See top creators and sponsors
- **Rewards Calculation** - Calculate potential rewards based on leaderboard position
- **Pay It Forward** - Opt out of rewards to redistribute them to other creators while keeping leaderboard position
- **Profile Management** - Connect wallets and social accounts
- **Account association** - Allows users to add your frame to their account, enables notifications

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Required
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key
TALENT_API_KEY=your_talent_protocol_api_key

# Optional
NEYNAR_API_KEY=your_neynar_api_key
FARCASTER_HEADER=your_farcaster_header
FARCASTER_PAYLOAD=your_farcaster_payload
FARCASTER_SIGNATURE=your_farcaster_signature
```

## Development

```bash
npm install
npm run dev
```

## Features

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
- **Badge System** - Visual indicators for boosted and opted-out users

### Notifications
- In-app notification system
- Ready-to-use notification endpoints in `api/notify` and `api/webhook`
- Notification client utilities in `lib/notification-client.ts`
