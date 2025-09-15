# Deploy MiniKit

## Overview

To create your manifest and test your Mini App, you need a live HTTPS URL.

## Deploy to Vercel (Recommended)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy

```bash
vercel
```

Follow the prompts to:
- Link to your Vercel account
- Set project name
- Configure settings

### 3. Set Environment Variables

Use `vercel env add` or the dashboard to add:

- `NEXT_PUBLIC_CDP_CLIENT_API_KEY`
- `NEXT_PUBLIC_URL` (deployed app URL)
- `NEXT_PUBLIC_IMAGE_URL` (optional)
- `NEXT_PUBLIC_SPLASH_IMAGE_URL` (optional)
- `NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR` (optional)

## Alternative: ngrok (for Local Testing)

### Using ngrok

**Warning**: The paid plan is recommended. The free approval screen and rotating URLs can break the manifest.

1. Start your dev server:

```bash
npm run dev
```

2. Create a tunnel:

```bash
npm install -g ngrok
ngrok http 3000
```

3. Copy the HTTPS URL (e.g., `https://your-tunnel.ngrok.io`)
4. Use that URL during manifest creation

## Verification

After deployment:

1. **Verify URL works** in a browser
2. **Check environment variables** are loaded
3. **Test API endpoints** if applicable
4. **Proceed to manifest creation**

## Next Steps

1. **Create Farcaster manifest**
2. **Generate account association**
3. **Test in Farcaster app**
4. **Submit for verification**
