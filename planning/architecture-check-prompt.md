# Architectural Violation Check: Client-Side Service Imports

## Critical Issue to Check

During the ProfileTabs refactoring, we discovered a **major architectural violation** where React hooks were directly importing and calling server-side services, causing runtime errors like "NeynarClient can only be used server-side".

## What to Check For

### 1. Scan All React Hooks for Direct Service Imports

Check all files in `hooks/` directory for imports like:
```typescript
// ❌ VIOLATION: Direct service imports in client-side hooks
import { neynarService } from '../services/neynarService'
import { scoresService } from '../app/services/scoresService'
import { credentialsService } from '../app/services/credentialsService'
// ... any other service imports
```

### 2. Look for Direct Service Calls in Hooks

Search for patterns like:
```typescript
// ❌ VIOLATION: Direct service calls in useEffect or hook functions
const data = await neynarService.getUserByFid(fid)
const scores = await scoresService.getCreatorScore(uuid)
const credentials = await credentialsService.getCredentials(uuid)
```

### 3. Check for Server-Side Only Dependencies

Look for imports of Node.js-specific packages in client-side code:
```typescript
// ❌ VIOLATION: Server-side packages in client code
import { NeynarClient } from '@neynar/sdk'
import Redis from 'ioredis'
// ... any Node.js-only packages
```

## Files to Specifically Check

Based on our codebase, check these hooks for violations:

### High Priority (Known Issues)
- `hooks/useUserCreatorScore.ts` - ✅ FIXED in migration branch
- `hooks/useProfileCreatorScore.ts` - ✅ FIXED in migration branch

### Medium Priority (Likely Issues)
- `hooks/useProfileSocialAccounts.ts` - May import `socialAccountsService`
- `hooks/useProfileCredentials.ts` - May import `credentialsService`
- `hooks/useLeaderboard.ts` - May import `leaderboardService`
- `hooks/useLeaderboardStats.ts` - May import `leaderboardService`
- `hooks/useProfileTotalEarnings.ts` - May import services for ETH calculations

### Low Priority
- `hooks/useUserNavigation.ts` - Likely safe (navigation only)
- `hooks/useProfileHeaderData.ts` - Check for service imports
- `hooks/useProfileWalletAddresses.ts` - Check for service imports

## How to Fix Violations

### Pattern: Replace Direct Service Calls with API Routes

❌ **WRONG** (Direct service import):
```typescript
import { scoresService } from '../app/services/scoresService'

const { data, loading, error } = useSWR(
  key,
  () => scoresService.getCreatorScore(talentUUID)
)
```

✅ **CORRECT** (API route call):
```typescript
const { data, loading, error } = useSWR(
  key,
  () => fetch(`/api/talent-score?uuid=${talentUUID}`).then(res => res.json())
)
```

### API Routes Should Already Exist

Check that these API routes are available:
- `/api/talent-score` - For score data
- `/api/talent-credentials` - For credentials
- `/api/talent-socials` - For social accounts
- `/api/leaderboard` - For leaderboard data
- `/api/farcaster-wallets` - For wallet/FID resolution

## Commands to Run

```bash
# Search for direct service imports in hooks
grep -r "from.*Service" hooks/

# Search for service imports in any client-side file
grep -r "import.*Service" --include="*.ts" --include="*.tsx" --exclude-dir=api --exclude-dir=services .

# Check for server-side package imports
grep -r "from '@neynar/sdk'" --include="*.ts" --include="*.tsx" --exclude-dir=api .
grep -r "import.*NeynarClient" --include="*.ts" --include="*.tsx" --exclude-dir=api .
```

## Expected Results

After fixing violations:
- All hooks should call API routes instead of direct services
- Bundle sizes should be reduced (no server-side dependencies in client bundles)
- No "can only be used server-side" runtime errors
- Build should succeed with no hydration errors

## Architecture Principle

**CRITICAL**: Client-side code (hooks, components) should NEVER directly import server-side services. Always use this pattern:

```
Client-side Hook → API Route → Server-side Service → External API
```

This ensures:
- Proper separation of client/server code
- Smaller client bundles
- No runtime errors from server-side dependencies
- Consistent error handling through API routes 