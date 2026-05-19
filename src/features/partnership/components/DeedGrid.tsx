// -- DeedGrid + DeedCard Components ------------------------------------------
// History grid with responsive cards for each saved deed.

'use client';

import React, { useEffect } from 'react';
import { useDeedList } from '../hooks/useDeedList';
import { useDeedActions } from '../hooks/useDeedActions';
import type { Deed } from '../types';
import { fmtDate } from '../lib/utils';
import { dbGetDeedById } from '../lib/db';
import { downloadFromStorage } from '@/lib/downloadFromStorage';
import { createClient } from '@/lib/supabase/client';
import { requestPaymentForDocument } from '@/hooks/usePaymentGate';

// ---------------------------------------------------------------------------
// DeedCard
// ---------------------------------------------------------------------------

interface DeedCardProps {
  deed: Deed;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onDownloadPdf: (id: string) => void;
}

function DeedCard({
  deed,
  onView,
  onEdit,
  onDuplicate,
  onRegenerate,
  onDelete,
  onDownload,
  onDownloadPdf,
}: DeedCardProps) {
  const p = deed.payload || ({} as Deed['payload']);

  // Build partner names
  let partnerNames: string;
  if (p.partners && Array.isArray(p.partners) && p.partners.length > 0) {
    partnerNames = p.partners.map((pt) => pt.name || 'N/A').join(' & ');
  } else {
    const p1 = deed.partner1_name || p.partner1Name || 'N/A';
    const p2 = deed.partner2_name || p.partner2Name || 'N/A';
    partnerNames = `${p1} & ${p2}`;
  }

  const versionCount = deed._versionCount || 0;
  const hasDoc = !!deed.doc_url;

  return (
    <div className="deed-card" onClick={() => onView(deed.id)}>
      <div className="deed-card-title">M/s. {deed.business_name || 'Untitled'}</div>
      <div className="deed-card-meta">
        {fmtDate(deed.created_at)}
        {versionCount > 1 && ` · ${versionCount} versions`}
      </div>
      <div className="deed-card-partners">{partnerNames}</div>
      <div className="deed-card-actions" onClick={(e) => e.stopPropagation()}>
        {hasDoc && (
          <button onClick={() => onDownload(deed.id)} className="btn btn-download">
            Download
          </button>
        )}
        <button onClick={() => onDownloadPdf(deed.id)} className="btn btn-download">
          PDF
        </button>
        <button onClick={() => onRegenerate(deed.id)} className="btn btn-edit">
          Re-generate
        </button>
        <button onClick={() => onEdit(deed.id)} className="btn btn-dup">
          Edit
        </button>
        <button onClick={() => onDuplicate(deed.id)} className="btn btn-dup">
          Duplicate
        </button>
        <button onClick={() => onDelete(deed.id)} className="btn btn-del">
          Delete
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeedGrid
// ---------------------------------------------------------------------------

interface DeedGridProps {
  onViewDeed: (id: string) => void;
}

export function DeedGrid({ onViewDeed }: DeedGridProps) {
  const { deeds, loading, error, fetchDeeds } = useDeedList();
  const {
    editDeed,
    duplicateDeed,
    deleteDeed,
    regenerateDeed,
    downloadDocument,
  } = useDeedActions({ onRefresh: fetchDeeds });

  useEffect(() => {
    fetchDeeds();
  }, [fetchDeeds]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this partnership deed?')) return;
    await deleteDeed(id);
  };

  const handleDownload = async (id: string) => {
    try {
      const paid = await requestPaymentForDocument('partnership', id);
      if (!paid) return;
      const deed = await dbGetDeedById(id);
      if (!deed) return;
      const docUrl = deed.doc_url;
      if (!docUrl) {
        alert('No document found. Please re-generate it first.');
        return;
      }
      await downloadDocument(docUrl);
    } catch (err) {
      console.error('[DeedGrid] Download failed:', err);
      alert('Failed to download document. Try re-generating.');
    }
  };

  const handleDownloadPdf = async (id: string) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('partnership_documents')
        .select('file_url, file_name')
        .eq('deed_id', id)
        .eq('file_type', 'application/pdf')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!data?.file_url) {
        alert('No PDF found. Please generate the PDF first.');
        return;
      }
      await downloadFromStorage('partnership-docs', data.file_url, data.file_name || 'Partnership Deed.pdf');
    } catch (err) {
      console.error('[DeedGrid] PDF download failed:', err);
      alert('Failed to download PDF. Try re-generating.');
    }
  };

  if (loading) {
    return (
      <div className="grid-empty">
        <span className="spinner" style={{ marginRight: 'var(--space-3)' }} />
        Loading deed history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid-empty" style={{ color: 'var(--error)' }}>
        Failed to load history. {error}
      </div>
    );
  }

  if (!deeds || deeds.length === 0) {
    return (
      <div className="grid-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 'var(--space-4)', opacity: 0.4 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
        </svg>
        <p>No partnership deeds yet.</p>
        <p style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>Create your first deed to see it here.</p>
      </div>
    );
  }

  return (
    <div className="deed-grid">
      {deeds.map((deed) => (
        <DeedCard
          key={deed.id}
          deed={deed}
          onView={onViewDeed}
          onEdit={editDeed}
          onDuplicate={duplicateDeed}
          onRegenerate={regenerateDeed}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onDownloadPdf={handleDownloadPdf}
        />
      ))}
    </div>
  );
}
