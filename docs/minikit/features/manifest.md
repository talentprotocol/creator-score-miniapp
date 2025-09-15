# Farcaster Manifest

## Overview

Your `/.well-known/farcaster.json` file is the manifest for your Mini App. It contains all the metadata Base App uses to:

- Display your app in search results and category listings
- Generate rich, clickable embeds when your app is shared
- Show your app in users' saved apps for quick access

## Location

Serve your manifest over HTTPS at:

```bash
https://your-domain.com/.well-known/farcaster.json
```

**Tip**: Serve with `Content-Type: application/json` and ensure the file is publicly accessible (no auth).

## Required Fields

### Top-level Fields

| Property             | Type   | Required | Description                                                   |
| -------------------- | ------ | -------- | ------------------------------------------------------------- |
| `accountAssociation` | object | Yes      | Proves domain ownership for your Mini App.                    |
| `frame`              | object | Yes      | Contains all metadata used by Base App.                       |
| `baseBuilder`        | object | Yes      | This verifies ownership and connects your Base Build account. |

### Account Association Fields

| Property    | Type   | Required | Description                                 |
| ----------- | ------ | -------- | ------------------------------------------- |
| `header`    | string | Yes      | Encoded header for the association payload. |
| `payload`   | string | Yes      | Encoded payload containing your domain.     |
| `signature` | string | Yes      | Signature over the payload.                 |

### Frame Fields

#### Identity & Launch

| Property  | Type   | Required | Description         | Constraints                                                   |
| --------- | ------ | -------- | ------------------- | ------------------------------------------------------------- |
| `version` | string | Yes      | Manifest version.   | Must be `"1"`.                                                |
| `name`    | string | Yes      | Mini App name.      | Max 32 chars.                                                 |
| `homeUrl` | string | Yes      | Default launch URL. | HTTPS URL, max 1024 chars.                                    |
| `iconUrl` | string | Yes      | Icon image URL.     | HTTPS URL, PNG 1024×1024; transparent background discouraged. |

#### Loading Experience

| Property                | Type   | Required | Description               | Constraints                       |
| ----------------------- | ------ | -------- | ------------------------- | --------------------------------- |
| `splashImageUrl`        | string | Yes      | Loading image.            | HTTPS URL, recommended 200×200px. |
| `splashBackgroundColor` | string | Yes      | Loading background color. | Hex code (e.g., `#000000`).       |

#### Discovery & Search

| Property          | Type      | Required | Description                                           | Constraints                                                                                                                                                                              |
| ----------------- | --------- | -------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `primaryCategory` | string    | Yes      | Controls where your app appears in category browsing. | One of: `games`, `social`, `finance`, `utility`, `productivity`, `health-fitness`, `news-media`, `music`, `shopping`, `education`, `developer-tools`, `entertainment`, `art-creativity`. |
| `tags`            | string\[] | Yes      | Search/filter tags.                                   | Up to 5; ≤ 20 chars each; lowercase; no spaces/emojis/special chars.                                                                                                                     |
| `noindex`         | boolean   | No       | Exclude from search results.                          | `true` = exclude, default = include.                                                                                                                                                     |

#### Display Information

| Property         | Type      | Required | Description                   | Constraints                                |
| ---------------- | --------- | -------- | ----------------------------- | ------------------------------------------ |
| `subtitle`       | string    | No       | Short description under name. | Max 30 chars; avoid emojis/special chars.  |
| `description`    | string    | No       | Promo text for app page.      | Max 170 chars; avoid emojis/special chars. |
| `tagline`        | string    | No       | Marketing tagline.            | Max 30 chars.                              |
| `heroImageUrl`   | string    | No       | Large promo image.            | 1200×630px (1.91:1), PNG/JPG.              |
| `screenshotUrls` | string\[] | No       | Visual previews.              | Max 3; portrait 1284×2778px recommended.   |

#### Embeds & Social Sharing

| Property                   | Type   | Required | Description                | Constraints                       |
| -------------------------- | ------ | -------- | -------------------------- | --------------------------------- |
| `ogTitle`                  | string | No       | Open Graph title.          | Max 30 chars.                     |
| `ogDescription`            | string | No       | Open Graph description.    | Max 100 chars.                    |
| `ogImageUrl`               | string | No       | Open Graph image.          | 1200×630px (1.91:1), PNG/JPG.     |

## Example Manifest

```json
{
  "accountAssociation": {
    "header": "eyJmaWQiOjkxNTIsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMmVmNzkwRGQ3OTkzQTM1ZkQ4NDdDMDUzRURkQUU5NDBEMDU1NTk2In0",
    "payload": "eyJkb21haW4iOiJhcHAuZXhhbXBsZS5jb20ifQ",
    "signature": "MHgxMGQwZGU4ZGYwZDUwZTdmMGIxN2YxMTU2NDI1MjRmZTY0MTUyZGU4ZGU1MWU0MThiYjU4ZjVmZmQxYjRjNDBiNGVlZTRhNDcwNmVmNjhlMzQ0ZGQ5MDBkYmQyMmNlMmVlZGY5ZGQ0N2JlNWRmNzMwYzUxNjE4OWVjZDJjY2Y0MDFj"
  },
  "baseBuilder": {
    "allowedAddresses": ["0x..."]
  },
  "frame": {
    "version": "1",
    "name": "Creator Score vs Market Cap",
    "homeUrl": "https://your-app.vercel.app",
    "iconUrl": "https://your-app.vercel.app/icon.png",
    "splashImageUrl": "https://your-app.vercel.app/splash.png",
    "splashBackgroundColor": "#1F2937",
    "webhookUrl": "https://your-app.vercel.app/api/webhook",
    "subtitle": "Analyze your creator value",
    "description": "Compare your Creator Score against your coin's Market Cap to see if you're undervalued, balanced, or overvalued.",
    "screenshotUrls": ["https://your-app.vercel.app/screenshot.png"],
    "primaryCategory": "finance",
    "tags": ["creator-score", "market-cap", "valuation", "finance", "analytics"],
    "heroImageUrl": "https://your-app.vercel.app/hero.png",
    "tagline": "Know your worth",
    "ogTitle": "Creator Score vs Market Cap",
    "ogDescription": "Analyze if your creator coin is undervalued, balanced, or overvalued",
    "ogImageUrl": "https://your-app.vercel.app/hero.png",
    "noindex": false
  }
}
```

## Validation Checklist

- [ ] Manifest is served over HTTPS at `/.well-known/farcaster.json`
- [ ] All required fields are present
- [ ] Image sizes match the constraints
- [ ] Text fields respect character and formatting limits
- [ ] `"noindex": false` is used for production

## Development vs. Production

- Set `"noindex": true` for development or staging environments
- Remove or set `"noindex": false` for production so users can discover your app

## Common Issues

- Missing required fields → app won't index in search
- Image format/size mismatches → broken or distorted embeds
- Invalid `primaryCategory` → app won't appear in category browsing
- Overlong strings → truncation or rejection at indexing
- Manifest not publicly accessible → discovery fails
