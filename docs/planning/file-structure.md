# File Structure Framework for Future Apps

## Core Architecture Principles

### 1. Modular Data Flow
```
External APIs → API Clients → Services → API Routes → Hooks → Pure UI Components
```

### 2. Client-Server Separation
- **REQUIRED**: Client-side code NEVER directly imports server-side services
- **PATTERN**: Hook → API Route → Service → External API
- **BENEFIT**: Clean separation, smaller bundles, prevents runtime errors

### 3. Pure UI Components
- All components receive data via props only
- No API calls in components
- Business logic handled by hooks and services

## File Structure Template

```plaintext
app-name/
├── app/                                   # Next.js App Router
│   ├── api/                               # API route handlers
│   │   ├── [domain]/                      # Grouped by domain
│   │   │   ├── route.ts                   # Main endpoint
│   │   │   ├── [subdomain]/               # Nested endpoints
│   │   │   │   └── route.ts
│   │   │   └── webhook/                   # Webhook handlers
│   │   │       └── route.ts
│   │   └── middleware.ts                  # API middleware
│   ├── [identifier]/                      # Dynamic routes
│   │   └── page.tsx                       # Dynamic page
│   ├── [feature]/                         # Feature pages
│   │   ├── page.tsx                       # Main page
│   │   ├── loading.tsx                    # Loading UI
│   │   ├── error.tsx                      # Error boundary
│   │   └── not-found.tsx                  # 404 page
│   ├── services/                          # Server-side services
│   │   ├── types.ts                       # Shared interfaces
│   │   ├── [domain]Service.ts             # Domain-specific services
│   │   ├── [domain]Service.ts
│   │   └── index.ts                       # Service exports
│   ├── layout.tsx                         # Root layout
│   ├── page.tsx                           # Home page
│   ├── providers.tsx                      # Context providers
│   ├── globals.css                        # Global styles
│   └── theme.css                          # Theme variables
│
├── components/                            # Pure UI components
│   ├── ui/                                # shadcn/ui primitives
│   │   ├── [component].tsx                # Base components
│   │   ├── [component].tsx
│   │   └── index.ts                       # Component exports
│   ├── common/                            # Shared utility components
│   │   ├── ErrorBoundary.tsx              # Error boundary wrapper
│   │   ├── LoadingSpinner.tsx             # Loading states
│   │   ├── EmptyState.tsx                 # Empty states
│   │   └── index.ts                       # Common exports
│   ├── [feature]/                         # Feature-specific components
│   │   ├── [ComponentName].tsx            # Main component
│   │   ├── [ComponentName].tsx            # Sub-components
│   │   └── index.ts                       # Feature exports
│   ├── [feature]/
│   │   ├── [ComponentName].tsx
│   │   └── index.ts
│   ├── layout/                            # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   └── index.ts
│   ├── forms/                             # Form components
│   │   ├── [FormName].tsx
│   │   └── index.ts
│   └── modals/                           # Modal components
│       ├── [ModalName].tsx
│       └── index.ts
│
├── hooks/                                # Custom React hooks
│   ├── api/                              # API-related hooks
│   │   ├── use[Feature]Data.ts           # Data fetching hooks
│   │   ├── use[Feature]Mutation.ts       # Mutation hooks
│   │   └── index.ts
│   ├── ui/                               # UI-related hooks
│   │   ├── use[Feature]State.ts          # State management hooks
│   │   ├── use[Feature]Interaction.ts    # Interaction hooks
│   │   └── index.ts
│   ├── auth/                             # Authentication hooks
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   └── index.ts
│   └── index.ts                          # Hook exports
│
├── lib/                                  # Shared utilities
│   ├── api/                              # API utilities
│   │   ├── clients/                      # API clients
│   │   │   ├── [Service]Client.ts        # External service clients
│   │   │   └── index.ts
│   │   ├── utils.ts                      # API utilities
│   │   ├── types.ts                      # API types
│   │   └── index.ts
│   ├── auth/                             # Authentication utilities
│   │   ├── providers/                    # Auth providers
│   │   │   ├── [Provider].ts
│   │   │   └── index.ts
│   │   ├── resolvers/                    # User resolvers
│   │   │   ├── [Resolver].ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── cache/                            # Caching utilities
│   │   ├── redis.ts
│   │   ├── memory.ts
│   │   └── index.ts
│   ├── config/                           # Configuration
│   │   ├── constants.ts                  # App constants
│   │   ├── env.ts                        # Environment config
│   │   ├── features.ts                   # Feature flags
│   │   └── index.ts
│   ├── utils/                            # Utility functions
│   │   ├── formatting.ts                 # Formatting utilities
│   │   ├── validation.ts                 # Validation utilities
│   │   ├── date.ts                       # Date utilities
│   │   ├── math.ts                       # Math utilities
│   │   └── index.ts
│   ├── types/                            # Global types
│   │   ├── api.ts                        # API types
│   │   ├── auth.ts                       # Auth types
│   │   ├── ui.ts                         # UI types
│   │   └── index.ts
│   └── index.ts                          # Main exports
│
├── styles/                               # Styling
│   ├── components/                       # Component styles
│   │   ├── [component].css
│   │   └── index.css
│   ├── themes/                           # Theme definitions
│   │   ├── light.css
│   │   ├── dark.css
│   │   └── index.css
│   └── globals.css                       # Global styles
│
├── public/                               # Static assets
│   ├── images/                           # Image assets
│   │   ├── icons/                        # Icon assets
│   │   ├── logos/                        # Logo assets
│   │   └── backgrounds/                  # Background images
│   ├── fonts/                            # Font files
│   └── manifest.json                     # PWA manifest
│
├── tests/                                # Test files
│   ├── unit/                             # Unit tests
│   │   ├── components/                   # Component tests
│   │   ├── hooks/                        # Hook tests
│   │   ├── services/                     # Service tests
│   │   └── utils/                        # Utility tests
│   ├── integration/                      # Integration tests
│   │   ├── api/                          # API tests
│   │   └── e2e/                          # End-to-end tests
│   └── fixtures/                         # Test data
│
├── docs/                                 # Documentation
│   ├── logs/                             # Integration & decision logs
│   │   ├── [integration]-integration.md  # Concise implementation summaries
│   │   ├── [decision]-decision.md        # Key development decisions
│   │   └── [feature]-implementation.md   # Feature implementation logs
│   ├── architecture/                     # Architecture docs
│   │   ├── principles.md                 # Core principles
│   │   ├── patterns.md                   # Design patterns
│   │   └── decisions.md                  # Architecture decisions
│   ├── api/                              # API documentation
│   │   ├── endpoints.md                  # API endpoints
│   │   ├── types.md                      # API types
│   │   └── examples.md                   # Usage examples
│   ├── components/                       # Component docs
│   │   ├── ui.md                         # UI components
│   │   ├── forms.md                      # Form components
│   │   └── modals.md                     # Modal components
│   └── guides/                           # Development guides
│       ├── setup.md                      # Setup guide
│       ├── contributing.md               # Contributing guide
│       └── deployment.md                 # Deployment guide
│
├── scripts/                              # Build/deployment scripts
│   ├── build/                            # Build scripts
│   ├── deploy/                           # Deployment scripts
│   └── utils/                            # Utility scripts
│
├── .github/                              # GitHub workflows
│   └── workflows/                        # CI/CD workflows
│
├── package.json                          # Dependencies and scripts
├── package-lock.json                     # Lock file
├── tsconfig.json                         # TypeScript config
├── tailwind.config.ts                    # Tailwind config
├── next.config.mjs                       # Next.js config
├── postcss.config.mjs                    # PostCSS config
├── eslint.config.js                      # ESLint config
├── prettier.config.js                    # Prettier config
├── jest.config.js                        # Jest config
├── .env.example                          # Environment template
├── .gitignore                            # Git ignore rules
├── README.md                             # Project documentation
└── CHANGELOG.md                          # Version history
```

## Naming Conventions

### Files and Folders
- **kebab-case**: For folders and file names (`user-profile/`, `api-client.ts`)
- **PascalCase**: For React components (`UserProfile.tsx`, `ApiClient.ts`)
- **camelCase**: For functions, variables, and hooks (`useUserProfile`, `apiClient`)

### Component Naming
- **Feature components**: `[Feature][Component]` (e.g., `ProfileHeader`, `LeaderboardRow`)
- **UI components**: Generic names (e.g., `Button`, `Card`, `Modal`)
- **Layout components**: Descriptive names (e.g., `Header`, `Footer`, `Navigation`)

### Hook Naming
- **Data hooks**: `use[Feature]Data` (e.g., `useProfileData`, `useLeaderboardData`)
- **State hooks**: `use[Feature]State` (e.g., `useModalState`, `useFormState`)
- **Action hooks**: `use[Feature]Action` (e.g., `useUserAction`, `useApiAction`)

### Service Naming
- **Domain services**: `[Domain]Service` (e.g., `UserService`, `AuthService`)
- **API clients**: `[Service]Client` (e.g., `TalentApiClient`, `NeynarClient`)

## Architecture Patterns

### 1. Service Layer Pattern
```typescript
// app/services/types.ts
export interface [Domain]Data {
  // Shared types
}

// app/services/[domain]Service.ts
export class [Domain]Service {
  async get[Resource](): Promise<[Domain]Data> {
    // Business logic
  }
}

// app/api/[domain]/route.ts
import { [Domain]Service } from '@/app/services/[domain]Service';

export async function GET() {
  const service = new [Domain]Service();
  const data = await service.get[Resource]();
  return Response.json(data);
}
```

### 2. Hook Pattern
```typescript
// hooks/api/use[Feature]Data.ts
export function use[Feature]Data(id: string) {
  const [data, setData] = useState<[Feature]Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/[feature]?id=${id}`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  return { data, loading, error };
}
```

### 3. Component Pattern
```typescript
// components/[feature]/[ComponentName].tsx
interface [ComponentName]Props {
  data: [Feature]Data;
  onAction?: (action: string) => void;
}

export function [ComponentName]({ data, onAction }: [ComponentName]Props) {
  return (
    <div>
      {/* Pure UI logic only */}
    </div>
  );
}
```

## Configuration Files

### Environment Configuration
```typescript
// lib/config/env.ts
export const env = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_DEV_MODE: process.env.NEXT_PUBLIC_DEV_MODE === 'true',
} as const;
```

### Feature Flags
```typescript
// lib/config/features.ts
export const features = {
  ENABLE_NEW_UI: process.env.NEXT_PUBLIC_ENABLE_NEW_UI === 'true',
  ENABLE_BETA_FEATURES: process.env.NEXT_PUBLIC_ENABLE_BETA_FEATURES === 'true',
} as const;
```

### Constants
```typescript
// lib/config/constants.ts
export const CACHE_DURATIONS = {
  PROFILE_DATA: 5 * 60 * 1000, // 5 minutes
  SCORE_DATA: 30 * 60 * 1000,  // 30 minutes
  LEADERBOARD: 5 * 60 * 1000,  // 5 minutes
} as const;

export const API_ENDPOINTS = {
  TALENT_API: '/api/talent',
  NEYNAR_API: '/api/neynar',
} as const;
```

## Key Decisions

### Services Location
- **Services stay in `/app/services/`** - Server-side only execution
- **API clients in `/lib/api/clients/`** - Shared utilities
- **Enforces client-server separation** at file system level

### Import Organization
```typescript
// 1. React and Next.js imports
import React from 'react';
import { useRouter } from 'next/router';

// 2. Third-party library imports
import { useState, useEffect } from 'react';

// 3. Internal imports (absolute paths)
import { useProfileData } from '@/hooks/api/useProfileData';
import { ProfileHeader } from '@/components/profile/ProfileHeader';

// 4. Relative imports
import { utils } from './utils';
```

### Type Safety
- **Strict TypeScript**: Enable strict mode in `tsconfig.json`
- **Interface over types**: Use interfaces for object shapes
- **Type exports**: Export types from dedicated type files

### Error Handling
```typescript
// Consistent error handling pattern
try {
  const data = await fetchData();
  return { data, error: null };
} catch (err) {
  console.error('Error fetching data:', err);
  return { 
    data: null, 
    error: err instanceof Error ? err.message : 'Unknown error' 
  };
}
```

## Benefits

1. **Scalability**: Clear separation allows for easy scaling
2. **Maintainability**: Organized code is easier to maintain
3. **Testability**: Isolated components and services are easier to test
4. **Reusability**: Modular components can be reused across features
5. **Performance**: Proper separation enables better optimization
6. **Developer Experience**: Clear structure improves development speed
7. **Team Collaboration**: Consistent patterns help team members work together

This framework provides a solid foundation for building scalable, maintainable applications while following established best practices and patterns. 