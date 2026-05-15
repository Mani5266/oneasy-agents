"use client";

import { useLLPForm } from "../../hooks/useFormContext";
import type { BankAuthority, RemunerationType } from "@/features/llp/types";

export function StepGovernance() {
  const { data, updateField } = useLLPForm();

  const bankOptions: BankAuthority[] = ["Single", "Any Two", "All"];
  const remunerationOptions: RemunerationType[] = ["Fixed", "Percentage", "None"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Governance & Operations</h2>
        <p className="text-sm text-slate-500">Configure bank authority, remuneration, loans, and dispute resolution.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bank Authority</label>
          <select
            value={data.bankAuthority}
            onChange={(e) => updateField("bankAuthority", e.target.value as BankAuthority)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {bankOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <p className="text-xs text-slate-400 mt-1">Who can operate bank accounts</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Remuneration Type</label>
          <select
            value={data.remunerationType}
            onChange={(e) => updateField("remunerationType", e.target.value as RemunerationType)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {remunerationOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {data.remunerationType !== "None" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Remuneration Value</label>
            <input
              type="text"
              value={data.remunerationValue}
              onChange={(e) => updateField("remunerationValue", e.target.value)}
              placeholder={data.remunerationType === "Fixed" ? "e.g. Rs. 50,000/month" : "e.g. Working Partners"}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Arbitration City</label>
          <input
            type="text"
            value={data.arbitrationCity}
            onChange={(e) => updateField("arbitrationCity", e.target.value)}
            placeholder="e.g. Hyderabad"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          <p className="text-xs text-slate-400 mt-1">City for dispute arbitration</p>
        </div>
      </div>

      {/* Loans */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.loansEnabled}
            onChange={(e) => updateField("loansEnabled", e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm font-medium text-slate-700">Allow Partner Loans to LLP</span>
        </label>
        {data.loansEnabled && (
          <div className="max-w-xs">
            <label className="block text-xs font-medium text-slate-600 mb-1">Loan Interest Rate (%)</label>
            <input
              type="number"
              value={data.loanInterestRate}
              onChange={(e) => updateField("loanInterestRate", Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        )}
      </div>
    </div>
  );
}
