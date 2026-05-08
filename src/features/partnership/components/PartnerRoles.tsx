// ── PartnerRoles Component ───────────────────────────────────────────────────

'use client';

import React from 'react';
import { usePartners } from '../hooks/usePartners';
import { useWizardStore } from '../hooks/useWizardStore';
import { ORDINAL_LABELS } from '../types';

export function PartnerRoles() {
  const {
    partners,
    profitSameAsCapital,
    capitalHint,
    profitHint,
    toggleProfitSync,
    updatePartner,
  } = usePartners();
  const bankOperation = useWizardStore((s) => s.bankOperation);
  const setField = useWizardStore((s) => s.setField);
  const fieldErrors = useWizardStore((s) => s.fieldErrors);

  return (
    <div className="partner-roles-checklist">
      {/* Header */}
      <div className="partner-roles-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
        Partner Roles & Authorizations
      </div>

      {/* Role Rows */}
      <div className="partner-roles-body">
        {partners.map((partner, i) => {
          const ordinal = ORDINAL_LABELS[i] ?? `${i + 1}th`;
          return (
            <div key={i} className="partner-role-row">
              {/* Name */}
              <div className="partner-role-name">
                <span className="partner-role-ordinal">{ordinal}</span>
                <span className="partner-role-display-name">
                  {partner.name || `Partner ${i + 1}`}
                </span>
              </div>

              {/* Role toggles */}
              <div className="partner-role-checks">
                {/* Managing Partner Toggle */}
                <label className="partner-role-toggle">
                  <input
                    type="checkbox"
                    checked={partner.isManagingPartner}
                    onChange={(e) =>
                      updatePartner(i, { isManagingPartner: e.target.checked })
                    }
                  />
                  <span>Managing Partner</span>
                </label>

                {/* Bank Authorized Toggle */}
                <label className="partner-role-toggle">
                  <input
                    type="checkbox"
                    checked={partner.isBankAuthorized}
                    onChange={(e) =>
                      updatePartner(i, { isBankAuthorized: e.target.checked })
                    }
                  />
                  <span>Bank Authorized</span>
                </label>
              </div>

              {/* Capital & Profit inputs */}
              <div className="partner-role-checks">
                {/* Capital % */}
                <label className="partner-role-toggle">
                  <span>Capital</span>
                  <input
                    type="number"
                    value={partner.capital || ''}
                    onChange={(e) => updatePartner(i, { capital: e.target.value })}
                    placeholder="0"
                    min={0}
                    max={100}
                    style={{ width: '60px', textAlign: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px', fontSize: 'var(--text-sm)' }}
                  />
                  <span>%</span>
                </label>

                {/* Profit % */}
                <label className="partner-role-toggle">
                  <span>Profit</span>
                  <input
                    type="number"
                    value={partner.profit || ''}
                    onChange={(e) => updatePartner(i, { profit: e.target.value })}
                    placeholder="0"
                    min={0}
                    max={100}
                    disabled={profitSameAsCapital}
                    style={{ width: '60px', textAlign: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px', fontSize: 'var(--text-sm)', opacity: profitSameAsCapital ? 0.55 : 1 }}
                  />
                  <span>%</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Capital/Profit Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)', margin: 'var(--space-4) 0', paddingLeft: 'var(--space-1)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={profitSameAsCapital}
            onChange={(e) => toggleProfitSync(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-dark)' }}
          />
          Profit / Loss sharing same as Capital
        </label>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginLeft: 'auto', fontSize: 'var(--text-xs)' }}>
          <span style={{ color: capitalHint.ok ? 'var(--success)' : 'var(--error)' }}>
            Capital: {capitalHint.text}
          </span>
          <span style={{ color: profitHint.ok ? 'var(--success)' : 'var(--error)' }}>
            Profit: {profitHint.text}
          </span>
        </div>
      </div>

      {/* Validation errors */}
      {fieldErrors.managingPartner && (
        <p className="field-error-msg">{fieldErrors.managingPartner}</p>
      )}
      {fieldErrors.bankAuthorized && (
        <p className="field-error-msg">{fieldErrors.bankAuthorized}</p>
      )}
      {fieldErrors.capitalTotal && (
        <p className="field-error-msg">{fieldErrors.capitalTotal}</p>
      )}
      {fieldErrors.profitTotal && (
        <p className="field-error-msg">{fieldErrors.profitTotal}</p>
      )}

      {/* Bank Operation Selector */}
      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-4)' }}>
        <div className="field">
          <label>Bank Account Operation</label>
          <select
            value={bankOperation}
            onChange={(e) => setField('bankOperation', e.target.value)}
            style={{ maxWidth: '320px' }}
          >
            <option value="jointly">Jointly (all authorized partners must sign)</option>
            <option value="either">Either or Survivor (any authorized partner)</option>
          </select>
        </div>
        <p className="field-hint" style={{ marginTop: 'var(--space-2)', paddingLeft: 'var(--space-3)', borderLeft: '2px solid var(--accent)' }}>
          {bankOperation === 'jointly'
            ? 'All bank-authorized partners must jointly sign for transactions.'
            : 'Any bank-authorized partner can independently sign for transactions.'}
        </p>
      </div>
    </div>
  );
}
