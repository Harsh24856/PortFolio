import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.31.73.16"],
  experimental: {
    /* a project card morphs into its case-study hero on navigation */
    viewTransition: true,
  },
};

export default nextConfig;
