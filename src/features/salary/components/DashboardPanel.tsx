"use client";

import { useState, useEffect } from "react";
import { calculateSalary, getCalculationHistory, getEmployees, formatINR, formatINRCompact, type SalaryBreakdown, type CalculationHistoryItem, type Employee } from "../lib/api";

export default function DashboardPanel() {
  const [history, setHistory] = useState<CalculationHistoryItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sampleBreakdown, setSampleBreakdown] = useState<SalaryBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hist, emps] = await Promise.all([
        getCalculationHistory(100).catch(() => []),
        getEmployees().catch(() => []),
      ]);
      setHistory(hist);
      setEmployees(emps);

      // Get a sample breakdown for the donut chart
      if (emps.length > 0) {
        const avg = Math.round(emps.reduce((s, e) => s + (e.annual_ctc || 0), 0) / emps.length);
        if (avg > 0) {
          const bd = await calculateSalary(avg).catch(() => null);
          setSampleBreakdown(bd);
        }
      } else {
        const bd = await calculateSalary(600000).catch(() => null);
        setSampleBreakdown(bd);
      }
    } catch {
      // graceful
    } finally {
      setLoading(false);
    }
  };

  const totalPayroll = employees.reduce((s, e) => s + (e.annual_ctc || 0), 0);
  const avgCTC = employees.length > 0 ? totalPayroll / employees.length : 0;

  const recentCalcs = history.slice(0, 5);

  // Calculation type distribution
  const typeCounts: Record<string, number> = {};
  history.forEach((h) => {
    typeCounts[h.calculation_type] = (typeCounts[h.calculation_type] || 0) + 1;
  });

  // Department distribution
  const deptCounts: Record<string, number> = {};
  employees.forEach((e) => {
    const dept = e.department || "Unassigned";
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  // Distinct color palettes for charts
  const chartColors = ["#2563EB", "#7C3AED", "#0891B2", "#D97706", "#DC2626", "#059669", "#DB2777", "#4F46E5"];
  const typeColors: Record<string, string> = {
    standard: "#2563EB",
    payslip: "#0891B2",
    batch: "#D97706",
    whatif: "#7C3AED",
    comparison: "#DC2626",
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="card p-12 text-center">
          <svg className="w-6 h-6 mx-auto animate-spin text-[var(--accent)]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-[13px] text-[var(--text-muted)] mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Employees"
          value={employees.length.toString()}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="var(--accent)"
        />
        <KPICard
          label="Total Payroll (Annual)"
          value={totalPayroll > 0 ? formatINRCompact(totalPayroll) : "—"}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
          color="var(--info)"
        />
        <KPICard
          label="Average CTC"
          value={avgCTC > 0 ? formatINRCompact(avgCTC) : "—"}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          color="var(--warning)"
        />
        <KPICard
          label="Calculations Run"
          value={history.length.toString()}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
          color="var(--danger)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Salary Breakdown (sample) */}
        {sampleBreakdown && (
          <div className="card p-5 lg:col-span-1">
            <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
              {employees.length > 0 ? "Avg Salary Breakdown" : "Sample Breakdown (6L)"}
            </p>
            <div className="space-y-3">
              <BreakdownBar label="Basic" value={sampleBreakdown.earnings.basic_pay} total={sampleBreakdown.earnings.total_earnings} color="#2563EB" />
              <BreakdownBar label="HRA" value={sampleBreakdown.earnings.hra} total={sampleBreakdown.earnings.total_earnings} color="#7C3AED" />
              <BreakdownBar label="Allowances" value={
                sampleBreakdown.earnings.conveyance_allowance +
                sampleBreakdown.earnings.medical_allowance +
                sampleBreakdown.earnings.special_allowance +
                sampleBreakdown.earnings.lta
              } total={sampleBreakdown.earnings.total_earnings} color="#0891B2" />
              <BreakdownBar label="Differential" value={sampleBreakdown.earnings.differential_allowance} total={sampleBreakdown.earnings.total_earnings} color="#D97706" />
            </div>
            <hr className="divider my-4" />
            <div className="flex justify-between text-[13px]">
              <span className="text-[var(--text-muted)]">Net Take-Home</span>
              <span className="font-mono font-bold text-[var(--accent)]">{formatINR(sampleBreakdown.net_salary_monthly)}/mo</span>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="card p-5 lg:col-span-2">
          <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
            Recent Calculations
          </p>
          {recentCalcs.length > 0 ? (
            <div className="space-y-2">
              {recentCalcs.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`badge ${item.calculation_type === "payslip" ? "badge-info" : item.calculation_type === "batch" ? "badge-warning" : "badge-neutral"}`}>
                      {item.calculation_type}
                    </span>
                    <span className="text-[13px] text-[var(--text-secondary)]">{item.employee_name || "Standard"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[13px] font-mono font-medium text-[var(--text-primary)]">{formatINR(item.annual_ctc)}/yr</span>
                    <span className="text-[11px] text-[var(--text-faint)] ml-2">
                      {new Date(item.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--text-faint)] text-center py-6">No calculations yet</p>
          )}
        </div>
      </div>

      {/* Department & Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
            Department Distribution
          </p>
          {Object.keys(deptCounts).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).map(([dept, count], i) => (
                <div key={dept} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                    <span className="text-[13px] text-[var(--text-secondary)]">{dept}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(count / employees.length) * 100}%`, backgroundColor: chartColors[i % chartColors.length] }} />
                    </div>
                    <span className="text-[12px] font-mono text-[var(--text-muted)] w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--text-faint)] text-center py-4">No employees yet</p>
          )}
        </div>

        <div className="card p-5">
          <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
            Calculation Types
          </p>
          {Object.keys(typeCounts).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count], i) => (
                <div key={type} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: typeColors[type] || chartColors[i % chartColors.length] }} />
                    <span className={`badge ${type === "payslip" ? "badge-info" : type === "batch" ? "badge-warning" : "badge-neutral"}`}>{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(count / history.length) * 100}%`, backgroundColor: typeColors[type] || chartColors[i % chartColors.length] }} />
                    </div>
                    <span className="text-[12px] font-mono text-[var(--text-muted)] w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--text-faint)] text-center py-4">No calculations yet</p>
          )}
        </div>
      </div>

      {/* Monthly Payroll Overview */}
      <div className="card p-5">
        <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
          Monthly Payroll Overview
        </p>
        {employees.length > 0 ? (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-[11px] text-[var(--text-faint)] uppercase">Monthly CTC Total</p>
                <p className="text-[18px] font-bold font-mono text-[var(--text-primary)]">{formatINR(totalPayroll / 12)}</p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-faint)] uppercase">Annual CTC Total</p>
                <p className="text-[18px] font-bold font-mono text-[var(--text-primary)]">{formatINR(totalPayroll)}</p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-faint)] uppercase">Avg Monthly CTC</p>
                <p className="text-[18px] font-bold font-mono text-[var(--accent)]">{formatINR(avgCTC / 12)}</p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-faint)] uppercase">Headcount</p>
                <p className="text-[18px] font-bold font-mono text-[var(--text-primary)]">{employees.length}</p>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th className="text-right">Monthly CTC</th>
                  <th className="text-right">Annual CTC</th>
                </tr>
              </thead>
              <tbody>
                {employees.slice(0, 10).map((emp) => (
                  <tr key={emp.id}>
                    <td className="font-medium text-[var(--text-primary)]">{emp.name}</td>
                    <td className="text-[var(--text-muted)]">{emp.department || "—"}</td>
                    <td className="amount">{formatINR(emp.annual_ctc / 12)}</td>
                    <td className="amount">{formatINR(emp.annual_ctc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employees.length > 10 && (
              <p className="text-[12px] text-[var(--text-faint)] text-center mt-3">
                Showing 10 of {employees.length} employees
              </p>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-[var(--text-faint)] text-center py-6">
            Add employees to see payroll overview
          </p>
        )}
      </div>
    </div>
  );
}

function KPICard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="stat-card" style={{ "--stat-accent": color } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-2">
        <p className="stat-label">{label}</p>
        <div className="text-[var(--text-faint)]">{icon}</div>
      </div>
      <p className="stat-value text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function BreakdownBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[var(--text-muted)]">{label}</span>
        </div>
        <span className="font-mono text-[var(--text-primary)]">{formatINR(value)} ({pct.toFixed(1)}%)</span>
      </div>
      <div className="w-full h-2.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
