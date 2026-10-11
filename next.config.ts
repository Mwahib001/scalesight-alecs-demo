import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production start serves a private snapshot, never the mutable build directory.
  distDir: process.env.ALECS_RUNTIME_DIR || ".next",
};

export default nextConfig;
