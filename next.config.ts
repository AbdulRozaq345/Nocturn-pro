import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  // Serve /_offline when any navigation fails while offline
  fallbacks: {
    document: "/_offline",
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /\/api\/maintenance-status/,
        handler: "NetworkOnly",
      },
      // Cache the downloaded + offline pages so they're always available offline
      {
        urlPattern: /^\/(downloaded|_offline)(\/.*)?$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "offline-pages",
          expiration: { maxEntries: 4, maxAgeSeconds: 7 * 24 * 60 * 60 },
          networkTimeoutSeconds: 5,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingRoot: __dirname,
  outputFileTracingIncludes: {
    "/api/maintenance-status": ["./data/maintenance.json"],
  },
  // Keep Turbopack config present for Next.js 16 compatibility checks.
  turbopack: {},
};

export default withPWA(nextConfig);
