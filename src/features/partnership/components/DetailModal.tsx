// -- DetailModal Component ----------------------------------------------------
// Modal overlay showing deed details, partner info, version history,
// and action buttons.

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import type { Deed, DeedDocument } from '../types';
import { fmtDate, formatFileSize } from '../lib/utils';
import { dbGetDeedById, dbGetDocumentVersions } from '../lib/db';
import { useDeedActions } from '../hooks/useDeedActions';
import { requestPaymentForDocument } from '@/hooks/usePaymentGate';

// -- Props --

interface DetailModalProps {
  deedId: string | null;
  onClose: () => void;
  onRefresh?: () => void;
}

// -- Helper: build detail rows from deed --

type DetailRow = [label: string, value: string];

function buildDetailRows(deed: Deed): DetailRow[] {
  const p = deed.payload || ({} as Deed['payload']);
  const rows: DetailRow[] = [];

  rows.push(['Business Name', `M/s. ${deed.business_name || 'N/A'}`]);

  const dbPartners = deed._partners || [];
  const storedPartners = p.partners || [];

  if (dbPartners.length > 0) {
    dbPartners.forEach((pt, i) => {
      const roles: string[] = [];
      if (pt.is_managing_partner) roles.push('Managing');
      if (pt.is_bank_authorized) roles.push('Bank Auth');
      const roleStr = roles.length > 0 ? ` [${roles.join(', ')}]` : '';
      rows.push([`Partner ${i + 1}`, (pt.name || 'N/A') + roleStr]);
    });
  } else if (storedPartners.length > 0) {
    storedPartners.forEach((pt, i) => {
      const roles: string[] = [];
      if (pt.isManagingPartner) roles.push('Managing');
      if (pt.isBankAuthorized) roles.push('Bank Auth');
      const roleStr = roles.length > 0 ? ` [${roles.join(', ')}]` : '';
      rows.push([`Partner ${i + 1}`, (pt.name || 'N/A') + roleStr]);
    });
  } else {
    rows.push(['Partner 1', deed.partner1_name || p.partner1Name || 'N/A']);
    rows.push(['Partner 2', deed.partner2_name || p.partner2Name || 'N/A']);
  }

  rows.push(['Date of Deed', p.deedDate || 'N/A']);

  if (p.partnershipDuration === 'fixed') {
    rows.push(['Duration', `Fixed: ${p.partnershipStartDate || '\u2014'} to ${p.partnershipEndDate || '\u2014'}`]);
  } else {
    rows.push(['Duration', 'At Will of the Partners']);
  }

  rows.push(['Nature', p.natureOfBusiness || 'N/A']);

  const dbAddr = deed._address;
  if (dbAddr && dbAddr.full_address) {
    rows.push(['Registered Address', dbAddr.full_address]);
  } else {
    rows.push(['Registered Address', p.registeredAddress || 'N/A']);
  }

  if (dbPartners.length > 0) {
    const capStr = dbPartners.map((pt, i) => `P${i + 1}: ${pt.capital_pct ?? 0}%`).join(' / ');
    const profStr = dbPartners.map((pt, i) => `P${i + 1}: ${pt.profit_pct ?? 0}%`).join(' / ');
    rows.push(['Capital', capStr]);
    rows.push(['Profit', profStr]);
  } else if (storedPartners.length > 0) {
    const capStr = storedPartners.map((pt, i) => `P${i + 1}: ${pt.capital || 0}%`).join(' / ');
    const profStr = storedPartners.map((pt, i) => `P${i + 1}: ${pt.profit || 0}%`).join(' / ');
    rows.push(['Capital', capStr]);
    rows.push(['Profit', profStr]);
  } else {
    rows.push(['Capital (P1/P2)', `${p.partner1Capital || 0}% / ${p.partner2Capital || 0}%`]);
    rows.push(['Profit (P1/P2)', `${p.partner1Profit || 0}% / ${p.partner2Profit || 0}%`]);
  }

  rows.push(['Bank Operation', p.bankOperation === 'either' ? 'Either' : 'Jointly']);
  rows.push(['Interest Rate', `${p.interestRate || '12'}% p.a.`]);
  rows.push(['Notice Period', `${p.noticePeriod || '3'} months`]);

  return rows;
}

// -- Component --

export default function DetailModal({ deedId, onClose, onRefresh }: DetailModalProps) {
  const [deed, setDeed] = useState<Deed | null>(null);
  const [versions, setVersions] = useState<DeedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { editDeed, duplicateDeed, deleteDeed, regenerateDeed, downloadDocument } =
    useDeedActions({ onRefresh });

  const loadDeed = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const [d, vers] = await Promise.all([
        dbGetDeedById(id),
        dbGetDocumentVersions(id),
      ]);
      if (!d) {
        setError('Deed not found');
        return;
      }
      setDeed(d);
      setVersions(vers);
    } catch (err) {
      console.error('[DetailModal] Load failed:', err);
      setError('Failed to load deed details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (deedId) loadDeed(deedId);
  }, [deedId, loadDeed]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!deedId) return;
    const prev = document.activeElement as HTMLElement | null;
    modalRef.current?.focus();
    return () => prev?.focus();
  }, [deedId]);

  if (!deedId) return null;

  const details = deed ? buildDetailRows(deed) : [];
  const hasDoc = !!deed?.doc_url;

  const handleEdit = async () => {
    if (!deed) return;
    await editDeed(deed.id);
    onClose();
  };

  const handleDuplicate = async () => {
    if (!deed) return;
    await duplicateDeed(deed.id);
    onClose();
  };

  const handleDelete = async () => {
    if (!deed) return;
    if (!window.confirm('Delete this partnership deed?')) return;
    await deleteDeed(deed.id);
    onClose();
  };

  const handleRegenerate = async () => {
    if (!deed) return;
    await regenerateDeed(deed.id);
    onClose();
  };

  const handleDownloadLatest = async () => {
    if (!deed?.doc_url) return;
    try {
      const paid = await requestPaymentForDocument('partnership', deed.id);
      if (!paid) return;
      await downloadDocument(deed.doc_url);
    } catch {
      alert('Failed to download document.');
    }
  };

  const handleVersionDownload = async (storagePath: string, fileName: string) => {
    if (!deed) return;
    try {
      const paid = await requestPaymentForDocument('partnership', deed.id);
      if (!paid) return;
      await downloadDocument(storagePath, fileName);
    } catch {
      alert('Failed to download this version.');
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ outline: 'none' }}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {deed ? `M/s. ${deed.business_name || 'Deed Details'}` : 'Loading...'}
          </h2>
          <button onClick={onClose} className="modal-close" aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {loading && (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Loading deed details...
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--error)', fontSize: 'var(--text-sm)' }}>
              {error}
            </div>
          )}

          {!loading && !error && deed && (
            <>
              {details.map(([label, value], i) => (
                <div key={i} className="modal-row">
                  <span className="modal-row-label">{label}</span>
                  <span className="modal-row-value">{value}</span>
                </div>
              ))}

              {/* Version history */}
              {versions.length > 0 && (
                <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '2px solid var(--border-light)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-main)', marginBottom: 'var(--space-3)' }}>
                    Document Versions ({versions.length})
                  </div>
                  {versions.map((ver) => {
                    const sizeStr = ver.file_size ? formatFileSize(ver.file_size) : '';
                    const genDate = ver.generated_at ? fmtDate(ver.generated_at) : '';
                    return (
                      <div key={ver.id} className="modal-row">
                        <span className="modal-row-label">
                          <strong style={{ color: 'var(--accent)' }}>v{ver.version}</strong>
                          {' '}{genDate}{sizeStr ? ` · ${sizeStr}` : ''}
                        </span>
                        <button
                          onClick={() => handleVersionDownload(ver.storage_path, ver.file_name)}
                          className="btn btn-dup"
                          style={{ minHeight: 32, fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-3)' }}
                        >
                          Download
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && deed && (
          <div className="modal-footer">
            <button onClick={onClose} className="btn btn-back">Close</button>
            <button onClick={handleDelete} className="btn btn-del">Delete</button>
            <button onClick={handleEdit} className="btn btn-edit">Edit</button>
            <button onClick={handleDuplicate} className="btn btn-dup">Duplicate</button>
            <button onClick={handleRegenerate} className="btn btn-dup">Re-generate</button>
            {hasDoc && (
              <button onClick={handleDownloadLatest} className="btn btn-gen">Download</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
