# File Structure Framework

## Core Principles
- Modular data flow: External APIs → Services → API Routes → Hooks → UI Components
- Client-server separation: No direct service imports in client code
- Pure UI components: Data via props only, no API calls

## Turborepo Structure
```
turborepo/
├── apps/
│   └── [app-name]/            # Individual applications
│       ├── app/               # Next.js App Router
│       ├── components/        # App-specific components
│       ├── hooks/            # App-specific hooks
│       └── lib/              # App-specific utilities
├── packages/
│   ├── ui/                   # Shared UI components
│   ├── config/               # Shared configurations
│   ├── types/                # Shared TypeScript types
│   └── utils/                # Shared utilities
```

## App-Level Structure
```
app-name/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   ├── [feature]/            # Feature pages
│   ├── services/             # Server-side services
│   └── layout.tsx
├── components/
│   └── [feature]/            # Feature components
├── hooks/                    # Custom React hooks
├── lib/                      # Utilities & config
├── public/                   # Static assets
└── docs/                     # Documentation
```

## Naming Conventions
- **Files**: kebab-case (`user-profile/`, `api-client.ts`)
- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions/Hooks**: camelCase (`useUserProfile`)
- **Services**: `[Domain]Service` (`UserService`)
- **Hooks**: `use[Feature]Data` (`useProfileData`)

## Architecture Patterns
- **Service Layer**: Business logic in `/app/services/`
- **Hook Pattern**: Data fetching in `/hooks/api/`
- **Component Pattern**: Pure UI in `/components/[feature]/`
- **Import Order**: React → Third-party → Internal → Relative

## Configuration
- Environment: `lib/config/env.ts`
- Features: `lib/config/features.ts`
- Constants: `lib/config/constants.ts`

## Key Decisions
- Services: Server-side only (`/app/services/`)
- API Clients: Shared utilities (`/lib/api/clients/`)
- Type Safety: Strict TypeScript, interfaces over types
- Error Handling: `{ data, error }` pattern

## References
- [Pattern Examples](./patterns/)
- [Component Guidelines](./components/)
- [API Documentation](./api/) 