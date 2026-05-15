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

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-l-[3px] border-l-gold-400">
        <h3 className="font-bold text-navy-950 text-base mb-5 pb-3 border-b border-slate-100">Objectives</h3>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-navy-950 mb-1.5">Business Objectives<span className="text-red-500">*</span></label>
            <textarea
              value={data.businessObjectives}
              onChange={(e) => updateField("businessObjectives", e.target.value)}
              rows={6}
              placeholder="e.g. To carry on the business of software development, IT consulting, and related services..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500 resize-y"
            />
            <p className="text-xs text-slate-400 mt-1">This will appear in the &quot;Objects of the LLP&quot; section of the deed.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-950 mb-1.5">Other Points / Special Clauses (optional)</label>
            <textarea
              value={data.otherPoints}
              onChange={(e) => updateField("otherPoints", e.target.value)}
              rows={4}
              placeholder="Any additional clauses, non-compete agreements, intellectual property terms, etc."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500 resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
