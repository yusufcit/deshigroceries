import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Anchor Turbopack to THIS project root. There is an unrelated stray
  // package.json/package-lock.json in the user's home directory that Next.js
  // would otherwise mistake for the workspace root (causing a warning).
  turbopack: {
    root: process.cwd(),
  },
  // Product/category images can be pasted as arbitrary URLs in the admin
  // dashboard (Supabase storage, Unsplash, supplier CDNs, etc.), so we allow
  // any HTTPS hostname for next/image optimization.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
