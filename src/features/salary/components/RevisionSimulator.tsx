"use client";

import { useState } from "react";
import { calculateSalary, type SalaryBreakdown, formatINR } from "../lib/api";
import { SUPPORTED_STATES } from "../lib/engine/statutory";

export default function RevisionSimulator() {
  const [currentCTC, setCurrentCTC] = useState("");
  const [hikePercent, setHikePercent] = useState("");
  const [state, setState] = useState("default");
  const [results, setResults] = useState<{ percent: number; breakdown: SalaryBreakdown }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSimulate = async () => {
    const ctc = parseFloat(currentCTC);
    if (!ctc || ctc <= 0) {
      setError("Please enter a valid CTC");
      return;
    }

    const customHike = parseFloat(hikePercent);
    const percentages = [5, 10, 15, 20, 25, 30, 50];
    if (customHike && customHike > 0 && !percentages.includes(customHike)) {
      percentages.push(customHike);
      percentages.sort((a, b) => a - b);
    }

    setLoading(true);
    setError("");

    try {
      const all = await Promise.all(
        percentages.map(async (pct) => {
          const newCtc = Math.round(ctc * (1 + pct / 100));
          const breakdown = await calculateSalary(newCtc, state);
          return { percent: pct, breakdown };
        })
      );
      setResults(all);
    } catch {
      setError("Failed to simulate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const baseCTC = parseFloat(currentCTC) || 0;

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
      <div className="card p-6">
        <div className="mb-5">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
            Salary Revision Simulator
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">
            Simulate salary revisions at multiple hike percentages to project net take-home impact
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
                placeholder="e.g. 600000"
                className="input-field pl-9"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Custom Hike % (optional)</label>
            <input
              type="number"
              value={hikePercent}
              onChange={(e) => setHikePercent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSimulate()}
              placeholder="e.g. 35"
              className="input-field"
            />
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

        <button onClick={handleSimulate} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Simulating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Simulate Revisions
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

      {results.length > 0 && (
        <div className="card overflow-hidden animate-fade-in">
          <div className="section-header">
            <h3>Revision Projections from {formatINR(baseCTC)}/yr</h3>
            <span className="badge badge-neutral section-badge">{results.length} scenarios</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Hike %</th>
                <th className="text-right">New CTC</th>
                <th className="text-right">Monthly CTC</th>
                <th className="text-right">Net Take-Home</th>
                <th className="text-right">Net Increase</th>
                <th className="text-right">ESI</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                return (
                  <tr key={r.percent}>
                    <td>
                      <span className="badge badge-info">+{r.percent}%</span>
                    </td>
                    <td className="amount">{formatINR(r.breakdown.annual_ctc)}</td>
                    <td className="amount">{formatINR(r.breakdown.monthly_ctc)}</td>
                    <td className="amount font-bold text-[var(--accent)]">{formatINR(r.breakdown.net_salary_monthly)}/mo</td>
                    <td className="amount text-[var(--accent)]">+{formatINR(r.breakdown.net_salary_annual - (baseCTC > 0 ? results[0]?.breakdown.net_salary_annual * (baseCTC / results[0]?.breakdown.annual_ctc) : 0))}/yr</td>
                    <td className="text-center">
                      {r.breakdown.esi_eligible ? (
                        <span className="badge badge-success">Yes</span>
                      ) : (
                        <span className="badge badge-neutral">No</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
