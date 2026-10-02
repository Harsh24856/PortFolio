import type { NextConfig } from "next";

/* View transitions (a project card morphing into its case-study hero) need
   no flag since Next.js 16.3: the App Router enables React's ViewTransition. */
const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.31.73.16"],
};

export default nextConfig;
