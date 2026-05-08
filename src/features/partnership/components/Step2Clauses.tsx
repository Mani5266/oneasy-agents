// -- Step2Clauses Component --------------------------------------------------
// Step 2: Additional Clauses pane.

'use client';

import React from 'react';
import { useWizardStore } from '../hooks/useWizardStore';

interface Step2ClausesProps {
  onPrev: () => void;
  onNext: () => void;
}

export function Step2Clauses({ onPrev, onNext }: Step2ClausesProps) {
  const interestRate = useWizardStore((s) => s.interestRate);
  const noticePeriod = useWizardStore((s) => s.noticePeriod);
  const accountingYear = useWizardStore((s) => s.accountingYear);
  const additionalPoints = useWizardStore((s) => s.additionalPoints);
  const setField = useWizardStore((s) => s.setField);

  return (
    <div>
      {/* Clauses form card */}
      <div className="form-card">
        <h3 className="form-card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Partnership Clauses
        </h3>

        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {/* Interest Rate */}
          <div className="field">
            <label>Interest Rate (% p.a.)</label>
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setField('interestRate', e.target.value)}
              placeholder="12"
              min={0}
              max={100}
            />
            <p className="field-hint">
              As per Section 40(b)(iv) of Income Tax Act, 1961
            </p>
          </div>

          {/* Notice Period */}
          <div className="field">
            <label>Retirement Notice (months)</label>
            <input
              type="number"
              value={noticePeriod}
              onChange={(e) => setField('noticePeriod', e.target.value)}
              placeholder="3"
              min={1}
              max={24}
            />
            <p className="field-hint">
              Calendar months advance notice for retirement
            </p>
          </div>

          {/* Accounting Year */}
          <div className="field">
            <label>Accounting Year End</label>
            <input
              type="text"
              value={accountingYear}
              onChange={(e) => setField('accountingYear', e.target.value)}
              placeholder="31st March"
            />
            <p className="field-hint">
              Date on which books of accounts are closed yearly
            </p>
          </div>
        </div>

        {/* Additional Points */}
        <div className="field" style={{ marginTop: 'var(--space-6)' }}>
          <label>Additional Terms & Conditions</label>
          <textarea
            value={additionalPoints}
            onChange={(e) => setField('additionalPoints', e.target.value)}
            placeholder="Any extra clauses or points to include in the deed (optional)"
            rows={4}
          />
          <p className="field-hint">
            These will appear as an additional clause in the partnership deed.
          </p>
        </div>
      </div>

      {/* Step Actions */}
      <div className="step-actions">
        <button onClick={onPrev} className="btn btn-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button onClick={onNext} className="btn btn-next">
          Next: Review & Generate
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
