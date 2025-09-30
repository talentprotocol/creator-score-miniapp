/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: false, // TODO: Uncomment this to test duplicated requests
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // Exclude HeartbeatWorker from Terser minification
    if (config.optimization && Array.isArray(config.optimization.minimizer)) {
      config.optimization.minimizer.forEach((minimizer) => {
        if (
          minimizer.constructor.name === "TerserPlugin" &&
          minimizer.options &&
          minimizer.options.exclude !== undefined
        ) {
          if (Array.isArray(minimizer.options.exclude)) {
            minimizer.options.exclude.push(/HeartbeatWorker\..*\.js$/);
          } else {
            minimizer.options.exclude = [
              minimizer.options.exclude,
              /HeartbeatWorker\..*\.js$/,
            ].filter(Boolean);
          }
        }
      });
    }
    return config;
  },
  images: {
    domains: [
      "api.dicebear.com",
      "i.imgur.com",
      "imagedelivery.net",
      "www.creatorscore.app",
      "creatorscore.app",
    ],
  },
  transpilePackages: ["@coinbase/wallet-sdk", "@coinbase/onchainkit"],

  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://eu.i.posthog.com/decide",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  // This is required to support Privy
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://vercel.live https://www.googletagmanager.com https://www.google-analytics.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://use.typekit.net https://p.typekit.net;
              style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://use.typekit.net https://p.typekit.net;
              font-src 'self' https://fonts.gstatic.com https://use.typekit.net https://p.typekit.net;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'self' https://www.creatorscore.app https://creatorscore.app https://warpcast.com https://*.warpcast.com https://farcaster.xyz https://*.farcaster.xyz;
              child-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org;
              frame-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com https://www.googletagmanager.com;
              connect-src 'self' https://www.creatorscore.app https://creatorscore.app https://auth.privy.io wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://*.walletconnect.com https://pulse.walletconnect.org https://api.web3modal.org https://warpcast.com https://client.warpcast.com https://api.coinbase.com https://vercel.live https://www.google-analytics.com https://www.googletagmanager.com;
              worker-src 'self';
              manifest-src 'self'
            `
              .replace(/\s+/g, " ")
              .trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
