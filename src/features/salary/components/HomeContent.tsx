"use client";

import { useState } from "react";
import SalaryCalculatorPanel from "./SalaryCalculatorPanel";
import PayslipGenerator from "./PayslipGenerator";
import PayslipHistoryPanel from "./PayslipHistoryPanel";

import EmployeeDirectory from "./EmployeeDirectory";
import CTCComparePanel from "./CTCComparePanel";
import TaxComparePanel from "./TaxComparePanel";
import RevisionSimulator from "./RevisionSimulator";
import HistoryPanel from "./HistoryPanel";
import type { PayslipHistoryRecord } from "../lib/payslip-history";

// ─── Sidebar navigation structure ───
const navGroups = [
  {
    label: "Payroll",
    items: [
      {
        id: "calculator",
        label: "Calculator",
        description: "Compute salary structure from Annual CTC",
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        id: "payslip",
        label: "Payslip",
        description: "Generate professional payslips",
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        id: "employees",
        label: "Employees",
        description: "Manage your employee directory",
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Analysis",
    items: [
      {
        id: "compare",
        label: "CTC Compare",
        description: "Compare two CTC packages side by side",
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        ),
      },
      {
        id: "tax-compare",
        label: "Tax Regimes",
        description: "Old vs New tax regime comparison",
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
          </svg>
        ),
      },
      {
        id: "revision",
        label: "Revision Sim",
        description: "Simulate salary increments & revisions",
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Records",
    items: [
      {
        id: "payslip-history",
        label: "Payslip History",
        description: "View, edit & manage generated payslips",
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        ),
      },
      {
        id: "history",
        label: "Calc History",
        description: "Past calculation history & records",
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ],
  },
] as const;

type TabId = (typeof navGroups)[number]["items"][number]["id"];

interface TabItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

// Flat list for tab lookup
const allTabs: TabItem[] = navGroups.flatMap((g) => [...g.items]);

export default function HomeContent() {
  const [activeTab, setActiveTab] = useState<TabId>("calculator");
  const [editRecord, setEditRecord] = useState<PayslipHistoryRecord | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentTab = allTabs.find((t) => t.id === activeTab)!;

  const handleEditPayslip = (record: PayslipHistoryRecord) => {
    setEditRecord(record);
    setActiveTab("payslip" as TabId);
  };

  const handleEditComplete = () => {
    setEditRecord(null);
  };

  return (
    <div className="salary-app-shell flex h-full bg-[var(--bg-base)]">
      {/* Mobile hamburger */}
      <button className="salary-mobile-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Open menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      {/* Mobile overlay */}
      <div className={`salary-mobile-overlay${mobileMenuOpen ? ' open' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      {/* ─── Sidebar ─── */}
      <aside className={`w-[240px] border-r border-[var(--border-default)] bg-white flex flex-col shrink-0${mobileMenuOpen ? ' mobile-open' : ''}`}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent)] flex items-center justify-center shadow-sm">
              <svg className="w-[18px] h-[18px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-[var(--text-primary)] leading-tight tracking-tight">
                On Easy
              </h1>
              <p className="text-[11px] text-[var(--text-faint)] leading-tight mt-0.5">
                Salary Calculator
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-3 mb-2 text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-[0.12em]">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as TabId);
                        if (tab.id !== "payslip") setEditRecord(null);
                        setMobileMenuOpen(false);
                      }}
                      className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                    >
                      <span className={`shrink-0 ${isActive ? "text-[var(--accent)]" : ""}`}>{tab.icon}</span>
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[var(--border-default)]">
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-[52px] border-b border-[var(--border-default)] flex items-center justify-between px-6 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
              {currentTab.label}
            </h2>
            <span className="text-[var(--border-strong)]">|</span>
            <p className="text-[13px] text-[var(--text-muted)]">
              {currentTab.description}
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[var(--bg-base)]">
          {activeTab === "calculator" && <SalaryCalculatorPanel />}
          {activeTab === "payslip" && (
            <PayslipGenerator
              editRecord={editRecord}
              onEditComplete={handleEditComplete}
            />
          )}
          {activeTab === "employees" && <EmployeeDirectory />}
          {activeTab === "compare" && <CTCComparePanel />}
          {activeTab === "tax-compare" && <TaxComparePanel />}
          {activeTab === "revision" && <RevisionSimulator />}
          {activeTab === "payslip-history" && (
            <PayslipHistoryPanel onEdit={handleEditPayslip} />
          )}
          {activeTab === "history" && <HistoryPanel />}
        </div>
      </main>
    </div>
  );
}
