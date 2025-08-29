# Creator Score App - Product Brief

## Project Overview

The Creator Score App is a Farcaster Frame MiniApp that serves as a comprehensive creator reputation and rewards platform. It tracks creator scores across multiple onchain platforms (Zora, Farcaster, Mirror, Lens) and enables a rewards system where top creators can earn USDC based on their performance and engagement.

The app operates as a mobile-first web application built on Next.js, designed to be embedded within Farcaster Mini Apps while maintaining standalone functionality for broader accessibility.

## Target Audience

**Primary Users:**
- Content creators active on onchain platforms (Farcaster, Lens, Zora, Mirror)
- Users seeking to track their creator reputation and performance metrics
- Community members interested in discovering and supporting top creators
- Token holders looking to participate in the rewards ecosystem

**Secondary Users:**
- Developers building on the creator economy
- Analysts tracking creator performance trends
- Platform administrators managing the rewards system

## Primary Benefits & Features

### Core Functionality
- **Creator Score Tracking**: Real-time scoring system based on onchain activity and engagement
- **Leaderboard System**: Ranked display of top creators with pagination and filtering
- **Rewards Calculation**: Transparent calculation of potential USDC earnings based on leaderboard position
- **Profile Management**: Comprehensive creator profiles with credential tracking and social account linking

### Advanced Features
- **TALENT Token Integration**: 10% reward boost for users holding 100+ TALENT tokens
- **Pay It Forward**: Creators can opt out of rewards to redistribute them to other creators while maintaining leaderboard position
- **Badge System**: Dynamic achievement badges for creator milestones with 6-level progression system
- **Multi-Platform Support**: Integration with Ethereum, Base, Farcaster, Lens, Twitter, GitHub, and other social platforms
- **Notification System**: In-app notifications and webhook support for real-time updates

### Badge System
The badge system provides gamified achievement tracking with dynamic 6-level progression across multiple categories. Badges automatically unlock based on user metrics and provide visual progress tracking with custom artwork.

**Core Features:**
- **Dynamic Progression**: Single badge per category with 6 unlockable levels based on thresholds
- **Multiple Categories**: Trophies (Creator Score, Streaks), Records (Earnings, Followers), Special (Platform badges)
- **Visual Progress**: Progress bars and artwork for both earned and locked states
- **Real-time Updates**: Badges update automatically as users achieve new milestones
- **Mobile-First Design**: Responsive 3-column grid with touch interactions

**Badge Categories:**
- **Trophies**: Creator Score levels, Daily/Weekly streaks, Pay It Forward opt-out
- **Records**: Total earnings ($10-$100k), Total followers (100-250k), Total collectors
- **Special**: Talent Protocol ($TALENT holdings), Base Network (transaction count)

### Pay It Forward System
The Pay It Forward feature transforms the leaderboard from purely competitive to community-driven, allowing creators to give back while receiving social recognition for their generosity.

**Core Functionality:**
- **Rewards Opt-out**: One-time, irreversible decision to donate entire reward allocation
- **Smart Redistribution**: Opted-out rewards are proportionally distributed among remaining eligible creators
- **Leaderboard Position Preservation**: Users maintain their ranking while supporting others
- **Boost Integration**: Opted-out users' boosted scores (1.1x for 100+ TALENT holders) contribute to the redistribution pool

**Enhanced User Experience:**
- **Confetti Celebration**: Custom green-themed confetti animation using `canvas-confetti` with brand colors
- **Social Sharing**: Integrated sharing system with custom messaging for Farcaster and Twitter
- **Real-time Updates**: Immediate UI synchronization across all components with intelligent cache management
- **Visual Recognition**: Green HandHeart badges and crossed-out rewards throughout the interface
- **Analytics Integration**: Comprehensive PostHog tracking for user behavior and feature adoption

**Technical Implementation:**
- **Custom Hooks**: `useOptOutStatus` for cross-context state management
- **Centralized Services**: `rewardsCalculationService` for clean separation of concerns
- **API Integration**: RESTful endpoints with comprehensive validation and error handling
- **Cache Management**: Intelligent cache invalidation and real-time updates

### User Experience
- **Mobile-First Design**: Optimized for mobile devices with responsive web interface
- **Farcaster Mini App Integration**: Seamless embedding within Farcaster social platform
- **Real-Time Updates**: Live data refresh with caching for optimal performance
- **Social Sharing**: Built-in sharing capabilities for creator scores and achievements

## High-Level Tech Architecture

### Frontend Stack
- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query for server state, React Context for local state
- **Authentication**: Privy for wallet-based authentication

### Backend & APIs
- **API Routes**: Next.js API routes following Client Hook → API Route → Service pattern
- **External Integrations**: Talent Protocol API, Neynar API, Supabase
- **Caching Strategy**: Hybrid caching with background refresh and graceful fallbacks
- **Real-Time Features**: WebSocket support for live updates

### Infrastructure
- **Deployment**: Vercel platform with edge functions
- **Database**: Supabase for user data and preferences
- **Analytics**: PostHog for user behavior tracking
- **Security**: Row-level security policies and environment-based configuration

### Key Integrations
- **Talent Protocol**: Core creator scoring and rewards system
- **Farcaster**: Social platform integration and Frame embedding
- **Base Network**: Primary blockchain for rewards and token operations
- **Multiple Wallets**: Support for Ethereum, Base, and other EVM-compatible chains

## Business Model

The app operates within the Talent Protocol ecosystem, where:
- Creator scores are calculated based on onchain activity and engagement
- Top creators receive USDC rewards from a shared pool
- TALENT token holders receive 10% boost on rewards
- The system incentivizes quality content creation and community engagement

## Current Status

**Version**: 1.3.1  
**Phase**: Active development with core features implemented  
**Key Milestones**: 
- ✅ Core creator scoring and leaderboard system
- ✅ TALENT token boost integration
- ✅ Multi-platform credential tracking
- ✅ Pay It Forward (rewards opt-out) system
- ✅ Badge system with dynamic 6-level progression

The app serves as a critical infrastructure piece for the creator economy, providing transparency, gamification, and financial incentives for quality content creation across onchain platforms.
