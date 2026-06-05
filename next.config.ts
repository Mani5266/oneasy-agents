import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Content Security Policy
// - Razorpay: checkout.razorpay.com (frame + script), api.razorpay.com (connect)
// - Supabase: *.supabase.co (connect + img)
// - Google Fonts: fonts.googleapis.com (style), fonts.gstatic.com (font)
// - Next.js: requires 'unsafe-inline' for hydration + 'unsafe-eval' in dev
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://checkout.razorpay.com https://*.razorpay.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://*.razorpay.com",
  "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://*.razorpay.com wss://*.supabase.co",
  "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
