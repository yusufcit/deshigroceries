import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
