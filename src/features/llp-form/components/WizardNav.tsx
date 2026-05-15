"use client";

import { STEPS } from "../constants";

interface Props {
  step: number;
  totalSteps: number;
  saving: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function WizardNav({ step, totalSteps, saving, onBack, onNext }: Props) {
  return (
    <div className="mt-8 no-print border-t border-slate-100 pt-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          disabled={step === 0}
          className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-2xl border border-white/50
            shadow-[6px_6px_12px_rgba(0,0,0,0.08),-3px_-3px_8px_rgba(255,255,255,0.9),inset_0_1px_2px_rgba(255,255,255,0.4)]
            hover:shadow-[4px_4px_10px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.9),inset_0_1px_2px_rgba(255,255,255,0.5)]
            active:shadow-[2px_2px_6px_rgba(0,0,0,0.08),inset_2px_2px_4px_rgba(0,0,0,0.04)] active:translate-y-[1px]
            transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Back
        </button>

        {step < totalSteps - 1 && (
          <button
            onClick={onNext}
            disabled={saving}
            className="ml-auto px-6 py-2.5 text-sm font-semibold text-white bg-navy-950 rounded-2xl border border-white/10
              shadow-[6px_6px_12px_rgba(0,0,0,0.15),-3px_-3px_8px_rgba(255,255,255,0.6),inset_0_1px_2px_rgba(255,255,255,0.15)]
              hover:shadow-[4px_4px_10px_rgba(0,0,0,0.18),-2px_-2px_6px_rgba(255,255,255,0.6),inset_0_1px_2px_rgba(255,255,255,0.2)] hover:bg-navy-900
              active:shadow-[2px_2px_6px_rgba(0,0,0,0.12),inset_2px_2px_4px_rgba(0,0,0,0.1)] active:translate-y-[1px]
              transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? "Saving..." : (step === totalSteps - 2 ? "View Agreement" : "Next")}
          </button>
        )}
      </div>
    </div>
  );
}
