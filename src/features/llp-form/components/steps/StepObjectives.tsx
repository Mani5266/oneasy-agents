"use client";

import { useLLPForm } from "../../hooks/useFormContext";

export function StepObjectives() {
  const { data, updateField } = useLLPForm();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Business Objectives</h2>
        <p className="text-sm text-slate-500">Describe the LLP&apos;s business activities and any additional clauses.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Business Objectives</label>
        <textarea
          value={data.businessObjectives}
          onChange={(e) => updateField("businessObjectives", e.target.value)}
          rows={6}
          placeholder="e.g. To carry on the business of software development, IT consulting, and related services..."
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-y"
        />
        <p className="text-xs text-slate-400 mt-1">This will appear in the &quot;Objects of the LLP&quot; section of the deed.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Other Points / Special Clauses (optional)</label>
        <textarea
          value={data.otherPoints}
          onChange={(e) => updateField("otherPoints", e.target.value)}
          rows={4}
          placeholder="Any additional clauses, non-compete agreements, intellectual property terms, etc."
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-y"
        />
      </div>
    </div>
  );
}
