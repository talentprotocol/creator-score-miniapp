# Debug Logging for Profile Resolution Issues

**⚠️ TEMPORARY DEBUGGING CODE - WILL BE REMOVED AFTER ISSUE IS RESOLVED**

This document explains the comprehensive logging system that is currently **always enabled** to debug profile resolution issues.

## Overview

The logging system tracks every step of the profile resolution flow:
1. **ProfileLayout** - Server-side layout entry and user resolution
2. **UserService** - Talent API calls and user data processing
3. **TalentAPI** - HTTP requests/responses to external Talent Protocol API
4. **API Routes** - Internal API endpoint calls
5. **Service Layer** - Individual service method execution

## Current Status

**Logging is ALWAYS ENABLED** - no environment variables needed.

This is temporary debugging code that will be removed once the profile resolution issue is fixed.

## Log Structure

All logs are structured JSON with consistent fields:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "scope": "[ProfileLayout]",
  "message": "start",
  "identifier": "macedo",
  "isReserved": false
}
```

### Common Fields

- `timestamp`: ISO timestamp of the log entry
- `scope`: Logging scope (e.g., `[ProfileLayout]`, `[UserService]`)
- `message`: Human-readable message describing the event
- Additional fields vary by context

## Key Log Scopes

### ProfileLayout
- `start` - Layout entry with identifier
- `calling_getTalentUserService` - Before service call
- `getTalentUserService_result` - Service call result
- `user_not_found_rendering_creator_not_found` - Decision to show error
- `user_resolved` - User successfully resolved
- `redirecting_to_canonical_*` - Canonical redirects
- `fetch_bundle_*` - Data fetching operations
- `data_inconsistency_warning` - Data validation warnings

### UserService
- `getTalentUserService_start` - Service entry
- `getProfile_params` - Parameters sent to Talent API
- `getProfile_response` - Response status from Talent API
- `getProfile_user_data` - Parsed user data
- `getProfile_success` - Successful resolution
- `getProfile_error` - Error handling

### TalentAPI
- `makeRequest_start` - HTTP request initiation
- `makeRequest_response` - Response received
- `makeRequest_success` - Successful API call
- `makeRequest_error_response` - API error response
- `getProfile_start` - Profile fetch initiation
- `getProfile_success` - Profile fetch success

### API
- `talent-user-get` - API route entry
- `talent-user-get-calling-service` - Service call
- `talent-user-get-success` - Successful response

## Usage Examples

### Debug Profile Resolution

When a user gets "Creator Not Found":

1. Visit the failing profile URL (e.g., `/macedo`)
2. Check server logs for the complete flow
3. All logging is automatically enabled

### Expected Log Flow for Success

```
[ProfileLayout] start { identifier: "macedo" }
[ProfileLayout] calling_getTalentUserService { identifier: "macedo" }
[UserService] getTalentUserService_start { identifier: "macedo" }
[UserService] getProfile_params { identifier: "macedo", account_source: "farcaster" }
[TalentAPI] getProfile_start { params: { id: "macedo", account_source: "farcaster" } }
[TalentAPI] makeRequest_start { endpoint: "/profile", params_count: 3 }
[TalentAPI] makeRequest_response { status: 200, ok: true }
[TalentAPI] makeRequest_success { has_profile: true }
[TalentAPI] getProfile_success { profile_id: "bd9d2b22-...", fname: "macedo" }
[UserService] getProfile_success { result_id: "bd9d2b22-...", result_fname: "macedo" }
[ProfileLayout] getTalentUserService_result { user_found: true, user_id: "bd9d2b22-..." }
[ProfileLayout] user_resolved { identifier: "macedo", canonical: "macedo" }
[ProfileLayout] fetch_bundle_start { user_id: "bd9d2b22-..." }
[ProfileLayout] successfully_rendered { user_id: "bd9d2b22-...", identifier: "macedo" }
```

### Expected Log Flow for Failure

```
[ProfileLayout] start { identifier: "macedo" }
[ProfileLayout] calling_getTalentUserService { identifier: "macedo" }
[UserService] getTalentUserService_start { identifier: "macedo" }
[UserService] getProfile_params { identifier: "macedo", account_source: "farcaster" }
[TalentAPI] getProfile_start { params: { id: "macedo", account_source: "farcaster" } }
[TalentAPI] makeRequest_start { endpoint: "/profile", params_count: 3 }
[TalentAPI] makeRequest_response { status: 500, ok: false }
[TalentAPI] makeRequest_error_response { status: 500, error_message: "Internal Server Error" }
[UserService] getProfile_error { error: "HTTP 500: Internal Server Error" }
[ProfileLayout] getTalentUserService_result { user_found: false, user_id: null }
[ProfileLayout] user_not_found_rendering_creator_not_found { user_null: true }
```

## Troubleshooting

### Common Issues

1. **No logs appearing**: Check that the code has been deployed
2. **Partial logs**: Look for errors in the flow that might be interrupting logging
3. **Performance impact**: Logging adds minimal overhead

### Data Inconsistencies

The system logs warnings for common data issues:

- `creator_score_positive_but_no_earnings_segments` - Score exists but no earnings data
- `social_accounts_exist_but_zero_followers` - Social accounts with 0 followers

## Cleanup

**After the issue is resolved:**

1. Delete `lib/debug.ts`
2. Remove all `dlog` and `dtimer` calls from the codebase
3. Remove this documentation file

## Performance Notes

- Structured JSON logging enables easy parsing and analysis
- Timers track execution duration for performance monitoring
- Logs will appear in your server console/logs
