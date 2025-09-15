# Install MiniKit

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git repository set up

## Installation Steps

### 1. Create MiniKit Project

```bash
npx create-onchain --mini
```

This command will:
- Scaffold a new Next.js project with MiniKit
- Install all necessary dependencies
- Set up the basic project structure

### 2. Navigate to Project

```bash
cd my-minikit-app
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Verify Installation

```bash
npm run dev
```

The app should start on `http://localhost:3000`

## Project Structure

After installation, you'll have:

```
my-minikit-app/
├── app/                    # Next.js app directory
├── components/            # React components
├── lib/                  # Utility functions
├── public/               # Static assets
├── package.json          # Dependencies
└── next.config.js        # Next.js configuration
```

## Next Steps

1. **Set up environment variables**
2. **Create your app components**
3. **Set up APIs and integrations**
4. **Create Farcaster manifest**
5. **Deploy to Vercel**

## Troubleshooting

- **Node version issues**: Ensure you have Node.js 18+
- **Port conflicts**: Change port in package.json if 3000 is busy
- **Build errors**: Check that all dependencies are installed
