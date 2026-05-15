"use client";

import { useState } from "react";
import { useLLPForm } from "../../hooks/useFormContext";
import { fmtINR } from "@/features/llp/types";

export function StepCapital() {
  const { data, setData, updateField } = useLLPForm();
  const [profitSameAsCapital, setProfitSameAsCapital] = useState(true);

  const syncProfitsFromCapital = (contributions: typeof data.contributions) => {
    if (profitSameAsCapital) {
      return contributions.map((c, i) => ({
        partnerIndex: i,
        percentage: c.percentage || 0,
      }));
    }
    return data.profits;
  };

  const updateContribution = (index: number, field: "percentage" | "amount", value: number) => {
    setData((prev) => {
      const contributions = [...prev.contributions];
      contributions[index] = { ...contributions[index], [field]: value };
      if (field === "percentage" && prev.totalCapital > 0) {
        contributions[index].amount = Math.round((value / 100) * prev.totalCapital);
      }
      const profits = profitSameAsCapital
        ? contributions.map((c, i) => ({ partnerIndex: i, percentage: c.percentage || 0 }))
        : prev.profits;
      return { ...prev, contributions, profits };
    });
  };

  const handleTotalCapitalChange = (value: number) => {
    setData((prev) => {
      const contributions = prev.contributions.map((c) => ({
        ...c,
        amount: c.percentage > 0 ? Math.round((c.percentage / 100) * value) : c.amount,
      }));
      const profits = profitSameAsCapital
        ? contributions.map((c, i) => ({ partnerIndex: i, percentage: c.percentage || 0 }))
        : prev.profits;
      return { ...prev, totalCapital: value, contributions, profits };
    });
  };

  const handleToggleProfitSame = (checked: boolean) => {
    setProfitSameAsCapital(checked);
    if (checked) {
      setData((prev) => ({
        ...prev,
        profits: prev.contributions.map((c, i) => ({ partnerIndex: i, percentage: c.percentage || 0 })),
      }));
    }
  };

  const totalPct = data.contributions.reduce((s, c) => s + (c.percentage || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Capital Contributions</h2>
        <p className="text-sm text-slate-500">Set total capital and each partner&apos;s contribution percentage.</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-l-[3px] border-l-gold-400">
        <h3 className="font-bold text-navy-950 text-base mb-5 pb-3 border-b border-slate-100">Total Capital</h3>
        <div className="max-w-sm">
          <label className="block text-sm font-semibold text-navy-950 mb-1.5">Total Capital (INR)<span className="text-red-500">*</span></label>
          <input
            type="number"
            value={data.totalCapital || ""}
            onChange={(e) => handleTotalCapitalChange(Number(e.target.value))}
            placeholder="e.g. 1000000"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500"
          />
          {data.totalCapital > 0 && (
            <p className="text-xs text-slate-500 mt-1.5">Rs. {fmtINR(data.totalCapital)}/-</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-l-[3px] border-l-gold-400">
        <h3 className="font-bold text-navy-950 text-base mb-5 pb-3 border-b border-slate-100">Partner Contributions</h3>
        <div className="space-y-3">
          {data.partners.map((partner, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-sm font-medium text-slate-700 min-w-[120px]">
                {partner.fullName || `Partner ${i + 1}`}
              </span>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="number"
                  value={data.contributions[i]?.percentage || ""}
                  onChange={(e) => updateContribution(i, "percentage", Number(e.target.value))}
                  placeholder="0"
                  className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500"
                />
                <span className="text-xs text-slate-500">%</span>
                {data.contributions[i]?.amount > 0 && (
                  <span className="text-xs text-slate-500 ml-2">
                    = Rs. {fmtINR(data.contributions[i].amount)}/-
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {totalPct > 0 && (
          <div className={`text-sm font-medium mt-3 ${Math.abs(totalPct - 100) < 0.1 ? "text-emerald-600" : "text-red-500"}`}>
            Total: {totalPct}% {Math.abs(totalPct - 100) < 0.1 ? "(Valid)" : "(Must equal 100%)"}
          </div>
        )}
      </div>

      {/* Profit same as capital toggle */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-l-[3px] border-l-gold-400">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={profitSameAsCapital}
            onChange={(e) => handleToggleProfitSame(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-gold-600 focus:ring-gold-500"
          />
          <div>
            <span className="text-sm font-semibold text-navy-950">Profit sharing same as capital contribution?</span>
            <p className="text-xs text-slate-500 mt-0.5">
              {profitSameAsCapital
                ? "Profits will be auto-filled with the same percentages as capital."
                : "You can set different profit percentages in the next step."}
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
