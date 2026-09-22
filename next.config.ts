import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ── Performance ────────────────────────────────────────── */

  // Reduce dev-mode console noise from server-action / fetch logging
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  // Suppress the dev-indicator floating widget that can interfere with UI
  devIndicators: false,

  /* ── Production optimizations ───────────────────────────── */

  // Compress responses for faster delivery
  compress: true,

  // Strict-mode catches bugs early (only fires double-renders in dev, not prod)
  reactStrictMode: true,

  // Reduce powered-by header exposure
  poweredByHeader: false,
};

export default nextConfig;
