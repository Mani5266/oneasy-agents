"use client";

import { type SalaryBreakdown, formatINR } from "../lib/api";

interface Props {
  breakdown: SalaryBreakdown;
  compact?: boolean;
}

export default function SalaryBreakdownCard({ breakdown, compact = false }: Props) {
  const { earnings: e, deductions: d, employer_contributions: ec } = breakdown;

  const earningsRows = [
    { label: "Basic Pay", monthly: e.basic_pay, annual: e.basic_pay * 12 },
    { label: "HRA", monthly: e.hra, annual: e.hra * 12 },
    { label: "Conveyance Allowance", monthly: e.conveyance_allowance, annual: e.conveyance_allowance * 12 },
    { label: "Medical Allowance", monthly: e.medical_allowance, annual: e.medical_allowance * 12 },
    { label: "Children Education", monthly: e.children_education, annual: e.children_education * 12 },
    { label: "Children Hostel", monthly: e.children_hostel_allowance, annual: e.children_hostel_allowance * 12 },
    { label: "Special Allowance", monthly: e.special_allowance, annual: e.special_allowance * 12 },
    { label: "LTA", monthly: e.lta, annual: e.lta * 12 },
    { label: "Differential Allowance", monthly: e.differential_allowance, annual: e.differential_allowance * 12 },
  ];

  const deductionRows = [
    { label: "Employee EPF", monthly: d.employee_epf, annual: d.employee_epf * 12 },
    { label: "Employee ESI", monthly: d.employee_esi, annual: d.employee_esi * 12 },
    { label: "Professional Tax", monthly: d.professional_tax, annual: d.professional_tax * 12 },
  ];

  if (compact) {
    return (
      <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] text-[var(--text-muted)] font-medium">CTC</span>
          <span className="text-[13px] font-semibold font-mono text-[var(--text-primary)]">
            {formatINR(breakdown.annual_ctc)}/yr
          </span>
        </div>
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[11px] text-[var(--text-muted)] font-medium">Net Salary</span>
          <span className="text-[var(--success)] font-bold text-[13px] font-mono">
            {formatINR(breakdown.net_salary_monthly)}/mo
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {breakdown.esi_eligible ? (
            <span className="badge badge-success">ESI Eligible</span>
          ) : (
            <span className="badge badge-neutral">ESI Exempt</span>
          )}
          <span className="badge badge-info">
            EPF: {formatINR(d.employee_epf)}/mo
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Annual CTC"
          value={formatINR(breakdown.annual_ctc)}
          suffix="/yr"
          accentColor="var(--info)"
        />
        <SummaryCard
          label="Monthly CTC"
          value={formatINR(breakdown.monthly_ctc)}
          suffix="/mo"
          accentColor="var(--text-faint)"
        />
        <SummaryCard
          label="Net Take-Home"
          value={formatINR(breakdown.net_salary_monthly)}
          suffix="/mo"
          variant="success"
          accentColor="var(--success)"
        />
        <SummaryCard
          label="Total Deductions"
          value={formatINR(d.total_deductions)}
          suffix="/mo"
          variant="danger"
          accentColor="var(--danger)"
        />
      </div>

      {/* Earnings Table */}
      <div className="card overflow-hidden">
        <div className="section-header">
          <div className="w-5 h-5 rounded flex items-center justify-center bg-[var(--success-muted)]">
            <svg className="w-3 h-3 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3>Earnings</h3>
          <span className="badge badge-neutral section-badge">{earningsRows.length} components</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Component</th>
              <th className="text-right">Monthly</th>
              <th className="text-right">Annual</th>
            </tr>
          </thead>
          <tbody>
            {earningsRows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td className="amount">{formatINR(row.monthly)}</td>
                <td className="amount">{formatINR(row.annual)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>Total Earnings</td>
              <td className="amount">{formatINR(e.total_earnings)}</td>
              <td className="amount">{formatINR(e.total_earnings * 12)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Deductions Table */}
      <div className="card overflow-hidden">
        <div className="section-header">
          <div className="w-5 h-5 rounded flex items-center justify-center bg-[var(--danger-muted)]">
            <svg className="w-3 h-3 text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </div>
          <h3>Deductions</h3>
          <span className="badge badge-neutral section-badge">{deductionRows.length} components</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Component</th>
              <th className="text-right">Monthly</th>
              <th className="text-right">Annual</th>
            </tr>
          </thead>
          <tbody>
            {deductionRows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td className="amount">{formatINR(row.monthly)}</td>
                <td className="amount">{formatINR(row.annual)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>Total Deductions</td>
              <td className="amount">{formatINR(d.total_deductions)}</td>
              <td className="amount">{formatINR(d.total_deductions * 12)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Employer Contributions */}
      <div className="card overflow-hidden">
        <div className="section-header">
          <div className="w-5 h-5 rounded flex items-center justify-center bg-[var(--info-muted)]">
            <svg className="w-3 h-3 text-[var(--info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3>Employer Contributions</h3>
          <span className="text-[11px] text-[var(--text-faint)] ml-auto italic">Not deducted from salary</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Component</th>
              <th className="text-right">Monthly</th>
              <th className="text-right">Annual</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Employer EPF</td>
              <td className="amount">{formatINR(ec.employer_epf)}</td>
              <td className="amount">{formatINR(ec.employer_epf * 12)}</td>
            </tr>
            <tr>
              <td>Employer ESI</td>
              <td className="amount">{formatINR(ec.employer_esi)}</td>
              <td className="amount">{formatINR(ec.employer_esi * 12)}</td>
            </tr>
            <tr className="total-row">
              <td>Total Employer Cost</td>
              <td className="amount">{formatINR(ec.total_employer_contributions)}</td>
              <td className="amount">{formatINR(ec.total_employer_contributions * 12)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Compliance Flags */}
      <div className="card p-5">
        <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Compliance Status
        </p>
        <div className="flex gap-2 flex-wrap">
          {breakdown.esi_eligible ? (
            <span className="badge badge-success">ESI Applicable (Gross &le; 21,000)</span>
          ) : (
            <span className="badge badge-neutral">ESI Not Applicable (Gross &gt; 21,000)</span>
          )}
          <span className="badge badge-info">
            EPF Wage Base: {e.basic_pay > 15000 ? "Capped at 15,000" : formatINR(e.basic_pay)}
          </span>
          <span className="badge badge-success">
            PT: {formatINR(d.professional_tax)}/mo ({breakdown.state})
          </span>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  suffix = "",
  variant,
  accentColor,
}: {
  label: string;
  value: string;
  suffix?: string;
  variant?: "success" | "danger";
  accentColor: string;
}) {
  return (
    <div
      className="stat-card"
      style={{ "--stat-accent": accentColor } as React.CSSProperties}
    >
      <p className="stat-label">{label}</p>
      <p
        className={`stat-value ${
          variant === "success"
            ? "text-[var(--success)]"
            : variant === "danger"
              ? "text-[var(--danger)]"
              : "text-[var(--text-primary)]"
        }`}
      >
        {value}
        <span className="stat-suffix">{suffix}</span>
      </p>
    </div>
  );
}
