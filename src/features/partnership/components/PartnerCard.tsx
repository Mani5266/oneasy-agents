// ── PartnerCard Component ────────────────────────────────────────────────────

'use client';

import React, { useRef } from 'react';
import { useWizardStore } from '../hooks/useWizardStore';
import type { Partner } from '../types';
import { MIN_PARTNERS, ORDINAL_LABELS } from '../types';

interface PartnerCardProps {
  index: number;
  partner: Partner;
  totalPartners: number;
  onUpdate: (index: number, updates: Partial<Partner>) => void;
  onRemove: (index: number) => void;
  ocrScanning?: boolean;
  ocrDone?: boolean;
  onScanAadhaar?: (file: File, index: number) => void;
}

export function PartnerCard({
  index,
  partner,
  totalPartners,
  onUpdate,
  onRemove,
  ocrScanning,
  ocrDone,
  onScanAadhaar,
}: PartnerCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const fieldErrors = useWizardStore((s) => s.fieldErrors);
  const clearFieldError = useWizardStore((s) => s.clearFieldError);

  const nameError = fieldErrors[`partner_${index}_name`];
  const canRemove = totalPartners > MIN_PARTNERS;

  const handleChange = (field: keyof Partner, value: string | boolean) => {
    onUpdate(index, { [field]: value });
    const errorKey = `partner_${index}_${field}`;
    if (fieldErrors[errorKey]) clearFieldError(errorKey);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onScanAadhaar) {
      onScanAadhaar(file, index);
    }
    e.target.value = '';
  };

  const ordinal = ORDINAL_LABELS[index] ?? `${index + 1}th`;

  return (
    <div className="partner-card">
      {/* Header */}
      <div className="partner-card-header">
        <h4 className="partner-card-title">
          {ordinal} Party (Partner {index + 1})
        </h4>
        <div className="partner-card-actions-top">
          {/* Aadhaar Upload */}
          <label className="btn-aadhaar-upload">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="10" r="3" />
              <path d="M7 20v-1a5 5 0 0 1 10 0v1" />
            </svg>
            <span>Scan Aadhaar</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>

          {/* Remove */}
          {canRemove && (
            <button
              onClick={() => onRemove(index)}
              className="btn-remove-partner"
              title="Remove partner"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* OCR Status */}
      <div className="aadhaar-ocr-status">
        {ocrScanning && (
          <div className="ocr-progress">
            <span className="spinner-small" />
            Scanning with AI...
          </div>
        )}
        {ocrDone && !ocrScanning && (
          <div className="aadhaar-privacy-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Aadhaar data extracted. Image was not stored.
          </div>
        )}
      </div>

      {/* Form Grid */}
      <div className="form-grid">
        {/* Name */}
        <div className={`field${nameError ? ' error' : ''}`}>
          <label>
            Full Name <span className="req">*</span>
          </label>
          <input
            type="text"
            value={partner.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Full name as on Aadhaar"
          />
          {nameError && <p className="field-error-msg">{nameError}</p>}
        </div>

        {/* Relation */}
        <div className="field">
          <label>Relation</label>
          <select
            value={partner.relation}
            onChange={(e) => handleChange('relation', e.target.value)}
          >
            <option value="S/O">S/O (Son of)</option>
            <option value="D/O">D/O (Daughter of)</option>
            <option value="W/O">W/O (Wife of)</option>
          </select>
        </div>

        {/* Father's Name */}
        <div className="field">
          <label>{"Father's / Husband's Name"}</label>
          <input
            type="text"
            value={partner.fatherName}
            onChange={(e) => handleChange('fatherName', e.target.value)}
            placeholder="Father's or Husband's name"
          />
        </div>

        {/* Age */}
        <div className="field">
          <label>Age</label>
          <input
            type="number"
            value={partner.age}
            onChange={(e) => handleChange('age', e.target.value)}
            placeholder="18"
            min={18}
            max={120}
          />
        </div>

        {/* Address — full width */}
        <div className="field full-width">
          <label>Address</label>
          <textarea
            value={partner.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Full residential address"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
