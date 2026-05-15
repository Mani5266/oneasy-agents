import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [
    "puppeteer-core",
    "@sparticuz/chromium",
    "tesseract.js",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "wypoxvslvswcffapxiog.supabase.co" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
