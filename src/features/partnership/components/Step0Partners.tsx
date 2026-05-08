// -- Step0Partners Component ------------------------------------------------
// Step 0: Partners & Roles pane.

'use client';

import React, { useRef } from 'react';
import { usePartners } from '../hooks/usePartners';
import { useAadhaarOCR } from '../hooks/useAadhaarOCR';
import { useWizardStore } from '../hooks/useWizardStore';
import { MAX_PARTNERS, MIN_PARTNERS } from '../types';
import { PartnerCard } from './PartnerCard';
import { PartnerRoles } from './PartnerRoles';

interface Step0PartnersProps {
  onNext: () => void;
}

export function Step0Partners({ onNext }: Step0PartnersProps) {
  const {
    partners,
    addPartner,
    removePartner,
    updatePartner,
    setPartnerCount,
  } = usePartners();

  const {
    scanning,
    done,
    isBulkScanning,
    bulkProgress,
    bulkTotal,
    scanSingle,
    scanBulk,
  } = useAadhaarOCR();

  const bulkFileRef = useRef<HTMLInputElement>(null);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await scanBulk(Array.from(files));
    e.target.value = '';
  };

  const handleCountChange = (delta: number) => {
    setPartnerCount(partners.length + delta);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="partner-toolbar">
        <div className="partner-count-selector">
          <label>Partners:</label>
          <div className="partner-count-controls">
            <button
              onClick={() => handleCountChange(-1)}
              disabled={partners.length <= MIN_PARTNERS}
              className="partner-count-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <input
              type="number"
              min={MIN_PARTNERS}
              max={MAX_PARTNERS}
              value={partners.length}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setPartnerCount(val);
              }}
              className="partner-count-input"
            />
            <button
              onClick={() => handleCountChange(1)}
              disabled={partners.length >= MAX_PARTNERS}
              className="partner-count-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bulk Aadhaar upload */}
        <div className="bulk-aadhaar-upload">
          <label className="btn-bulk-aadhaar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="10" r="3" />
              <path d="M7 20v-1a5 5 0 0 1 10 0v1" />
            </svg>
            Bulk Scan Aadhaar ({partners.length} cards)
            <input
              ref={bulkFileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleBulkUpload}
            />
          </label>
        </div>
      </div>

      {/* Bulk scan progress */}
      {isBulkScanning && (
        <div className="bulk-ocr-progress">
          <div className="ocr-progress">
            <span className="spinner-small" />
            Scanning card {bulkProgress} of {bulkTotal}...
          </div>
          <div className="bulk-ocr-bar">
            <div
              className="bulk-ocr-bar-fill"
              style={{ width: `${bulkTotal > 0 ? (bulkProgress / bulkTotal) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Partner Roles */}
      <PartnerRoles />

      {/* Partner Cards */}
      {partners.map((partner, index) => (
        <PartnerCard
          key={index}
          index={index}
          partner={partner}
          totalPartners={partners.length}
          onUpdate={updatePartner}
          onRemove={removePartner}
          ocrScanning={scanning[index]}
          ocrDone={done[index]}
          onScanAadhaar={(file, idx) => scanSingle(file, idx)}
        />
      ))}

      {/* Add Partner button */}
      {partners.length < MAX_PARTNERS && (
        <button
          onClick={() => addPartner()}
          className="btn-add-partner"
        >
          + Add Partner {partners.length + 1}
        </button>
      )}

      {/* Step actions */}
      <div className="step-actions">
        <span />
        <button onClick={onNext} className="btn btn-next">
          Next: Business Details
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
