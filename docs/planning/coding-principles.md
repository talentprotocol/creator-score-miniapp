# Creator Score App – Architecture & Core Principles

## PRODUCT PRINCIPLES

- **Principle:** Optimize for fast, consistent building by "vibe coders" - reusability over customization.
- **User Identification:** Users identified by canonical Talent UUID internally, accessible via Farcaster, GitHub, or wallet.
- **Dual Authentication:** Automatic environment detection enables Farcaster authentication in MiniApps and Dynamic wallet authentication in browsers, with wallet addresses as public identifiers for reputation scoring.
- **Development Mode:** `NEXT_PUBLIC_DEV_MODE=true` bypasses authentication flows with hardcoded wallet address for rapid UI development.
- **Shared Utilities:** All user lookups and profile loads go through a single resolver that abstracts identifier types into Talent UUID. Common logic extracted into shared services for maintainability and testability.
- **Documentation:** All unique or opinionated decisions documented for clarity; best practices referenced but not over-explained.
- **Talent API Data Usage:** Always ignore `points_calculation_logic` in Talent API responses and use only top-level credential fields (slug, points, readable_value, uom, max_score, etc.) for all logic and display.

### Typography Usage

- Always use `components/ui/typography.tsx` to set typography variants (size, weight, color). Avoid ad-hoc Tailwind text classes in components. This ensures semantic consistency and centralized control.

## DESIGN PRINCIPLES

- **Navigation:** Mobile-first with fixed top header and bottom navigation bar.
- **Modals:** All secondary flows implemented responsively: draggable bottom sheets on mobile (with drag handle), centered overlay dialogs on desktop.
- **Color System:** Use minimal, neutral palette with strategic brand color application.
  - **Semantic Colors**: Prefer semantic color classes (e.g., `text-muted-foreground`, `bg-muted`) over hardcoded colors for theme support and consistency.
  - **Theme Support**: All components work seamlessly in light and dark themes using semantic color classes.
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

**3. Avoid:**
```tsx
// ❌ BAD: Hardcoded colors instead of semantic classes
<div className="text-gray-500 bg-gray-100 border-gray-200">
// ❌ BAD: Inconsistent color usage across components
<div className="bg-random-color">
```

- **Typographic Hierarchy:** Typography follows clear, documented scale for all text elements, ensuring visual consistency and fast building.
- **Mobile:** Mobile experience is primary focus, with all layouts and interactions optimized for touch and small screens.
- **Desktop:** Desktop experience is minimal adaptation: content centered with max width (`max-w-xl mx-auto w-full p-4`), bottom nav hidden, modals become centered dialogs.
- **Responsive Modals:** All modals detect screen size (sm+ breakpoint) and render as bottom sheets on mobile or dialogs on desktop automatically.
- **Show More/Less:** Long text (e.g., AI summaries) truncated with toggle for expanding/collapsing content.
- **Progress Bars:** Progress bars used throughout app to visualize activity, scores, and reward progress, always minimal and thin.
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

- **Analytics Platform**: PostHog (EU region) used for user behavior tracking and product insights across all apps
- **Event Tracking**: All new features include relevant PostHog events for user behavior analysis
- **Error Resilience**: App functionality remains independent of PostHog availability
- **Co-location**: Analytics tracking should be co-located with the action being tracked to ensure consistent implementation
- **Systematic Approach**: Use established patterns and hooks to prevent inconsistent analytics implementation across features

### Data Fetching Principles

- **Hook Interface Standard**: All hooks return `{data, loading, error}` consistently
- **Hook Naming**: `useProfile*` for profile data, `useLeaderboard*` for leaderboard, `useUser*` for current user
- **Caching Location**: Caching must be implemented in services using `unstable_cache`, NOT in API routes. API routes handle HTTP concerns only, while services handle business logic and caching.
- **Caching Strategy**: Profile data (5min), expensive computations (30min), leaderboard (5min with refresh)
- **Error Handling**: Graceful fallbacks with skeleton loaders, no crashes

### Component Interface Standards

- **Page Components**: Accept only routing/identifier props, use hooks for data
- **UI Components**: Pure functions receiving all data via props, no API calls
- **Reusability**: Default to shadcn/ui, create custom components only for unique UX needs

### Content Management Principles

- **Content-Logic Separation**: Always separate content (copy, labels, descriptions) from business logic (computation, validation, data processing) by storing user-facing text in dedicated configuration files.

### User Resolution System

- **Canonical ID**: Talent UUID is the primary identifier for all users
- **Universal Resolver**: Single abstraction handles all identifier types (Farcaster, GitHub, wallet, UUID)
- **Architecture Separation**: Server components use direct API calls, client components use hooks with caching
- **Development Mode**: Environment-based authentication bypass for rapid development

### Tech Stack & Performance

- **Framework**: Next.js 14 (App Router), React 18+, shadcn/ui, Tailwind CSS
- **Authentication**: Farcaster SDK + Privy SDK (wallet-only authentication) with development mode bypass
- **State Management**: React hooks + context (no external state library)
- **Caching**: Custom hook-based caching with appropriate TTLs
- **TypeScript**: Strict mode with comprehensive typing throughout

## TAXONOMY

### User & Identity
- **User**: An authenticated individual using the app, identified by a Talent UUID.
- **Talent UUID**: The proprietary, canonical unique identifier for a user, created by Talent Protocol.
- **Account**: An external account associated with a user, such as a wallet address, Farcaster, or GitHub.
- **Account Identifier**: A unique value for an account (e.g., FID, fname, wallet address, github_username).
- **Account Source**: The platform or service from which an account originates (e.g., Farcaster, ENS, GitHub).
- **Profile**: A Talent Protocol user's public information, which may be viewed by others in the app.
- **Handle**: The human-readable, unique identifier shown publicly for each user (e.g., Farcaster fname, ENS) and used in public URLs.
- **Session**: The current authenticated context for a user, including authentication method and active accounts.

### Talent API Concepts
- **Credential**: A Talent API data point scored in the context of a Score, representing a verifiable achievement or attribute.
- **Score**: The sum of all Credentials, representing a user's overall builder status.
- **Data Point**: Any individual metric or value used to calculate Credentials and Score.

### Data Formatting
- **Readable Value**: The user-friendly, formatted value of a data point, suitable for display (e.g., '2.67', '8.35K') coming from the Talent API.
- **UOM (Unit of Measure)**: The unit associated with a value (e.g., 'ETH', 'collectors', 'posts'), displayed alongside the readable value.

### Architecture Components
- **API Client**: An abstracted class that provides a unified interface to external APIs with built-in error handling, validation, and retry logic.
- **Service**: A module that handles domain-specific business logic and data transformations.
- **Hook**: A custom React hook that encapsulates data fetching, caching, and business logic.
- **Component**: A pure UI component that receives data via props and handles only presentation logic.