// -- Step1Business Component -------------------------------------------------
// Step 1: Business Details pane.

'use client';

import React from 'react';
import { useWizardStore, type WizardState } from '../hooks/useWizardStore';
import { useAINameSuggestions } from '../hooks/useAINameSuggestions';
import { useAIObjective } from '../hooks/useAIObjective';

interface Step1BusinessProps {
  onPrev: () => void;
  onNext: () => void;
}

export function Step1Business({ onPrev, onNext }: Step1BusinessProps) {
  const businessName = useWizardStore((s) => s.businessName);
  const deedDate = useWizardStore((s) => s.deedDate);
  const natureOfBusiness = useWizardStore((s) => s.natureOfBusiness);
  const businessObjectives = useWizardStore((s) => s.businessObjectives);
  const businessDescriptionInput = useWizardStore((s) => s.businessDescriptionInput);
  const showObjectiveOutput = useWizardStore((s) => s.showObjectiveOutput);
  const showNameSuggestions = useWizardStore((s) => s.showNameSuggestions);

  const addrDoorNo = useWizardStore((s) => s.addrDoorNo);
  const addrBuildingName = useWizardStore((s) => s.addrBuildingName);
  const addrArea = useWizardStore((s) => s.addrArea);
  const addrDistrict = useWizardStore((s) => s.addrDistrict);
  const addrState = useWizardStore((s) => s.addrState);
  const addrPincode = useWizardStore((s) => s.addrPincode);

  const partnershipDuration = useWizardStore((s) => s.partnershipDuration);
  const partnershipStartDate = useWizardStore((s) => s.partnershipStartDate);
  const partnershipEndDate = useWizardStore((s) => s.partnershipEndDate);

  const fieldErrors = useWizardStore((s) => s.fieldErrors);
  const setField = useWizardStore((s) => s.setField);
  const updateAddress = useWizardStore((s) => s.updateAddress);
  const clearFieldError = useWizardStore((s) => s.clearFieldError);

  const {
    loading: nameSugLoading,
    error: nameSugError,
    suggestions,
    selectedChip,
    suggestNames,
    selectName,
  } = useAINameSuggestions();

  const {
    loading: objLoading,
    error: objError,
    generateObjective,
  } = useAIObjective();

  const handleField = (key: keyof WizardState, value: string) => {
    setField(key, value as never);
    if (fieldErrors[key as string]) clearFieldError(key as string);

    if ((key as string).startsWith('addr')) {
      setTimeout(() => updateAddress(), 0);
    }
  };

  return (
    <div>
      {/* Business Name + AI Suggest */}
      <div className="form-card">
        <h3 className="form-card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
          </svg>
          Business Information
        </h3>

        <div className="form-grid">
          {/* Business Name */}
          <div className={`field${fieldErrors.businessName ? ' error' : ''}`}>
            <label>
              Business Name <span className="req">*</span>
            </label>
            <div className="business-name-row">
              <input
                type="text"
                value={businessName}
                onChange={(e) => handleField('businessName', e.target.value)}
                placeholder="e.g. Sri Lakshmi Enterprises"
              />
              <button
                onClick={suggestNames}
                disabled={nameSugLoading}
                className="btn-suggest-names"
              >
                {nameSugLoading ? (
                  <span className="spinner-small" />
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                    AI Suggest
                  </>
                )}
              </button>
            </div>
            {fieldErrors.businessName && (
              <p className="field-error-msg">{fieldErrors.businessName}</p>
            )}
            {nameSugError && (
              <p className="field-error-msg">{nameSugError}</p>
            )}

            {/* Name suggestion chips */}
            {showNameSuggestions && suggestions.length > 0 && (
              <div className="name-suggest-container">
                <div className="name-suggest-chips">
                  {suggestions.map((name) => (
                    <button
                      key={name}
                      onClick={() => selectName(name)}
                      className={`name-chip${selectedChip === name ? ' selected' : ''}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date of Deed */}
          <div className={`field${fieldErrors.deedDate ? ' error' : ''}`}>
            <label>
              Date of Deed <span className="req">*</span>
            </label>
            <input
              type="date"
              value={deedDate}
              onChange={(e) => handleField('deedDate', e.target.value)}
            />
            {fieldErrors.deedDate && (
              <p className="field-error-msg">{fieldErrors.deedDate}</p>
            )}
          </div>

          {/* Nature of Business */}
          <div className="field full-width">
            <label>Nature of Business</label>
            <input
              type="text"
              value={natureOfBusiness}
              onChange={(e) => handleField('natureOfBusiness', e.target.value)}
              placeholder="e.g. Retail, Manufacturing, IT Services"
            />
          </div>
        </div>
      </div>

      {/* Registered Address */}
      <div className="form-card" style={{ marginTop: 'var(--space-5)' }}>
        <h3 className="form-card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Registered Address
        </h3>

        <div className="address-grid">
          <div className={`field${fieldErrors.addrDoorNo ? ' error' : ''}`}>
            <label>Door No / Plot No <span className="req">*</span></label>
            <input
              type="text"
              value={addrDoorNo}
              onChange={(e) => handleField('addrDoorNo', e.target.value)}
              placeholder="e.g. 12-3-456"
            />
            {fieldErrors.addrDoorNo && <p className="field-error-msg">{fieldErrors.addrDoorNo}</p>}
          </div>

          <div className="field">
            <label>Building / Flat Name</label>
            <input
              type="text"
              value={addrBuildingName}
              onChange={(e) => handleField('addrBuildingName', e.target.value)}
              placeholder="e.g. Sunrise Apartments"
            />
          </div>

          <div className={`field${fieldErrors.addrArea ? ' error' : ''}`}>
            <label>Area / Locality <span className="req">*</span></label>
            <input
              type="text"
              value={addrArea}
              onChange={(e) => handleField('addrArea', e.target.value)}
              placeholder="e.g. Banjara Hills"
            />
            {fieldErrors.addrArea && <p className="field-error-msg">{fieldErrors.addrArea}</p>}
          </div>

          <div className={`field${fieldErrors.addrDistrict ? ' error' : ''}`}>
            <label>District <span className="req">*</span></label>
            <input
              type="text"
              value={addrDistrict}
              onChange={(e) => handleField('addrDistrict', e.target.value)}
              placeholder="e.g. Hyderabad"
            />
            {fieldErrors.addrDistrict && <p className="field-error-msg">{fieldErrors.addrDistrict}</p>}
          </div>

          <div className={`field${fieldErrors.addrState ? ' error' : ''}`}>
            <label>State <span className="req">*</span></label>
            <input
              type="text"
              value={addrState}
              onChange={(e) => handleField('addrState', e.target.value)}
              placeholder="e.g. Telangana"
            />
            {fieldErrors.addrState && <p className="field-error-msg">{fieldErrors.addrState}</p>}
          </div>

          <div className={`field${fieldErrors.addrPincode ? ' error' : ''}`}>
            <label>Pincode <span className="req">*</span></label>
            <input
              type="text"
              value={addrPincode}
              onChange={(e) => handleField('addrPincode', e.target.value)}
              placeholder="e.g. 500034"
              maxLength={6}
            />
            {fieldErrors.addrPincode && <p className="field-error-msg">{fieldErrors.addrPincode}</p>}
          </div>
        </div>
      </div>

      {/* Partnership Duration */}
      <div className="form-card" style={{ marginTop: 'var(--space-5)', borderLeft: 'none' }}>
        <h3 className="form-card-title">Partnership Duration</h3>
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <label className={`partner-role-toggle${partnershipDuration === 'will' ? '' : ''}`} style={{
            padding: 'var(--space-3) var(--space-4)',
            borderColor: partnershipDuration === 'will' ? 'var(--accent)' : 'var(--border)',
            background: partnershipDuration === 'will' ? 'var(--accent-bg)' : 'transparent',
            color: partnershipDuration === 'will' ? 'var(--accent-dark)' : 'var(--text-muted)',
            fontWeight: partnershipDuration === 'will' ? 600 : 500,
          }}>
            <input
              type="radio"
              name="duration"
              value="will"
              checked={partnershipDuration === 'will'}
              onChange={() => handleField('partnershipDuration', 'will')}
              style={{ display: 'none' }}
            />
            <span style={{
              width: '16px', height: '16px', borderRadius: '50%',
              border: `2px solid ${partnershipDuration === 'will' ? 'var(--accent)' : 'var(--border)'}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {partnershipDuration === 'will' && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
              )}
            </span>
            <span>At Will</span>
          </label>

          <label className="partner-role-toggle" style={{
            padding: 'var(--space-3) var(--space-4)',
            borderColor: partnershipDuration === 'fixed' ? 'var(--accent)' : 'var(--border)',
            background: partnershipDuration === 'fixed' ? 'var(--accent-bg)' : 'transparent',
            color: partnershipDuration === 'fixed' ? 'var(--accent-dark)' : 'var(--text-muted)',
            fontWeight: partnershipDuration === 'fixed' ? 600 : 500,
          }}>
            <input
              type="radio"
              name="duration"
              value="fixed"
              checked={partnershipDuration === 'fixed'}
              onChange={() => handleField('partnershipDuration', 'fixed')}
              style={{ display: 'none' }}
            />
            <span style={{
              width: '16px', height: '16px', borderRadius: '50%',
              border: `2px solid ${partnershipDuration === 'fixed' ? 'var(--accent)' : 'var(--border)'}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {partnershipDuration === 'fixed' && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
              )}
            </span>
            <span>Fixed Duration</span>
          </label>
        </div>

        {partnershipDuration === 'fixed' && (
          <div className="form-grid" style={{ paddingLeft: 'var(--space-4)', borderLeft: '2px solid var(--accent)' }}>
            <div className={`field${fieldErrors.partnershipStartDate ? ' error' : ''}`}>
              <label>Start Date <span className="req">*</span></label>
              <input
                type="date"
                value={partnershipStartDate}
                onChange={(e) => handleField('partnershipStartDate', e.target.value)}
              />
              {fieldErrors.partnershipStartDate && (
                <p className="field-error-msg">{fieldErrors.partnershipStartDate}</p>
              )}
            </div>
            <div className={`field${fieldErrors.partnershipEndDate ? ' error' : ''}`}>
              <label>End Date <span className="req">*</span></label>
              <input
                type="date"
                value={partnershipEndDate}
                onChange={(e) => handleField('partnershipEndDate', e.target.value)}
              />
              {fieldErrors.partnershipEndDate && (
                <p className="field-error-msg">{fieldErrors.partnershipEndDate}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Business Objective Generator */}
      <div className="form-card" style={{ marginTop: 'var(--space-5)', borderLeft: 'none' }}>
        <h3 className="form-card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          AI Business Objective Generator
        </h3>

        <div className="objective-section">
          <p className="objective-hint">Describe your business in a few words</p>
          <div className="objective-input-row">
            <textarea
              value={businessDescriptionInput}
              onChange={(e) => handleField('businessDescriptionInput', e.target.value)}
              placeholder="e.g. We sell organic vegetables online"
              rows={2}
            />
            <button
              onClick={generateObjective}
              disabled={objLoading}
              className="btn-generate-objective"
            >
              {objLoading ? (
                <><span className="spinner-small" /> Generating...</>
              ) : (
                'Generate Objective'
              )}
            </button>
          </div>
          {objError && (
            <p className="field-error-msg">{objError}</p>
          )}

          {showObjectiveOutput && businessObjectives && (
            <div className="objective-output">
              <label>
                Business Objectives
                <span className="objective-editable-tag">Editable</span>
              </label>
              <textarea
                value={businessObjectives}
                onChange={(e) => handleField('businessObjectives', e.target.value)}
                rows={4}
              />
              <p className="field-hint">AI-generated. Feel free to edit as needed.</p>
            </div>
          )}
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
          Next: Clauses
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
