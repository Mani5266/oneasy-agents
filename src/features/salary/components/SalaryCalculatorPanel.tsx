"use client";

import { useState } from "react";
import { calculateSalary, type SalaryBreakdown, formatINR } from "../lib/api";
import { SUPPORTED_STATES } from "../lib/engine/statutory";
import SalaryBreakdownCard from "./SalaryBreakdownCard";

const QUICK_CTCS = [
  { label: "2.4L", value: 240000 },
  { label: "3.6L", value: 360000 },
  { label: "4.8L", value: 480000 },
  { label: "6L", value: 600000 },
  { label: "8L", value: 800000 },
  { label: "10L", value: 1000000 },
  { label: "12L", value: 1200000 },
  { label: "15L", value: 1500000 },
];

export default function SalaryCalculator() {
  const [ctc, setCtc] = useState("");
  const [state, setState] = useState("default");
  const [result, setResult] = useState<SalaryBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCalculate = async (annual_ctc?: number) => {
    const ctcValue = annual_ctc || parseFloat(ctc);
    if (!ctcValue || ctcValue <= 0) {
      setError("Please enter a valid CTC amount");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await calculateSalary(ctcValue, state);
      setResult(data);
    } catch {
      setError("Failed to calculate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
      {/* Input Card */}
      <div className="card p-6">
        <div className="mb-5">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
            CTC Salary Structuring
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">
            Enter the Annual CTC to compute a full salary breakdown with statutory components
          </p>
        </div>

        {/* Input row */}
        <div className="flex gap-3 items-stretch mb-4">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-[13px] font-semibold select-none pointer-events-none">
              &#8377;
            </span>
            <input
              type="number"
              value={ctc}
              onChange={(e) => setCtc(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
              placeholder="Enter Annual CTC (e.g. 480000)"
              className="input-field-lg pl-9"
            />
          </div>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="input-field w-auto min-w-[180px]"
          >
            {SUPPORTED_STATES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleCalculate()}
            disabled={loading}
            className="btn-primary min-w-[140px] flex items-center justify-center gap-2 text-[14px]"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Calculating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Calculate
              </>
            )}
          </button>
        </div>

        {/* Quick CTC pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-[var(--text-faint)] font-medium uppercase tracking-wider mr-1">Quick select</span>
          {QUICK_CTCS.map((q) => (
            <button
              key={q.value}
              onClick={() => {
                setCtc(q.value.toString());
                handleCalculate(q.value);
              }}
              className="pill"
            >
              {q.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="alert alert-error mt-4">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="animate-fade-in">
          <SalaryBreakdownCard breakdown={result} />
        </div>
      )}
    </div>
  );
}
