"use client";

import { useState, useEffect } from "react";
import { getCalculationHistory, type CalculationHistoryItem, formatINR } from "../lib/api";

export default function HistoryPanel() {
  const [history, setHistory] = useState<CalculationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getCalculationHistory(100);
      setHistory(data);
    } catch {
      // Supabase may not be configured
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="card p-12 text-center">
          <svg className="w-6 h-6 mx-auto animate-spin text-[var(--accent)]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-[13px] text-[var(--text-muted)] mt-3">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Calculation History</h2>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{history.length} record{history.length !== 1 ? "s" : ""} found</p>
        </div>
        <button onClick={loadHistory} className="btn-secondary flex items-center gap-2 text-[13px]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {history.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Employee</th>
                <th className="text-right">Annual CTC</th>
                <th className="text-right">Net Monthly</th>
                <th className="text-right">Net Annual</th>
                <th>ESI</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td className="text-[12px] text-[var(--text-muted)]">
                    {new Date(item.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <span className={`badge ${item.calculation_type === "payslip" ? "badge-info" : item.calculation_type === "batch" ? "badge-warning" : "badge-neutral"}`}>
                      {item.calculation_type}
                    </span>
                  </td>
                  <td className="font-medium text-[var(--text-primary)]">{item.employee_name || "—"}</td>
                  <td className="amount">{formatINR(item.annual_ctc)}</td>
                  <td className="amount font-bold text-[var(--accent)]">{formatINR(item.net_salary_monthly)}</td>
                  <td className="amount">{formatINR(item.net_salary_annual)}</td>
                  <td>
                    {item.esi_eligible ? (
                      <span className="badge badge-success">Yes</span>
                    ) : (
                      <span className="badge badge-neutral">No</span>
                    )}
                  </td>
                  <td className="text-[12px] text-[var(--text-muted)]">{item.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-[var(--text-faint)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[14px] text-[var(--text-muted)]">No calculation history yet</p>
          <p className="text-[12px] text-[var(--text-faint)] mt-1">Calculations will appear here once Supabase is connected</p>
        </div>
      )}
    </div>
  );
}
