import type { Metadata } from "next";
import Link from "next/link";
import "./networth.css";

export const metadata: Metadata = {
  title: "Net Worth Certificate | OnEasy",
};

export default function NetworthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="networth-scope">
      <nav className="no-print px-4 py-2 bg-white border-b border-slate-200 text-xs">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-navy-700 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>
      </nav>
      {children}
    </div>
  );
}
