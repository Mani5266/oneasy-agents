import type { Metadata } from "next";
import Link from "next/link";
import "./llp.css";

export const metadata: Metadata = {
  title: "LLP Agreement Generator",
  description:
    "Create LLP agreements with AI. MCA-compliant drafts, intelligent clause library, capital contribution mapping, rights & obligations.",
  robots: { index: false, follow: false }, // auth-gated agent page
  openGraph: {
    title: "LLP Agreement Generator | OnEasy",
    description:
      "Create LLP agreements with AI. MCA-compliant drafts, clause library, capital contribution mapping.",
  },
};

export default function LLPLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Back to Dashboard nav */}
      <nav className="shrink-0 z-[100] bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 px-5 py-2 flex items-center justify-between shadow-md">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 rounded-full backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-white/5"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <Link
          href="/llp/history"
          className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 rounded-full backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-white/5"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          History
        </Link>
      </nav>
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
