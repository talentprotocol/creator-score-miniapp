# Automatic Versioning System

This app uses an automatic versioning system that combines:
- **Package version** from `package.json`
- **Build date** automatically generated during build

## How It Works

### 1. Version Display
The footer automatically shows: `Creator Score App v1.0.0 (2025.01.13)`

### 2. Build Process
When you run `npm run build`, the build date is automatically set:
```bash
NEXT_PUBLIC_BUILD_DATE=$(date -u +%Y-%m-%d) next build
```

### 3. Version Management
Use these commands to bump versions:

```bash
# Patch version (1.0.0 → 1.0.1)
npm run version:patch

# Minor version (1.0.0 → 1.1.0)  
npm run version:minor

# Major version (1.0.0 → 2.0.0)
npm run version:major
```

## Manual Version Update

You can also manually edit the version in `package.json`:
```json
{
  "version": "1.0.0"
}
```

The footer will automatically reflect the change on the next build.

## Environment Variables

- `NEXT_PUBLIC_BUILD_DATE`: Set automatically during build
- Can be manually overridden if needed

## Files Involved

- `lib/version.ts` - Version utility functions
- `package.json` - Source of truth for version
- `scripts/version-bump.js` - Version bumping helper
- `app/settings/page.tsx` - Footer display 