"use client";

import { useLLPForm } from "../../hooks/useFormContext";

export function StepProfits() {
  const { data, setData } = useLLPForm();

  const updateProfit = (index: number, percentage: number) => {
    setData((prev) => {
      const profits = [...prev.profits];
      profits[index] = { ...profits[index], percentage };
      return { ...prev, profits };
    });
  };

  const totalPct = data.profits.reduce((s, p) => s + (p.percentage || 0), 0);

  const equalSplit = () => {
    const pct = Math.round((100 / data.numPartners) * 10) / 10;
    setData((prev) => ({
      ...prev,
      profits: prev.profits.map((p, i) => ({
        ...p,
        percentage: i === prev.numPartners - 1 ? 100 - pct * (prev.numPartners - 1) : pct,
      })),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Profit Sharing</h2>
          <p className="text-sm text-slate-500">Define profit sharing ratio among partners.</p>
        </div>
        <button
          onClick={equalSplit}
          className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
        >
          Equal Split
        </button>
      </div>

      <div className="space-y-3">
        {data.partners.map((partner, i) => (
          <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-sm font-medium text-slate-700 min-w-[120px]">
              {partner.fullName || `Partner ${i + 1}`}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={data.profits[i]?.percentage || ""}
                onChange={(e) => updateProfit(i, Number(e.target.value))}
                placeholder="0"
                className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <span className="text-xs text-slate-500">%</span>
            </div>
          </div>
        ))}
      </div>

      {totalPct > 0 && (
        <div className={`text-sm font-medium ${Math.abs(totalPct - 100) < 0.1 ? "text-emerald-600" : "text-red-500"}`}>
          Total: {totalPct}% {Math.abs(totalPct - 100) < 0.1 ? "(Valid)" : "(Must equal 100%)"}
        </div>
      )}
    </div>
  );
}
