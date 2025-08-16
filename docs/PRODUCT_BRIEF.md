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
- **TALENT Token Integration**: 10% reward boost for users holding 1000+ TALENT tokens
- **Badge System**: Achievement-based badges for milestones in creator score, earnings, and platform engagement
- **Multi-Platform Support**: Integration with Ethereum, Base, Farcaster, Lens, Twitter, GitHub, and other social platforms
- **Notification System**: In-app notifications and webhook support for real-time updates

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
- 🔄 Badge system (Phase 1 - Database & Core Logic)
- 📋 Opt-out functionality planning

The app serves as a critical infrastructure piece for the creator economy, providing transparency, gamification, and financial incentives for quality content creation across onchain platforms.
