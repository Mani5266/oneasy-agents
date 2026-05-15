"use client";

import { STEPS } from "../constants";
import { Check } from "lucide-react";

interface Props {
  currentStep: number;
  onClickStep: (i: number) => void;
}

export function ProgressBar({ currentStep, onClickStep }: Props) {
  return (
    <div>
      {/* Tab row */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0">
        {STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;

          return (
            <button
              key={step.id}
              onClick={() => onClickStep(i)}
              className={`
                relative px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer
                ${done
                  ? "text-navy-950 hover:text-gold-700"
                  : active
                    ? "text-navy-950"
                    : "text-slate-400 hover:text-slate-600"
                }
              `}
            >
              <span className="flex items-center gap-1.5">
                {done && <Check className="w-3.5 h-3.5 text-gold-600" strokeWidth={2.5} />}
                {step.label}
              </span>
              {/* Active underline */}
              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-gold-500 to-gold-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom border + progress line */}
      <div className="relative h-[2px] bg-slate-200">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
