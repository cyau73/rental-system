// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // This is for the 1MB limit error you just had
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;