// ── ProgressBar + WizardTabs Components ──────────────────────────────────────

'use client';

import React from 'react';

// ── Progress Bar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  step: number;
}

const PROGRESS_WIDTHS = ['25%', '50%', '75%', '100%'] as const;

export function ProgressBar({ step }: ProgressBarProps) {
  return (
    <div className="h-[3px] bg-navy-200 rounded-full mb-4">
      <div
        className="h-full bg-accent rounded-full transition-[width] duration-400 ease"
        style={{ width: PROGRESS_WIDTHS[step] ?? '25%' }}
      />
    </div>
  );
}

// ── Wizard Tabs ──────────────────────────────────────────────────────────────

interface WizardTabsProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

const TABS = [
  { step: 0, label: 'Partners', shortLabel: 'Partners' },
  { step: 1, label: 'Business', shortLabel: 'Business' },
  { step: 2, label: 'Clauses', shortLabel: 'Clauses' },
  { step: 3, label: 'Review & Generate', shortLabel: 'Review' },
];

export function WizardTabs({ currentStep, onStepClick }: WizardTabsProps) {
  return (
    <nav
      role="tablist"
      className="flex gap-1 mb-5 border-b border-navy-200 overflow-x-auto scrollbar-none"
    >
      {TABS.map(({ step, label, shortLabel }) => {
        const isActive = step === currentStep;
        const isDone = step < currentStep;

        return (
          <button
            key={step}
            role="tab"
            aria-selected={isActive}
            onClick={() => onStepClick(step)}
            className={`
              px-2.5 md:px-4 py-2.5 md:py-3 border-b-2 text-[0.75rem] md:text-[0.82rem] font-medium
              min-h-[40px] md:min-h-[44px] whitespace-nowrap
              transition-all duration-200
              ${
                isActive
                  ? 'text-accent-dark border-accent font-semibold'
                  : isDone
                  ? 'text-green-600 border-transparent'
                  : 'text-navy-500 border-transparent hover:text-navy-800'
              }
            `}
          >
            <span className="hidden md:inline">{label}</span>
            <span className="md:hidden">{shortLabel}</span>
            {isDone && <span className="ml-1">{'\u2713'}</span>}
          </button>
        );
      })}
    </nav>
  );
}
