import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production start serves a private snapshot, never the mutable build directory.
  distDir: process.env.ALECS_RUNTIME_DIR || ".next",
  // Keep hydration independent of the optional dev-only WebSocket debug stream.
  // Preview proxies may serve HTTP successfully without forwarding WebSocket upgrades.
  experimental: { reactDebugChannel: false },
};

export default nextConfig;
