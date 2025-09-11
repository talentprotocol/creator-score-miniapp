# Creator Score App – Architecture & Core Principles

## CORE PRINCIPLES
- Modular data flow: External APIs → Services → API Routes → Hooks → UI Components
- Client-server separation: No direct service imports in client code
- Pure UI components: Data via props only, no API calls

## TECHNICAL ARCHITECTURE

### Core Architecture Pattern: Modular Data Flow

**CRITICAL**: This app follows a **strict modular architecture** where:

```
External APIs → API Clients → Services → Route Handlers → Hooks → Pure UI Components
```

#### Layer Responsibilities:

1. **API Clients Layer** (lib/): Abstracted external API interactions with shared utilities
2. **Services Layer**: Domain-specific business logic and data transformations (consumed by Server Components and Route Handlers)
3. **Route Handlers Layer**: Server-side HTTP endpoints in `app/api/*` that call services; consumed by browsers/clients, webhooks, and external integrations
4. **Hooks Layer**: Client-side data fetching and state management via Route Handlers (no direct service imports)
5. **Components Layer**: Pure UI components that receive data via props only; Server Components prefer calling services directly

#### Client-Server Separation Rules

**FUNDAMENTAL PRINCIPLE**: Strict separation between client-side and server-side code is mandatory.

**REQUIRED PATTERN**:

```
❌ PROHIBITED: Client Hook → Direct Service Import → External API
✅ SERVER:     Route Handler → Service → External API
✅ CLIENT:     Client Hook → Fetch → Route Handler → Service → External API
```

**Architecture Rules**:

- Client-side code (hooks, components) NEVER directly imports server-side services
- Client-side data fetching flows through Route Handlers (`app/api/*`) or Server Actions; Server Components call services directly
- Server-only packages (Node.js SDKs, secrets) exist only in server code (services and Route Handlers)
- Use `server-only` to guard server modules and avoid accidental client bundling
- This ensures clean separation, smaller client bundles, and prevents runtime errors

### Next.js App Router Best Practices

- Default to Server Components; mark Client Components explicitly with `use client`
- Keep server-only code out of client bundles using `server-only` and by isolating services under `lib/`/`app/api/`
- use Route Handlers for browser-accessible reads, mutations, and webhooks
- Use `error.tsx` and `loading.tsx` per route segment; leverage Suspense for progressive rendering
- Define page metadata via `generateMetadata`; avoid client-only SEO hacks

### Product Analytics

Use posthog to keep track of new features usage. Include event tracking on the action to track to ensure consistent implementation and easyness to remove.

### Data Fetching Principles

- **Hook Interface Standard**: All client hooks return `{data, loading, error}` consistently
- **Hook Naming**: `useProfile*` for profile data, `useLeaderboard*` for leaderboard, `useUser*` for current user (etc..)
- **Server-Side URL Resolution**: Always use absolute URLs in server contexts; relative URLs fail in SSR/API routes/build-time
- **Caching Location**:
  - Server Components: prefer `fetch` with `next: { revalidate, tags }`
  - Services: use `unstable_cache` for heavy/shared computations
  - Route Handlers: set `export const revalidate` or response headers and use `revalidateTag` after mutations/data changes
- **Cache Tags & TTLs**: Use tags like `profile:${uuid}`, `leaderboard:global`. Define TTLs in code near services (constants) and prefer tag-based invalidation over long TTLs
- **Error Handling**: Graceful fallbacks with skeleton loaders; segment-level `error.tsx` for recoverability

### Component Interface Standards

- **Page Components**: Accept only routing/identifier props, use hooks for data
- **UI Components**: Pure functions receiving all data via props, no API calls
- **Reusability**: Default to shadcn/ui, create custom components only for unique UX needs


### User Resolution System

- Use `Talent UUID` as the canonical user ID and resolve identifiers (Farcaster, wallet, GitHub, ...) via `lib/user-resolver.ts`. 
- Mini apps detect user context via Farcaster SDK and convert FID to Talent UUID, while browsers use wallet authentication to convert address into Talent UUID.


### Type Organization

- **Types**: All TypeScript types organized in `lib/types/` by domain.

### Tech Stack & Performance

- **Framework**: Next.js 15 (App Router), React 18+, shadcn/ui, Tailwind CSS
- **Authentication**: Farcaster SDK + Privy SDK (wallet-only authentication) with development mode bypass
- **State Management**: React hooks + context (no external state library)
- **Caching**: Next.js caching via `fetch` revalidation/tags and `unstable_cache`; avoid client-side caches unless necessary
- **TypeScript**: Strict mode with comprehensive typing throughout

### External API Standards

- **Security**: Never expose secrets to the client; mask sensitive data in logs; verify webhook signatures
- **Observability**: Structured logs with `{ provider, operation, requestId, status, durationMs }`; emit basic latency/error metrics
- **Talent API Data Usage:** Always ignore `points_calculation_logic` in Talent API responses and use only top-level credential fields (slug, points, readable_value, uom, max_score, etc.) for all logic and display.

### Caching & Revalidation Model

- Prefer `fetch` with `next: { revalidate, tags }` in Server Components; use tag-based invalidation after writes
- Wrap heavy services with `unstable_cache` to share results across routes/renderings
- Use `revalidateTag` in mutation Route Handlers to invalidate related reads

### Design Principles

- Mobile-first and responsive. See `docs/planning/design-system.md` for typography, color, layout, and component patterns.

### Content Management Principles

- **Content-Logic Separation**: Always separate content (copy, labels, descriptions) from business logic (computation, validation, data processing).
