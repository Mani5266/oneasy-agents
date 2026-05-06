import type { ReactNode } from "react";
import Link from "next/link";
import "./salary.css";

export const metadata = {
  title: "Salary Calculator — Oneasy Agents",
};

export default function SalaryLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid var(--border-default, #E5E7EB)",
          fontSize: 13,
          background: "var(--bg-raised, #fff)",
        }}
      >
        <Link
          href="/"
          style={{
            color: "var(--accent, #2563EB)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>
      {children}
    </div>
  );
}
