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
    <div className="progress-bar">
      <div
        className="progress-fill"
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
  { step: 0, label: 'Partners' },
  { step: 1, label: 'Business' },
  { step: 2, label: 'Clauses' },
  { step: 3, label: 'Review & Generate' },
];

export function WizardTabs({ currentStep, onStepClick }: WizardTabsProps) {
  return (
    <nav role="tablist" className="step-tabs">
      {TABS.map(({ step, label }) => {
        const isActive = step === currentStep;
        const isDone = step < currentStep;

        let cls = 'step-tab';
        if (isActive) cls += ' active';
        if (isDone) cls += ' done';

        return (
          <button
            key={step}
            role="tab"
            aria-selected={isActive}
            onClick={() => onStepClick(step)}
            className={cls}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
