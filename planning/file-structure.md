# Desired File Structure for Modular Creator Score Miniapp

Below is the recommended file and folder structure for the new, modularized repo. This structure is designed for clarity, modularity, and scalability, following the principles in the migration plan and architecture docs.

```plaintext
creator-score-miniapp/
  app/                       # Next.js app directory
    api/                     # API route handlers 
    [identifier]/            # Dynamic profile routes
    leaderboard/             # Leaderboard page
    settings/                # Settings page
    layout.tsx               # App layout
    globals.css              # Global styles
    theme.css                # Theme overrides
    providers.tsx            # Context providers
    page.tsx                 # Root redirect or landing
  components/                # Pure UI components only (no logic)
    profile/                 # Profile-related UI components
    leaderboard/             # Leaderboard UI components
    navigation/              # Header, nav, modals
    settings/                # Settings UI components
    ui/                      # shadcn/ui primitives
  hooks/                     # Custom React hooks 
    useProfileData.ts        # Example: fetches profile data
    useScoreData.ts          # Example: fetches score data
    ...
  services/                  # All API/data-fetching logic
    talentService.ts         # Talent Protocol API logic
    neynarService.ts         # Neynar API logic
    ...
  lib/                       # Shared utilities, constants, and abstractions
    user-resolver.ts         # Shared user resolver abstraction
    constants.ts             # App-wide constants
    utils.ts                 # Utility/helper functions
    notification.ts          # Notification helpers
    ...
  public/                    # Static assets (images, icons, etc.)
    logo.png
    ...
  planning/                  # Planning docs, architecture, migration plan
    migration-plan.md
    architecture.md
    desired-file-structure.md
    ...
  scripts/                   # One-off scripts 
    ...
  package.json
  tsconfig.json
  tailwind.config.ts
  next.config.mjs
  README.md
```

**Notes:**
- All UI components in `components/` should be pure and reusable, with no API calls or business logic.
- All data fetching and business logic should be in `hooks/` and `services/`.
- Shared utilities and constants go in `lib/`.
- Use `planning/` for all migration, architecture, and process docs.
- Organize `app/` for Next.js App Router conventions. 