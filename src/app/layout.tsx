import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = "https://www.getnetworthcertificate.com";
const SITE_NAME = "OnEasy";
const SITE_DESCRIPTION =
  "Generate net worth certificates, partnership deeds, LLP agreements, offer letters, and salary calculations instantly with AI. CA-validated, MCA-compliant, ready in minutes.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "OnEasy — AI Document Generation for Indian Businesses",
    template: "%s | OnEasy",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  generator: "Next.js",
  keywords: [
    "net worth certificate",
    "partnership deed",
    "LLP agreement",
    "offer letter generator",
    "salary calculator India",
    "AI document generation",
    "CA documents",
    "MCA compliance",
    "Indian business documents",
  ],
  referrer: "strict-origin-when-cross-origin",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "OnEasy — AI Document Generation for Indian Businesses",
    description: SITE_DESCRIPTION,
    // /opengraph-image.tsx is auto-discovered by Next.js
  },
  twitter: {
    card: "summary_large_image",
    title: "OnEasy — AI Document Generation for Indian Businesses",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "business",
};

export const viewport: Viewport = {
  themeColor: "#0A2640",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${dmSerif.variable} ${inter.variable}`}>
      <body className="h-full antialiased">
        {children}
      </body>
    </html>
  );
}
