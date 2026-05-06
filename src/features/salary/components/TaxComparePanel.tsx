"use client";

import { useState } from "react";
import { compareTaxRegimes, type TaxComparisonResponse, formatINR } from "../lib/api";

export default function TaxComparePanel() {
  const [annualCTC, setAnnualCTC] = useState("");
  const [deductions80C, setDeductions80C] = useState("150000");
  const [deductions80D, setDeductions80D] = useState("25000");
  const [hraExemption, setHraExemption] = useState("0");
  const [result, setResult] = useState<TaxComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCompare = async () => {
    const ctc = parseFloat(annualCTC);
    if (!ctc || ctc <= 0) {
      setError("Please enter a valid Annual CTC");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await compareTaxRegimes(
        ctc,
        parseFloat(deductions80C) || 0,
        parseFloat(deductions80D) || 0,
        parseFloat(hraExemption) || 0,
      );
      setResult(data);
    } catch {
      setError("Failed to compare tax regimes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
      <div className="card p-6">
        <div className="mb-5">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
            Tax Regime Comparison — Old vs New
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">
            Compare tax liability under Old and New tax regimes (FY 2024-25) to find the optimal choice
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="form-label">Annual CTC / Gross Income</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-[13px] font-semibold select-none pointer-events-none">&#8377;</span>
              <input
                type="number"
                value={annualCTC}
                onChange={(e) => setAnnualCTC(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCompare()}
                placeholder="e.g. 1200000"
                className="input-field pl-9"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Section 80C Deductions (max 1.5L)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-[13px] font-semibold select-none pointer-events-none">&#8377;</span>
              <input
                type="number"
                value={deductions80C}
                onChange={(e) => setDeductions80C(e.target.value)}
                placeholder="e.g. 150000"
                className="input-field pl-9"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Section 80D Deductions (max 25K)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-[13px] font-semibold select-none pointer-events-none">&#8377;</span>
              <input
                type="number"
                value={deductions80D}
                onChange={(e) => setDeductions80D(e.target.value)}
                placeholder="e.g. 25000"
                className="input-field pl-9"
              />
            </div>
          </div>
          <div>
            <label className="form-label">HRA Exemption (Old Regime Only)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-[13px] font-semibold select-none pointer-events-none">&#8377;</span>
              <input
                type="number"
                value={hraExemption}
                onChange={(e) => setHraExemption(e.target.value)}
                placeholder="e.g. 96000"
                className="input-field pl-9"
              />
            </div>
          </div>
        </div>

        <button onClick={handleCompare} disabled={loading} className="btn-primary flex items-center gap-2">
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              Compare Regimes
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

      {result && (
        <div className="animate-fade-in space-y-4">
          {/* Recommendation */}
          <div className={`card p-5 border-l-4 ${result.recommended === "new" ? "border-l-[var(--accent)]" : "border-l-[var(--warning)]"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${result.recommended === "new" ? "bg-[var(--accent-muted)]" : "bg-[var(--warning-muted)]"}`}>
                <svg className={`w-5 h-5 ${result.recommended === "new" ? "text-[var(--accent)]" : "text-[var(--warning)]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                  {result.recommended === "new" ? "New Regime" : "Old Regime"} is recommended
                </p>
                <p className="text-[13px] text-[var(--text-muted)]">
                  You save {formatINR(result.savings)} per year with the {result.recommended} regime
                </p>
              </div>
            </div>
          </div>

          {/* Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RegimeCard
              title="Old Regime"
              regime={result.old_regime}
              isRecommended={result.recommended === "old"}
            />
            <RegimeCard
              title="New Regime"
              regime={result.new_regime}
              isRecommended={result.recommended === "new"}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RegimeCard({ title, regime, isRecommended }: {
  title: string;
  regime: TaxComparisonResponse["old_regime"];
  isRecommended: boolean;
}) {
  return (
    <div className={`card overflow-hidden ${isRecommended ? "ring-2 ring-[var(--accent)]" : ""}`}>
      <div className="section-header">
        <h3>{title}</h3>
        {isRecommended && <span className="badge badge-success section-badge">Recommended</span>}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center py-1.5">
          <span className="text-[13px] text-[var(--text-muted)]">Taxable Income</span>
          <span className="text-[13px] font-mono font-medium text-[var(--text-primary)]">{formatINR(regime.taxable_income)}</span>
        </div>
        <div className="flex justify-between items-center py-1.5">
          <span className="text-[13px] text-[var(--text-muted)]">Income Tax</span>
          <span className="text-[13px] font-mono font-medium text-[var(--text-primary)]">{formatINR(regime.income_tax)}</span>
        </div>
        <div className="flex justify-between items-center py-1.5">
          <span className="text-[13px] text-[var(--text-muted)]">Health & Education Cess (4%)</span>
          <span className="text-[13px] font-mono font-medium text-[var(--text-primary)]">{formatINR(regime.cess)}</span>
        </div>
        <hr className="divider" />
        <div className="flex justify-between items-center py-1.5">
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">Total Tax</span>
          <span className="text-[15px] font-mono font-bold text-[var(--danger)]">{formatINR(regime.total_tax)}</span>
        </div>
        <div className="flex justify-between items-center py-1.5">
          <span className="text-[13px] text-[var(--text-muted)]">Effective Rate</span>
          <span className="text-[13px] font-mono font-medium text-[var(--text-primary)]">{regime.effective_rate}%</span>
        </div>
      </div>
    </div>
  );
}
