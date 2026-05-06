"use client";

import { useState } from "react";
import { compareCTC, type CTCComparisonResponse, formatINR } from "../lib/api";
import { SUPPORTED_STATES } from "../lib/engine/statutory";

export default function CTCComparePanel() {
  const [currentCTC, setCurrentCTC] = useState("");
  const [newCTC, setNewCTC] = useState("");
  const [state, setState] = useState("default");
  const [result, setResult] = useState<CTCComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCompare = async () => {
    const curr = parseFloat(currentCTC);
    const next = parseFloat(newCTC);
    if (!curr || curr <= 0 || !next || next <= 0) {
      setError("Please enter valid CTC amounts for both fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await compareCTC(curr, next, state);
      setResult(data);
    } catch {
      setError("Failed to compare. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
      <div className="card p-6">
        <div className="mb-5">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
            CTC Comparison — Hike Analysis
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">
            Compare two CTC structures side-by-side to analyze the impact of a salary revision
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="form-label">Current CTC (Annual)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-[13px] font-semibold select-none pointer-events-none">&#8377;</span>
              <input
                type="number"
                value={currentCTC}
                onChange={(e) => setCurrentCTC(e.target.value)}
                placeholder="e.g. 480000"
                className="input-field pl-9"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Proposed CTC (Annual)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-[13px] font-semibold select-none pointer-events-none">&#8377;</span>
              <input
                type="number"
                value={newCTC}
                onChange={(e) => setNewCTC(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCompare()}
                placeholder="e.g. 600000"
                className="input-field pl-9"
              />
            </div>
          </div>
          <div>
            <label className="form-label">State (for PT)</label>
            <select value={state} onChange={(e) => setState(e.target.value)} className="input-field">
              {SUPPORTED_STATES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Comparing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Compare
            </>
          )}
        </button>

        {error && (
          <div className="alert alert-error mt-4">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {result && (
        <div className="animate-fade-in space-y-4">
          {/* Delta Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DeltaCard label="Hike %" value={`${result.delta.hike_percentage}%`} positive={result.delta.hike_percentage > 0} />
            <DeltaCard label="CTC Change" value={formatINR(result.delta.annual_ctc)} suffix="/yr" positive={result.delta.annual_ctc > 0} />
            <DeltaCard label="Net Salary Change" value={formatINR(result.delta.net_salary_monthly)} suffix="/mo" positive={result.delta.net_salary_monthly > 0} />
            <DeltaCard label="Annual Net Change" value={formatINR(result.delta.net_salary_annual)} suffix="/yr" positive={result.delta.net_salary_annual > 0} />
          </div>

          {/* ESI Flags */}
          {result.flags.esi_threshold_crossing && (
            <div className="alert alert-warning">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              <div>
                <strong>ESI Threshold Crossing:</strong> ESI eligibility changes from{" "}
                {result.flags.esi_current ? "Eligible" : "Not Eligible"} to{" "}
                {result.flags.esi_proposed ? "Eligible" : "Not Eligible"}.
              </div>
            </div>
          )}

          {/* Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card overflow-hidden">
              <div className="section-header">
                <h3>Current ({formatINR(result.current.annual_ctc)}/yr)</h3>
              </div>
              <div className="p-4 space-y-2">
                <Row label="Basic Pay" value={formatINR(result.current.earnings.basic_pay)} />
                <Row label="HRA" value={formatINR(result.current.earnings.hra)} />
                <Row label="Total Earnings" value={formatINR(result.current.earnings.total_earnings)} bold />
                <hr className="divider" />
                <Row label="Total Deductions" value={formatINR(result.current.deductions.total_deductions)} />
                <Row label="Net Salary" value={formatINR(result.current.net_salary_monthly)} suffix="/mo" bold accent />
              </div>
            </div>
            <div className="card overflow-hidden">
              <div className="section-header">
                <h3>Proposed ({formatINR(result.proposed.annual_ctc)}/yr)</h3>
                <span className="badge badge-info section-badge">+{result.delta.hike_percentage}%</span>
              </div>
              <div className="p-4 space-y-2">
                <Row label="Basic Pay" value={formatINR(result.proposed.earnings.basic_pay)} />
                <Row label="HRA" value={formatINR(result.proposed.earnings.hra)} />
                <Row label="Total Earnings" value={formatINR(result.proposed.earnings.total_earnings)} bold />
                <hr className="divider" />
                <Row label="Total Deductions" value={formatINR(result.proposed.deductions.total_deductions)} />
                <Row label="Net Salary" value={formatINR(result.proposed.net_salary_monthly)} suffix="/mo" bold accent />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeltaCard({ label, value, suffix = "", positive }: { label: string; value: string; suffix?: string; positive: boolean }) {
  return (
    <div className="stat-card" style={{ "--stat-accent": positive ? "var(--accent)" : "var(--danger)" } as React.CSSProperties}>
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${positive ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
        {positive ? "+" : ""}{value}
        <span className="stat-suffix">{suffix}</span>
      </p>
    </div>
  );
}

function Row({ label, value, suffix = "", bold = false, accent = false }: { label: string; value: string; suffix?: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className={`text-[13px] ${bold ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>{label}</span>
      <span className={`text-[13px] font-mono ${bold ? "font-bold" : "font-medium"} ${accent ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
        {value}{suffix}
      </span>
    </div>
  );
}
