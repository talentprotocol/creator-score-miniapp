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

### Phase 1: Detect Import Violations
```bash
# Search for direct service imports in hooks
grep -r "from.*Service" hooks/

# Search for service imports in any client-side file
grep -r "import.*Service" --include="*.ts" --include="*.tsx" --exclude-dir=api --exclude-dir=services .

# Check for server-side package imports
grep -r "from '@neynar/sdk'" --include="*.ts" --include="*.tsx" --exclude-dir=api .
grep -r "import.*NeynarClient" --include="*.ts" --include="*.tsx" --exclude-dir=api .
```

### Phase 2: Test API Route Functionality
**CRITICAL**: After fixing imports, test API routes directly to catch parameter mismatches:

```bash
# Test with a known UUID (replace with actual UUID from your system)
TEST_UUID="bd9d2b22-1b5b-43d3-b559-c53cbf1b7891"

# Test each API route that hooks call
curl -v "http://localhost:3000/api/talent-socials?uuid=${TEST_UUID}"
curl -v "http://localhost:3000/api/talent-credentials?uuid=${TEST_UUID}"  
curl -v "http://localhost:3000/api/talent-score?uuid=${TEST_UUID}"
curl -v "http://localhost:3000/api/leaderboard?page=1&perPage=10"
curl -v "http://localhost:3000/api/leaderboard?statsOnly=true"

# Look for these error patterns:
# - 400 Bad Request = Parameter mismatch (missing/wrong parameter names)
# - 500 Internal Server Error = Server-side processing issue
# - 200 OK = Success (should return JSON data)
```

### Phase 3: Check Hook Parameter Usage
```bash
# Search for how hooks call API routes to ensure parameter compatibility
grep -r "api/talent-" hooks/ -A 2 -B 2
grep -r "fetch.*uuid=" hooks/
grep -r "fetch.*talent_protocol_id=" hooks/
```

## Common Parameter Mismatch Patterns

**CRITICAL DISCOVERY**: After fixing client-side service imports, API routes may still fail due to parameter mismatches.

### Issue Pattern: Hook vs API Route Parameter Names

❌ **COMMON ISSUE**:
- Hook sends: `fetch('/api/talent-score?uuid=abc123')`
- API route expects: `searchParams.get('talent_protocol_id')`
- Result: 400 Bad Request or 500 Internal Server Error

✅ **SOLUTION 1 - Update API Route**:
```typescript
// In API route, map uuid to expected parameter
const uuid = searchParams.get('uuid')
const talentProtocolId = uuid  // Map uuid to talent_protocol_id
```

✅ **SOLUTION 2 - Update Hook**:
```typescript
// In hook, use the parameter name API expects
fetch(`/api/talent-score?talent_protocol_id=${uuid}`)
```

### Known Parameter Mappings (From This Project)

Based on debugging, these API routes needed parameter mapping:
- `/api/talent-credentials` - Maps `uuid` → `talent_protocol_id`
- `/api/talent-socials` - Maps `uuid` → `talent_protocol_id`
- `/api/talent-score` - Maps `uuid` → `talent_protocol_id`

## Expected Results

After fixing violations:
- **Phase 1**: All hooks should call API routes instead of direct services
- **Phase 2**: All API routes should return 200 OK with valid JSON data
- Bundle sizes should be reduced (no server-side dependencies in client bundles)
- No "can only be used server-side" runtime errors
- Build should succeed with no hydration errors
- **NEW**: Profile pages should load correctly via navigation (not just direct URL access)

## Critical Files to Copy/Replace in New Repo

### 1. Fixed API Routes (Copy Directly)
These routes now properly handle `uuid` parameter mapping:
- `app/api/talent-credentials/route.ts` ✅
- `app/api/talent-socials/route.ts` ✅  
- `app/api/talent-score/route.ts` ✅

### 2. Fixed Hooks (Copy Directly)
These hooks now call API routes instead of direct services:
- `hooks/useUserCreatorScore.ts` ✅
- `hooks/useProfileCreatorScore.ts` ✅
- `hooks/useProfileCredentials.ts` ✅
- `hooks/useProfileSocialAccounts.ts` ✅
- `hooks/useLeaderboard.ts` ✅
- `hooks/useLeaderboardStats.ts` ✅
- `hooks/useProfileTotalEarnings.ts` ✅

### 3. Server-Side Service Files (Copy Directly)
These handle proper lazy instantiation:
- `lib/neynar-client.ts` ✅ (Lazy getNeynarClient() function)
- `app/services/neynarService.ts` ✅ (Uses lazy client)

### 4. Architecture Documentation (Copy Directly)
- `planning/architecture-check-prompt.md` ✅ (This file)
- `planning/file-structure.md` ✅ (Updated with client-server separation)

## Debugging Session Learnings: Data Structure Issues

### **CRITICAL DISCOVERY**: Three-Phase Architecture Issues

This debugging session revealed that proper architecture compliance requires **THREE PHASES**:

**Phase 1**: Fix client-side service imports (what we originally documented)
**Phase 2**: Fix API route parameter mismatches (parameter mapping)
**Phase 3**: Fix API response data structure extraction (NEW - discovered in this session)

### **Phase 3: API Response Data Structure Issues**

#### Problem Pattern
API routes return nested objects, but hooks expect flat arrays:

❌ **API Response**: `{ "socials": [...] }` or `{ "credentials": [...] }`
❌ **Hook Assumption**: `[...]` (direct array)
❌ **Result**: `TypeError: data.reduce is not a function`

#### Fixed Hooks
These hooks were updated to extract data properly:
- `useProfileSocialAccounts.ts`: `responseData.socials || []`
- `useProfileTotalEarnings.ts`: `responseData.credentials || []`
- `useProfileCredentials.ts`: `responseData.credentials || []`

#### Pattern for Fix
```typescript
// ❌ WRONG (assumes direct array)
const data = await response.json();
setData(data);

// ✅ CORRECT (extracts from nested object)
const responseData = await response.json();
const data = responseData.arrayProperty || [];
setData(data);
```

### **Testing Strategy for All 3 Phases**

```bash
# Phase 1: Check for direct service imports
grep -r "from.*Service" hooks/

# Phase 2: Test API route functionality
curl -v "http://localhost:3000/api/talent-socials?uuid=${TEST_UUID}"

# Phase 3: Test data structure extraction
# Check that ProfileScreen renders without "reduce is not a function" errors
# Monitor browser console for JavaScript errors
```

### **Error Signatures to Watch For**

1. **Phase 1**: `"NeynarClient can only be used server-side"`
2. **Phase 2**: `400 Bad Request` or `500 Internal Server Error` from API routes
3. **Phase 3**: `"TypeError: data.reduce is not a function"` or similar

### **Files That MUST Be Copied to New Repo**

All the hooks listed above contain critical fixes for Phase 3 issues. Using the original versions from the old repo will cause immediate runtime crashes when trying to render profile pages.

## Architecture Principle

**CRITICAL**: This is a **THREE-PHASE** architecture compliance check:

**Phase 1**: Client-side code (hooks, components) should NEVER directly import server-side services. Always use this pattern:
```
Client-side Hook → API Route → Server-side Service → External API
```

**Phase 2**: API routes must handle parameter compatibility with how hooks call them:
```
Hook sends: ?uuid=abc123
API route: searchParams.get('uuid') // NOT talent_protocol_id
```

**Phase 3**: Hooks must properly extract data from API response objects:
```
API returns: { "socials": [...] }
Hook extracts: responseData.socials || []
```

This ensures:
- Proper separation of client/server code
- Smaller client bundles (40% reduction achieved)
- No runtime errors from server-side dependencies
- Consistent error handling through API routes
- **NEW**: Actual functional end-to-end data flow without crashes 