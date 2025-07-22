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
    domains: ["api.dicebear.com", "i.imgur.com"],
  },
  experimental: {
    esmExternals: false,
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
};

export default nextConfig;
