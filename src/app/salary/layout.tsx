import type { ReactNode } from "react";
import Link from "next/link";
import "./salary.css";

export const metadata = {
  title: "Salary Calculator — Oneasy Agents",
};

export default function SalaryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Back to Dashboard nav */}
      <nav className="shrink-0 z-[100] bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 px-5 py-2 flex items-center shadow-md">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 rounded-full backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-white/5"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </nav>
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
