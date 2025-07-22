# Creator Score Mini App – Architecture & Core Principles

## PRODUCT PRINCIPLES

- **Principle:** Our apps are optimized for fast, consistent building by "vibe coders" - reusability over customization.
- **User Identification:** Users are identified by a canonical Talent UUID, but can log in or be found via Farcaster, GitHub, or wallet.
- **Dual Authentication:** Automatic environment detection enables Farcaster authentication within MiniApps and Dynamic wallet authentication in browsers, with wallet addresses serving as universal identifiers for reputation scoring.
- **Development Mode:** Environment variable `NEXT_PUBLIC_DEV_MODE=true` bypasses authentication flows and returns hardcoded wallet address for rapid UI development without authentication delays.
- **Shared Utilities:** All user lookups and profile loads go through a single resolver that abstracts away the identifier type (Farcaster, GitHub, wallet, Talent UUID). Common logic is extracted into shared services for maintainability and testability.
- **Leaderboard UX:** The current user is always pinned to the top of the leaderboard. Special badges (e.g., "New Builder", "Hall of Fame") can be used to highlight user status and achievements.
- **Advanced Search Callout:** The explore page includes a blue callout for advanced search, linking to Talent Index.
- **Documentation:** All unique or opinionated decisions are documented for clarity; best practices are referenced but not over-explained.
// - **Profile Modal:** Viewing another user's profile (from Search or Leaderboard) opens a modal overlay (bottom sheet on mobile, dialog on desktop) rather than navigating away from the current context.

## DESIGN PRINCIPLES

- **Navigation:** Mobile-first with a fixed top header and bottom navigation bar. 
- **Modals:** All secondary flows (menus, about, eligibility, score breakdown, profile overlays, etc.) are implemented responsively: draggable bottom sheets on mobile (with drag handle), centered dialogs on desktop (sm+ breakpoint).
- **Color System:** Use a minimal, neutral palette with strategic brand color application for clarity and focus.
  - **Semantic Colors**: Always prefer semantic color classes (e.g., text-muted-foreground, bg-muted) over hardcoded colors for better theme support and consistency.
  - **Theme Support**: All components should work seamlessly in both light and dark themes by using semantic color classes.
  - **Brand Integration**: Reserve specific brand colors for intentional moments while maintaining semantic defaults.
  - **Documentation**: See `docs/design-system.md` for app-specific color values and usage patterns.

### Color Usage Standards

**1. Semantic-First Approach:**
```tsx
// ✅ GOOD: Use semantic classes for theme consistency
<div className="bg-muted text-muted-foreground border-border">
<p className="text-foreground">Main content</p>
<span className="text-muted-foreground">Secondary text</span>
```

**2. Brand-Specific Moments:**
```tsx
// ✅ GOOD: Use specific colors for intentional brand elements
<div className="bg-brand-50">Brand moments (rewards, CTAs)</div>
<div className="border-brand-200 bg-brand-50 text-brand-700">Brand callouts</div>
```

**3. Consistent Component Patterns:**
- **Data Visualization**: Use consistent color mapping across similar components
- **Interactive Elements**: Prefer semantic variants over custom colors
- **Brand Elements**: Reserve specific colors for intentional brand moments

**4. Avoid:**
```tsx
// ❌ BAD: Hardcoded colors instead of semantic classes
<div className="text-gray-500 bg-gray-100 border-gray-200">

// ❌ BAD: Inconsistent color usage across components
<div className="bg-random-color">
```

- **Typographic Hierarchy:** Typography follows a clear, documented scale for all text elements, ensuring visual consistency and fast building.
- **Mobile:** The mobile experience is the primary focus, with all layouts and interactions optimized for touch and small screens.
- **Desktop:** The desktop experience is a minimal adaptation: content is centered with max width (all pages use `max-w-xl mx-auto w-full p-4`), bottom nav is hidden, and modals become centered dialogs.
- **Responsive Modals:** All modals detect screen size (640px breakpoint) and render as bottom sheets on mobile or dialogs on desktop automatically.
- **Show More/Less:** Long text (e.g., AI summaries) is truncated with a toggle for expanding/collapsing content.
- **Progress Bars:** Progress bars are used throughout the app to visualize activity, scores, and reward progress, and are always minimal and thin.
- **Notifications & Feedback Patterns:** Prefer inline status feedback and educational modals over disruptive toast notifications. Show contextual information directly near relevant elements, use bottom sheets for comprehensive guidance.
- **User Education:** When users complete complex actions (like logout), provide educational content about system behavior rather than hiding complexity behind simple confirmations.

## TECHNICAL ARCHITECTURE

### Core Architecture Pattern: Modular Data Flow

**CRITICAL**: This app follows a **strict modular architecture** where:

```
External APIs → API Clients → Services → API Routes → Hooks → Pure UI Components
```

#### Layer Responsibilities:
1. **API Clients Layer** (lib/): Abstracted external API interactions with shared utilities
2. **Services Layer**: Domain-specific business logic and data transformations
3. **API Routes Layer**: Server-side endpoints that call services (Next.js API routes)
4. **Hooks Layer**: All data fetching, caching, and state management via API calls
5. **Components Layer**: Pure UI components that receive data via props only

#### Client-Server Separation Rules

**FUNDAMENTAL PRINCIPLE**: Strict separation between client-side and server-side code is mandatory.

**REQUIRED PATTERN**:
```
❌ PROHIBITED: Client Hook → Direct Service Import → External API
✅ REQUIRED: Client Hook → API Route → Service → External API
```

**Architecture Rules**:
- Client-side code (hooks, components) NEVER directly imports server-side services
- All data fetching flows through API routes (`/api/*`)
- Server-side packages (Node.js SDKs) only exist in `/api` routes and `/services`
- This ensures clean separation, smaller client bundles, and prevents runtime errors

### Product Analytics

- **Analytics Platform**: PostHog (EU region) integrated for user behavior tracking and product insights
- **User Identification**: Automatic user identification across all authentication contexts (Privy, Farcaster, Dev mode)
- **Event Tracking Standard**: All new features should include relevant PostHog events for user behavior analysis
- **Implementation Pattern**: Use `usePostHog()` hook with optional chaining (`posthog?.capture()`) - never direct imports
- **Event Naming**: Descriptive names with context (e.g., `creator_category_selected` not `click`)
- **Error Resilience**: App functionality independent of PostHog availability
- **Event Schema**: Document event properties and user properties in `/docs/posthog-integration.md`

### Data Fetching Principles

- **Hook Interface Standard**: All hooks return `{data, loading, error}` consistently
- **Hook Naming**: `useProfile*` for profile data, `useLeaderboard*` for leaderboard, `useUser*` for current user
- **Caching Strategy**: Profile data (5min), expensive computations (30min), leaderboard (5min with refresh)
- **Error Handling**: Graceful fallbacks with skeleton loaders, no crashes

### Component Interface Standards

- **Page Components**: Accept only routing/identifier props, use hooks for data
- **UI Components**: Pure functions receiving all data via props, no API calls
- **Reusability**: Default to shadcn/ui, create custom components only for unique UX needs

### User Resolution System

- **Canonical ID**: Talent UUID is the primary identifier for all users
- **Multi-identifier Support**: Users found via Farcaster, GitHub, wallet, or UUID
- **Universal Resolver**: Single abstraction handles all identifier types
- **Server-Side Resolution**: Server components use direct API calls, client components use hooks with caching
- **Clear Separation**: Server and client resolvers are separate to prevent architecture violations
- **Unified Authentication**: Automatic detection between Farcaster (MiniApp) and Dynamic (browser) contexts with seamless user experience
- **Development Mode**: Environment-based authentication bypass implemented at the lowest level for minimal impact and maximum development speed

### Tech Stack & Performance

- **Framework**: Next.js 14 (App Router), React 18+, shadcn/ui, Tailwind CSS
- **Authentication**: Farcaster SDK + Privy SDK (wallet-only authentication) with development mode bypass
- **State Management**: React hooks + context (no external state library)
- **Caching**: Custom hook-based caching with appropriate TTLs
- **TypeScript**: Strict mode with comprehensive typing throughout

## TAXONOMY

- **User**: An authenticated individual using the app, identified by a Talent UUID.
- **Talent UUID**: The proprietary, canonical unique identifier for a user, created by Talent Protocol.
- **Account**: An external account associated with a user, such as a wallet address, Farcaster, or GitHub.
- **Fname**: The Farcaster username (distinct from GitHub username, which remains as github_username for clarity).
- **Account Identifier**: A unique value for an account (e.g., FID, fname, wallet address, github_username).
- **Account Source**: The platform or service from which an account originates (e.g., Farcaster, ENS, GitHub).
- **Profile**: A Talent Protocol user's public information, which may be viewed by others in the app.
- **Handle**: The human-readable, unique identifier shown publicly for each user (e.g., Farcaster fname, ENS) and used in public URLs.
- **Credential**: A Talent API data point scored in the context of a Score, representing a verifiable achievement or attribute.
- **Score**: The sum of all Credentials, representing a user's overall builder status.
- **Data Point**: Any individual metric or value used to calculate Credentials and Score.
- **Session**: The current authenticated context for a user, including authentication method and active accounts.
- **API Client**: An abstracted class that provides a unified interface to external APIs with built-in error handling, validation, and retry logic.
- **Hook**: A custom React hook that encapsulates data fetching, caching, and business logic.
- **Service**: A module that handles domain-specific business logic and data transformations.
- **Component**: A pure UI component that receives data via props and handles only presentation logic.
- **Readable Value**: The user-friendly, formatted value of a data point, suitable for display (e.g., '2.67', '8.35K').
- **Clean Value**: The numeric or string value extracted from raw data, stripped of units or formatting used for calculations.
- **UOM (Unit of Measure)**: The unit associated with a value (e.g., 'ETH', 'collectors', 'posts'), displayed alongside the readable value. 