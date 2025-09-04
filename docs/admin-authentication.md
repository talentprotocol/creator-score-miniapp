# Admin Authentication Security

This document explains the secure admin authentication system implemented for the Creator Score miniapp.

## Overview

The admin authentication system provides **two-factor security** for admin-only API endpoints:

1. **Server-to-Server Authentication**: Uses `ADMIN_API_TOKEN` for external tools and scripts
2. **Browser-based Authentication**: Uses Privy SDK + UUID validation for in-app admin actions

## Security Features

### 🔐 ADMIN_API_TOKEN
- **Cryptographically secure**: 64-byte random hex string
- **High entropy**: Resistant to brute force attacks
- **Easy rotation**: Can be changed without affecting user access
- **Server-only**: Never exposed to client-side code

### 👤 Browser-based Authentication
- **Privy SDK integration**: Validates user is authenticated through the app
- **Talent UUID verification**: Ensures user is in admin list
- **Session-based**: Tied to actual user login state
- **Browser-only**: Admin features not available in miniapp context

## Environment Variables

```bash
# Required for admin authentication
ADMIN_API_TOKEN=your_secure_64_byte_hex_token
ADMIN_UUIDS=uuid1,uuid2,uuid3  # Comma-separated list of admin Talent UUIDs
```

## Usage Patterns

### Server-to-Server (API Token)
```bash
curl -H "Authorization: Bearer your_admin_api_token" \
     https://your-app.com/api/admin/notifications/users
```

### Browser-based Admin Actions (Privy + UUID)
```javascript
// Requires user to be logged in through Privy AND have admin UUID
const { talentId } = usePrivyAuth({});

const response = await fetch('/api/admin/notifications/manual', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${talentId}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(notificationData)
});
```

## Endpoint Security Levels

| Endpoint | Security Level | Use Case |
|----------|----------------|----------|
| `/api/admin/notifications/manual` | API Token or UUID | Browser admin panel |
| `/api/admin/notifications/users` | API Token or UUID | Browser admin panel |
| `/api/admin/notifications/history` | API Token or UUID | Browser admin panel |
| `/api/admin/invalidate-leaderboard-cache` | API Token or UUID | External tools/scripts |

## Authentication Flow

1. **API Token Check**: First validates against `ADMIN_API_TOKEN` (highest priority)
2. **UUID Check**: Falls back to `ADMIN_UUIDS` validation
3. **User Context**: In browser, user must be authenticated via Privy SDK

## Security Benefits

| Risk | Old System | New System |
|------|------------|------------|
| **Token Spoofing** | High (UUID format) | Low (random + Privy auth) |
| **Brute Force** | Medium (predictable) | Very Low (high entropy) |
| **Client Exposure** | High (UUID visible) | Low (token server-only) |
| **Token Rotation** | Hard (affects users) | Easy (independent) |
| **User Validation** | None | Full (Privy SDK) |

## Security Best Practices

1. **Never commit tokens to version control**
2. **Use secrets managers in production**
3. **Rotate tokens regularly**
4. **Monitor admin API usage**
5. **Log all admin actions for audit**

## Migration from Old System

The old system used only `ADMIN_UUIDS` with Bearer token validation. The new system:

- ✅ Maintains backward compatibility for UUID-based tokens
- ✅ Adds secure API token support
- ✅ Implements Privy-based user validation
- ✅ Provides better security for browser-based admin actions

## Troubleshooting

### "Unauthorized - Invalid admin API token"
- Check `ADMIN_API_TOKEN` environment variable
- Ensure token is exactly 64 hex characters
- Verify no extra whitespace

### "Unauthorized - Invalid admin token"
- User's Talent UUID must be in `ADMIN_UUIDS` list
- Check browser console for authentication errors
- Ensure user is logged in through Privy SDK

### "Unauthorized - Missing Bearer token"
- Ensure `Authorization: Bearer <token>` header is present
- Check token format and length

## Implementation Notes

- Admin features are **browser-only** and not available in miniapp context
- Uses Privy SDK for user authentication instead of MiniKit
- API token takes priority over UUID validation
- All admin actions are logged for audit purposes
