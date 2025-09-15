# Create Manifest

## Overview

Generate your Farcaster account association and expose the `/.well-known/farcaster.json` endpoint.

## Generate Account Association via CLI

```bash
npx create-onchain --manifest
```

**Info**: Use your Farcaster custody wallet to sign. You can import it using your recovery phrase from Farcaster (Settings → Advanced).

After signing, the CLI updates local `.env` variables:

- `FARCASTER_HEADER`
- `FARCASTER_PAYLOAD`
- `FARCASTER_SIGNATURE`

## Manifest Location

The manifest exists in `app/.well-known/farcaster.json/route.ts` which returns your `accountAssociation` and mini app properties.

**Check**: Open `https://yourdomain.com/.well-known/farcaster.json` in a browser to verify JSON output.

## Add Frame Metadata for Embeds

Define `fc:frame` metadata so your app renders a rich embed with a launch button when shared.

Review the full [Embeds and Previews](/mini-apps/features/embeds-and-previews) guide to create engaging sharing experiences and improve discoverability.

## Important Notes

- **All image and API URLs** must be publicly accessible via HTTPS
- **Environment variables** must be set in your deployment platform
- **Account association** must match exactly what Farcaster generates

## Next Steps

1. **Update manifest** with your app details
2. **Deploy changes** to your hosting platform
3. **Test manifest** accessibility
4. **Submit to Farcaster** for verification
