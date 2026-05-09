'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOfferForm, FormData } from '../hooks/useOfferForm';
import { useOfferCrud } from '../hooks/useOfferCrud';
import { useToast, Toast } from '../hooks/useToast';
import { buildBreakdown } from '../lib/salary';
import { fmtINR, toWords, formatCardDate, numberToWords } from '../lib/utils';
import { OfferRecord, OfferPayload, FIELD_STEP_MAP } from '../types';
import { createClient } from '@/lib/supabase/client';
import { usePaymentGate } from '@/hooks/usePaymentGate';

// ── Toast Component ──
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="ol-toast-container" aria-live="assertive">
      {toasts.map(t => (
        <div key={t.id} className={`ol-toast ol-toast--${t.type}`}>
          <span>{t.message}</span>
          <button className="ol-toast-close" onClick={() => onDismiss(t.id)}>&times;</button>
        </div>
      ))}
    </div>
  );
}

// ── Logo Upload ──
function LogoUpload({ logo, onLogoChange }: { logo: string; onLogoChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragover, setDragover] = useState(false);

  const processFile = (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) return;
    if (file.size > 500 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => onLogoChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`logo-upload-area${dragover ? ' dragover' : ''}`}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('.logo-remove-btn')) fileRef.current?.click();
      }}
      onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
      onDragLeave={() => setDragover(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragover(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) processFile(file);
      }}
    >
      {!logo ? (
        <div className="logo-placeholder">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          <span>Click or drag &amp; drop to upload logo</span>
          <span className="hint">PNG, JPG or SVG &mdash; max 500 KB</span>
        </div>
      ) : (
        <div className="logo-preview">
          <img src={logo} alt="Company logo preview" />
          <button type="button" className="logo-remove-btn" onClick={(e) => { e.stopPropagation(); onLogoChange(''); }}>&times;</button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }} />
    </div>
  );
}

// ── Detail Modal ──
function DetailModal({ offer, onClose, onEdit, onRegenerate, onDelete, onDuplicate, onDownload }: {
  offer: OfferRecord | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDownload: (id: string) => void;
}) {
  if (!offer) return null;
  const p = offer.payload || {} as OfferPayload;
  const details: [string, string][] = [
    ['Employee', offer.emp_name || 'N/A'],
    ['Designation', offer.designation || p.designation || 'N/A'],
    ['Organization', p.orgName || 'N/A'],
    ['Annual CTC', fmtINR(offer.annual_ctc || 0)],
    ['Joining Date', p.joiningDate || 'N/A'],
    ['Offer Date', p.offerDate || 'N/A'],
    ['Signatory', p.signatoryName || 'N/A'],
    ['Probation', p.probationPeriod || 'N/A'],
  ];

  return (
    <div className="modal-backdrop open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3 className="modal-title">{offer.emp_name || 'Offer Details'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {details.map(([label, value]) => (
            <div key={label} className="modal-detail-row">
              <span className="modal-detail-label">{label}</span>
              <span className="modal-detail-value">{value}</span>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-back" onClick={onClose}>Close</button>
          <button className="btn btn-delete-modal" onClick={() => { onClose(); onDelete(offer.id); }}>Delete</button>
          <button className="btn btn-edit-modal" onClick={() => { onClose(); onEdit(offer.id); }}>Edit</button>
          <button className="btn btn-duplicate-modal" onClick={() => { onClose(); onDuplicate(offer.id); }}>Duplicate</button>
          {offer.doc_url && <button className="btn btn-download-modal" onClick={() => onDownload(offer.id)}>Download</button>}
          <button className="btn btn-next" onClick={() => { onClose(); onRegenerate(offer.id); }}>Re-generate</button>
        </div>
      </div>
    </div>
  );
}

// ── Main App Component ──
export default function OfferLetterApp() {
  const form = useOfferForm();
  const crud = useOfferCrud();
  const { toasts, showToast, dismissToast } = useToast();

  const [currentPage, setCurrentPage] = useState<'generator' | 'history'>('generator');
  const [currentOfferId, setCurrentOfferId] = useState<string | null>(null);
  const { isPaid, requirePayment, paymentLoading } = usePaymentGate({ agent: 'offerletter', documentId: currentOfferId });
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [sidebarDrafts, setSidebarDrafts] = useState<OfferRecord[]>([]);
  const [modalOffer, setModalOffer] = useState<OfferRecord | null>(null);
  const [generating, setGenerating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSidebar, setLoadingSidebar] = useState(false);

  const serverSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  // ── Fetch sidebar drafts ──
  const fetchSidebarDrafts = useCallback(async () => {
    setLoadingSidebar(true);
    try {
      const data = await crud.getOffers();
      setSidebarDrafts(data.slice(0, 5));
    } catch (e) {
      console.error('Failed to fetch sidebar drafts:', e);
    } finally {
      setLoadingSidebar(false);
    }
  }, [crud]);

  // ── Fetch history ──
  const fetchOffers = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await crud.getOffers();
      setOffers(data);
    } catch (e) {
      console.error('fetchOffers error:', e);
    } finally {
      setLoadingHistory(false);
    }
  }, [crud]);

  // ── Init ──
  useEffect(() => {
    // Load draft from localStorage
    const saved = localStorage.getItem('oneasy_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentOfferId) setCurrentOfferId(parsed.currentOfferId);
        if (parsed.data) {
          form.setFormData(prev => ({ ...prev, ...parsed.data }));
        }
        if (parsed.companyLogo) form.setCompanyLogo(parsed.companyLogo);
        if (parsed.currentStep != null) form.setCurrentStep(parsed.currentStep);
      } catch (e) { console.error('Failed to load draft:', e); }
    }
    fetchSidebarDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save draft to localStorage ──
  const saveDraftToLocal = useCallback(() => {
    const draft = {
      currentStep: form.currentStep,
      currentOfferId,
      data: form.formData,
      companyLogo: form.companyLogo || undefined,
    };
    localStorage.setItem('oneasy_draft', JSON.stringify(draft));
  }, [form.currentStep, form.formData, form.companyLogo, currentOfferId]);

  // ── Debounced server save ──
  const debouncedServerSave = useCallback(() => {
    if (serverSaveTimer.current) clearTimeout(serverSaveTimer.current);
    serverSaveTimer.current = setTimeout(async () => {
      const payload = form.getPayload();
      const empName = payload.empFullName || 'Untitled';
      if (!currentOfferId && empName === 'Untitled' && !payload.orgName && !payload.designation) return;
      try {
        const saved = await crud.saveOffer({
          id: currentOfferId,
          emp_name: empName,
          designation: payload.designation || '',
          annual_ctc: payload.annualCTC || 0,
          payload,
        });
        if (!currentOfferId) {
          setCurrentOfferId(saved.id);
        }
        // Debounced sidebar refresh
        if (sidebarRefreshTimer.current) clearTimeout(sidebarRefreshTimer.current);
        sidebarRefreshTimer.current = setTimeout(() => fetchSidebarDrafts(), 3000);
      } catch (e) { console.error('Auto-save failed:', e); }
    }, 800);
  }, [form, currentOfferId, crud, fetchSidebarDrafts]);

  // On form change, save draft + server
  const handleFieldChange = useCallback((id: string, value: string) => {
    form.updateField(id, value);
  }, [form]);

  // Effect: whenever formData changes, persist
  useEffect(() => {
    saveDraftToLocal();
    debouncedServerSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.formData, form.companyLogo]);

  // ── Reset form ──
  const handleReset = useCallback(async () => {
    // Save current work before clearing
    const payload = form.getPayload();
    const empName = payload.empFullName || '';
    if (currentOfferId || empName || payload.orgName || payload.designation) {
      try {
        const saved = await crud.saveOffer({
          id: currentOfferId,
          emp_name: empName || 'Untitled',
          designation: payload.designation || '',
          annual_ctc: payload.annualCTC || 0,
          payload,
        });
        if (!currentOfferId) setCurrentOfferId(saved.id);
      } catch (e) { console.error('Auto-save before new failed:', e); }
    }
    setCurrentOfferId(null);
    form.resetForm();
    setCurrentPage('generator');
    fetchSidebarDrafts();
  }, [form, currentOfferId, crud, fetchSidebarDrafts]);

  // ── Edit offer ──
  const handleEdit = useCallback(async (id: string) => {
    try {
      const o = await crud.getOfferById(id);
      if (!o) return;
      setCurrentOfferId(o.id);
      form.loadFromPayload(o.payload as unknown as Record<string, unknown>);
      setCurrentPage('generator');
      form.setCurrentStep(0);
      fetchSidebarDrafts();
      setMobileMenuOpen(false);
    } catch (e) { console.error('Failed to load offer for editing:', e); }
  }, [crud, form, fetchSidebarDrafts]);

  // ── Regenerate ──
  const handleRegenerate = useCallback(async (id: string) => {
    try {
      const o = await crud.getOfferById(id);
      if (!o) return;
      setCurrentOfferId(o.id);
      form.loadFromPayload(o.payload as unknown as Record<string, unknown>);
      setCurrentPage('generator');
      form.setCurrentStep(5);
    } catch (e) { console.error('Failed to load offer:', e); }
  }, [crud, form]);

  // ── Duplicate ──
  const handleDuplicate = useCallback(async (id: string) => {
    try {
      const o = await crud.getOfferById(id);
      if (!o) return;
      const payload = { ...(o.payload || {}) } as OfferPayload;
      const newName = `${o.emp_name || 'Untitled'} (Copy)`;
      const saved = await crud.insertOffer({
        emp_name: newName,
        designation: o.designation || payload.designation || '',
        annual_ctc: o.annual_ctc || payload.annualCTC || 0,
        payload,
      });
      setCurrentOfferId(saved.id);
      form.loadFromPayload({ ...payload, empFullName: newName } as unknown as Record<string, unknown>);
      setCurrentPage('generator');
      form.setCurrentStep(0);
      fetchSidebarDrafts();
      showToast('success', `Duplicated offer for "${o.emp_name || 'Untitled'}". Edit and generate.`);
    } catch (e) {
      console.error('Failed to duplicate offer:', e);
      showToast('error', 'Failed to duplicate offer.');
    }
  }, [crud, form, fetchSidebarDrafts, showToast]);

  // ── Delete ──
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this offer letter?')) return;
    try {
      await crud.deleteOffer(id);
      if (currentOfferId === id) setCurrentOfferId(null);
      fetchOffers();
      fetchSidebarDrafts();
    } catch (e) { console.error('Failed to delete offer:', e); }
  }, [crud, currentOfferId, fetchOffers, fetchSidebarDrafts]);

  // ── Download ──
  const handleDownload = useCallback(async (id: string) => {
    const doDownload = async () => {
      try {
        const o = await crud.getOfferById(id);
        if (!o || !o.doc_url) {
          showToast('error', 'No document found. Please re-generate it first.');
          return;
        }
        await crud.downloadDoc(o.doc_url, o.emp_name || 'Employee');
      } catch (e) {
        console.error('Download failed:', e);
        showToast('error', 'Failed to download document. Try re-generating.');
      }
    };
    // Use imperative payment check for history downloads (id may differ from currentOfferId)
    const { requestPaymentForDocument } = await import('@/hooks/usePaymentGate');
    const paid = await requestPaymentForDocument('offerletter', id);
    if (paid) await doDownload();
  }, [crud, showToast]);

  // ── Generate ──
  const handleGenerate = useCallback(async () => {
    const errs = form.validate();
    if (errs) {
      const fieldList = errs.map(e => e.label).join(', ');
      showToast('error', `Please fill required fields: ${fieldList}`);
      return;
    }
    setGenerating(true);
    const payload = form.getPayload();
    const empName = payload.empFullName || 'Untitled';

    // Save first
    try {
      const saved = await crud.saveOffer({
        id: currentOfferId,
        emp_name: empName,
        designation: payload.designation,
        annual_ctc: payload.annualCTC,
        payload,
      });
      setCurrentOfferId(saved.id);
      await fetchSidebarDrafts();

      // Generate DOCX (payment already verified via unlock button)
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/offer-letter/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...payload, _offerId: saved.id }),
      });

      if (!res.ok) {
        let errMsg = 'Generation failed';
        try {
          const errBody = await res.json();
          if (errBody.details && Array.isArray(errBody.details)) errMsg = errBody.details.join('; ');
          else if (errBody.error) errMsg = errBody.error;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const disposition = res.headers.get('Content-Disposition') || '';
      let filename = `Offer_${empName}.docx`;
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match) filename = match[1];

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 150);

      showToast('success', 'Downloaded & saved to cloud!');
      fetchSidebarDrafts();
      if (currentPage === 'history') fetchOffers();
    } catch (e: unknown) {
      showToast('error', (e as Error).message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }, [form, currentOfferId, crud, fetchSidebarDrafts, fetchOffers, currentPage, showToast]);

  // ── Sidebar rename ──
  const handleSidebarRename = useCallback(async (id: string, newName: string) => {
    try {
      await crud.updateOffer(id, { emp_name: newName || 'Untitled' } as Partial<OfferRecord>);
      fetchSidebarDrafts();
      if (currentPage === 'history') fetchOffers();
    } catch (e) { /* silent */ }
  }, [crud, fetchSidebarDrafts, fetchOffers, currentPage]);

  // Switch page
  const switchPage = useCallback((page: 'generator' | 'history') => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    if (page === 'history') fetchOffers();
  }, [fetchOffers]);

  // Step navigation
  const goToStep = useCallback((n: number) => {
    form.setCurrentStep(n);
    contentAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [form]);

  // Salary breakdown
  const ctcVal = parseInt(form.formData.annualCTC) || 0;
  const salaryRows = ctcVal > 0 ? buildBreakdown(ctcVal) : [];

  // ── Render ──
  return (
    <div className="offer-letter-app">
      <div className="app-shell">
        {/* Mobile hamburger */}
        <button className={`mobile-hamburger${mobileMenuOpen ? ' open' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
        <div className={`mobile-overlay${mobileMenuOpen ? ' open' : ''}`} onClick={() => setMobileMenuOpen(false)} />

        {/* Sidebar */}
        <aside className={`sidebar${mobileMenuOpen ? ' mobile-open' : ''}`} aria-label="Sidebar">
          <div className="sidebar-top">
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon">O</div>
              <div className="sidebar-logo-text">
                <span className="sidebar-brand">OnEasy</span>
                <span className="sidebar-brand-sub">Offer Letter Generator</span>
              </div>
            </div>
            <button className="sidebar-new-btn" onClick={handleReset}>
              <span className="sidebar-new-icon">+</span> New Offer Letter
            </button>
            <nav className="sidebar-section" aria-label="Recent offer letters">
              <div className="sidebar-section-header">
                <span className="sidebar-section-title">RECENT OFFER LETTERS</span>
                <button className="sidebar-view-all" onClick={() => switchPage('history')}>View All</button>
              </div>
              <div className="sidebar-drafts">
                {loadingSidebar && <div className="sidebar-empty sidebar-loading">Loading drafts&hellip;</div>}
                {!loadingSidebar && sidebarDrafts.length === 0 && (
                  <div className="sidebar-empty">No drafts yet. Create your first offer letter above.</div>
                )}
                {!loadingSidebar && sidebarDrafts.map(o => (
                  <SidebarDraftItem
                    key={o.id}
                    offer={o}
                    isActive={o.id === currentOfferId}
                    onSelect={() => handleEdit(o.id)}
                    onGenerate={() => handleRegenerate(o.id)}
                    onRename={(name) => handleSidebarRename(o.id, name)}
                    onDelete={() => handleDelete(o.id)}
                  />
                ))}
              </div>
            </nav>
          </div>
          <div className="sidebar-footer">
            <div className="sidebar-bottom-nav">
              <button className={`sidebar-nav-btn${currentPage === 'generator' ? ' active' : ''}`} onClick={() => switchPage('generator')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Generator
              </button>
              <button className={`sidebar-nav-btn${currentPage === 'history' ? ' active' : ''}`} onClick={() => switchPage('history')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                History
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="content-area" ref={contentAreaRef}>
          {currentPage === 'generator' ? (
            <GeneratorPage
              form={form}
              ctcVal={ctcVal}
              salaryRows={salaryRows}
              generating={generating}
              onFieldChange={handleFieldChange}
              onGoToStep={goToStep}
              onGenerate={handleGenerate}
              onReset={handleReset}
              isPaid={isPaid}
              paymentLoading={paymentLoading}
              onUnlock={() => requirePayment(() => {})}
              hasDocumentId={!!currentOfferId}
            />
          ) : (
            <HistoryPage
              offers={offers}
              loading={loadingHistory}
              onRefresh={fetchOffers}
              onEdit={handleEdit}
              onRegenerate={handleRegenerate}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onDownload={handleDownload}
              onView={(id) => { const o = offers.find(x => x.id === id); if (o) setModalOffer(o); }}
              onGoToGenerator={() => switchPage('generator')}
            />
          )}
        </main>
      </div>

      {/* Modal */}
      {modalOffer && (
        <DetailModal
          offer={modalOffer}
          onClose={() => setModalOffer(null)}
          onEdit={handleEdit}
          onRegenerate={handleRegenerate}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onDownload={handleDownload}
        />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ── Sidebar Draft Item ──
function SidebarDraftItem({ offer, isActive, onSelect, onGenerate, onRename, onDelete }: {
  offer: OfferRecord;
  isActive: boolean;
  onSelect: () => void;
  onGenerate: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(offer.emp_name || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  const saveRename = () => {
    setEditing(false);
    onRename(editValue.trim());
  };

  return (
    <div className={`sidebar-draft-item${isActive ? ' active' : ''}`} onClick={(e) => {
      if (!(e.target as HTMLElement).closest('.sidebar-draft-actions')) onSelect();
    }}>
      <div className="sidebar-draft-header">
        <div className="sidebar-draft-info">
          {editing ? (
            <input ref={inputRef} className="sidebar-draft-edit-input" value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveRename}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); inputRef.current?.blur(); } if (e.key === 'Escape') setEditing(false); }}
            />
          ) : (
            <div className="sidebar-draft-name">{offer.emp_name || 'Untitled'}</div>
          )}
          {offer.designation && <div className="sidebar-draft-designation">{offer.designation}</div>}
          <div className="sidebar-draft-meta">{formatCardDate(offer.created_at)}</div>
        </div>
        <div className="sidebar-draft-actions">
          <button className="sidebar-draft-action sidebar-action-generate" title="Generate Doc" onClick={(e) => { e.stopPropagation(); onGenerate(); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </button>
          <button className="sidebar-draft-action sidebar-action-edit" title="Rename" onClick={(e) => { e.stopPropagation(); setEditValue(offer.emp_name || ''); setEditing(true); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </button>
          <button className="sidebar-draft-action sidebar-action-delete" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Generator Page ──
function GeneratorPage({ form, ctcVal, salaryRows, generating, onFieldChange, onGoToStep, onGenerate, onReset, isPaid, paymentLoading, onUnlock, hasDocumentId }: {
  form: ReturnType<typeof useOfferForm>;
  ctcVal: number;
  salaryRows: ReturnType<typeof buildBreakdown>;
  generating: boolean;
  onFieldChange: (id: string, value: string) => void;
  onGoToStep: (n: number) => void;
  onGenerate: () => void;
  onReset: () => void;
  isPaid: boolean;
  paymentLoading: boolean;
  onUnlock: () => void;
  hasDocumentId: boolean;
}) {
  const step = form.currentStep;
  const d = form.formData;
  const errors = form.errors;

  const hasError = (id: string) => errors.some(e => e.id === id);
  const getError = (id: string) => errors.find(e => e.id === id)?.message || '';

  const STEP_LABELS = ['Company', 'Employee', 'Compensation', 'Employment', 'Policies', 'Review & Generate'];

  return (
    <div className="generator-page">
      <div className="generator-top-bar">
        <button className="btn-refresh-nav" onClick={onReset} title="Reset form and start over">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
      </div>
      <div className="content-header">
        <h1 className="page-title">Offer Letter</h1>
        <p className="page-subtitle">Fill in the details below to generate your offer letter</p>
        <div className="progress-wrap"><div className="progress-bar" data-step={step}></div></div>
        <nav className="steps-nav" role="tablist" aria-label="Form steps">
          {STEP_LABELS.map((label, i) => (
            <button key={i} className={`step-tab${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}
              role="tab" aria-selected={i === step} onClick={() => onGoToStep(i)}>{label}</button>
          ))}
        </nav>
      </div>
      <div className="form-card">
        {/* Step 0: Company */}
        <div className={`step-pane${step === 0 ? ' active' : ''}`}>
          <div className="step-title">Company Information</div>
          <div className="step-desc">This appears on the letterhead and throughout the document.</div>
          <p className="required-legend"><span className="req">*</span> indicates a required field</p>

          <div className="field">
            <label>Company Logo</label>
            <LogoUpload logo={form.companyLogo} onLogoChange={(v) => form.setCompanyLogo(v)} />
          </div>
          <Field id="orgName" label="Organization Name" required value={d.orgName} onChange={onFieldChange} error={hasError('orgName')} errorMsg={getError('orgName')} placeholder="Full registered company name" />
          <div className="row">
            <Field id="entityType" label="Entity Type" required value={d.entityType} onChange={onFieldChange} type="select" options={[
              { value: 'Company', label: 'Company' }, { value: 'Proprietorship', label: 'Proprietorship' },
              { value: 'Partnership', label: 'Partnership' }, { value: 'LLP', label: 'LLP' }, { value: 'Firm', label: 'Firm' },
            ]} />
            <Field id="cin" label="CIN / Registration No." value={d.cin} onChange={onFieldChange} placeholder="e.g. U74999TG2021PTC154890" />
          </div>
          <Field id="officeAddress" label="Registered Office Address" required value={d.officeAddress} onChange={onFieldChange} error={hasError('officeAddress')} errorMsg={getError('officeAddress')} type="textarea" placeholder="Address as per registered business document..." />
          <div className="row">
            <Field id="signatoryName" label="Authorized Signatory Name" required value={d.signatoryName} onChange={onFieldChange} error={hasError('signatoryName')} errorMsg={getError('signatoryName')} placeholder="Name as per PAN" />
            <Field id="signatoryDesig" label="Signatory Designation" required value={d.signatoryDesig} onChange={onFieldChange} error={hasError('signatoryDesig')} errorMsg={getError('signatoryDesig')} placeholder="e.g. Director" />
          </div>
          <Field id="firstAid" label="First-Aid Kit Location" value={d.firstAid} onChange={onFieldChange} placeholder="e.g. HR Room, Reception" />
          <div className="btn-row">
            <button className="btn btn-next" onClick={() => onGoToStep(1)}>Employee Details &rarr;</button>
          </div>
        </div>

        {/* Step 1: Employee */}
        <div className={`step-pane${step === 1 ? ' active' : ''}`}>
          <div className="step-title">Employee Information</div>
          <div className="step-desc">Name must match PAN card. Address must match Aadhaar.</div>
          <div className="row">
            <Field id="salutation" label="Salutation" required value={d.salutation} onChange={onFieldChange} type="select" options={[
              { value: 'Mr.', label: 'Mr.' }, { value: 'Mrs.', label: 'Mrs.' }, { value: 'Ms.', label: 'Ms.' },
            ]} />
            <Field id="empFullName" label="Full Name" required value={d.empFullName} onChange={onFieldChange} error={hasError('empFullName')} errorMsg={getError('empFullName')} placeholder="Full name as per PAN" hint="Auto-populates throughout the entire document" />
          </div>
          <Field id="empAddress" label="Complete Address" value={d.empAddress} onChange={onFieldChange} type="textarea" placeholder="Complete address as per Aadhaar card..." />
          <div className="row">
            <Field id="designation" label="Designation / Job Title" required value={d.designation} onChange={onFieldChange} error={hasError('designation')} errorMsg={getError('designation')} placeholder="e.g. Senior Software Engineer" hint="Auto-populates throughout the entire document" />
            <Field id="employeeId" label="Employee ID" value={d.employeeId} onChange={onFieldChange} placeholder="e.g. OE-2026-001" hint="Appears in Annexure B acknowledgement section" />
          </div>
          <div className="row">
            <Field id="reportingManager" label="Reporting Manager's Designation" value={d.reportingManager} onChange={onFieldChange} placeholder="e.g. Engineering Manager" />
          </div>
          <Field id="attendanceSystem" label="Attendance System" value={d.attendanceSystem} onChange={onFieldChange} type="select" options={[
            { value: 'biometric attendance system', label: 'Biometric' },
            { value: 'digital attendance system', label: 'Digital' },
            { value: 'manual attendance register', label: 'Manual Register' },
          ]} />
          <div className="btn-row">
            <button className="btn btn-back" onClick={() => onGoToStep(0)}>&larr; Back</button>
            <button className="btn btn-next" onClick={() => onGoToStep(2)}>Compensation &rarr;</button>
          </div>
        </div>

        {/* Step 2: Compensation */}
        <div className={`step-pane${step === 2 ? ' active' : ''}`}>
          <div className="step-title">Compensation</div>
          <div className="step-desc">Enter Annual CTC - salary breakdown (Annexure A) is auto-calculated.</div>
          <div className={`field${hasError('annualCTC') ? ' error' : ''}`}>
            <label htmlFor="annualCTC">Annual CTC <span className="req">*</span></label>
            <div className="prefix-wrap">
              <span className="prefix">&#8377;</span>
              <input type="number" id="annualCTC" value={d.annualCTC} onChange={(e) => onFieldChange('annualCTC', e.target.value)} placeholder="e.g. 600000" min="1" />
            </div>
            {ctcVal > 0 && <div className="salary-words">Rupees {toWords(ctcVal)} Only (per annum)</div>}
            {hasError('annualCTC') && <div className="field-error-msg">{getError('annualCTC')}</div>}
          </div>
          {salaryRows.length > 0 && (
            <div className="salary-box">
              <h4>Auto-Calculated Salary Breakdown (Annexure A)</h4>
              <table className="st">
                <thead><tr><th>Description</th><th>Monthly (Rs.)</th><th>Annual (Rs.)</th></tr></thead>
                <tbody>
                  {salaryRows.map((row, i) => (
                    <tr key={i} className={row.type === 'total' ? 'total-row' : ''}>
                      <td>{row.label}</td>
                      <td>{fmtINR(row.monthly)}</td>
                      <td>{fmtINR(row.annual)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="hint hint--spaced">Standard Indian payroll structure. Subject to statutory deductions.</div>
            </div>
          )}
          <div className="btn-row">
            <button className="btn btn-back" onClick={() => onGoToStep(1)}>&larr; Back</button>
            <button className="btn btn-next" onClick={() => onGoToStep(3)}>Employment Terms &rarr;</button>
          </div>
        </div>

        {/* Step 3: Employment Terms */}
        <div className={`step-pane${step === 3 ? ' active' : ''}`}>
          <div className="step-title">Employment Terms</div>
          <div className="step-desc">Dates, working hours, and probation - these appear in both letters.</div>
          <div className="row">
            <Field id="offerDate" label="Offer Letter Date" required value={d.offerDate} onChange={onFieldChange} error={hasError('offerDate')} errorMsg={getError('offerDate')} type="date" />
            <Field id="offerValidity" label="Offer Validity Date" required value={d.offerValidity} onChange={onFieldChange} error={hasError('offerValidity')} errorMsg={getError('offerValidity')} type="date" />
          </div>
          <div className="row">
            <Field id="joiningDate" label="Date of Joining" required value={d.joiningDate} onChange={onFieldChange} error={hasError('joiningDate')} errorMsg={getError('joiningDate')} type="date" />
            <div className={`field${hasError('customProbationValue') ? ' error' : ''}`}>
              <label htmlFor="probationPeriod">Probation Period <span className="req">*</span></label>
              <select id="probationPeriod" value={d.probationPeriod} onChange={(e) => onFieldChange('probationPeriod', e.target.value)}>
                <option value="3 (three) months">3 months</option>
                <option value="6 (six) months">6 months</option>
                <option value="12 (twelve) months">12 months</option>
                <option value="custom">Custom</option>
              </select>
              {d.probationPeriod === 'custom' && (
                <div className="row row--inline" style={{ marginTop: '.5rem' }}>
                  <input type="number" id="customProbationValue" value={d.customProbationValue} onChange={(e) => onFieldChange('customProbationValue', e.target.value)} min="1" placeholder="Enter number" style={{ flex: 1, maxWidth: 140 }} />
                  <select id="customProbationUnit" value={d.customProbationUnit} onChange={(e) => onFieldChange('customProbationUnit', e.target.value)} style={{ flex: 1, maxWidth: 140 }}>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              )}
              {hasError('customProbationValue') && <div className="field-error-msg">{getError('customProbationValue')}</div>}
            </div>
          </div>
          <div className="field">
            <label>Working Days <span className="req">*</span></label>
            <div className="row row--inline">
              <select id="workDayFrom" value={d.workDayFrom} onChange={(e) => onFieldChange('workDayFrom', e.target.value)}>
                <option value="Monday">Monday</option><option value="Tuesday">Tuesday</option><option value="Wednesday">Wednesday</option>
              </select>
              <span className="day-separator">to</span>
              <select id="workDayTo" value={d.workDayTo} onChange={(e) => onFieldChange('workDayTo', e.target.value)}>
                <option value="Friday">Friday</option><option value="Saturday">Saturday</option><option value="Sunday">Sunday</option>
              </select>
            </div>
          </div>
          <div className="row-3">
            <Field id="workStart" label="Work Start Time" required value={d.workStart} onChange={onFieldChange} type="time" />
            <Field id="workEnd" label="Work End Time" required value={d.workEnd} onChange={onFieldChange} type="time" />
            <Field id="breakDuration" label="Break Duration" required value={d.breakDuration} onChange={onFieldChange} placeholder="e.g. 1 (one) hour" />
          </div>
          <div className="btn-row">
            <button className="btn btn-back" onClick={() => onGoToStep(2)}>&larr; Back</button>
            <button className="btn btn-next" onClick={() => onGoToStep(4)}>Policies &rarr;</button>
          </div>
        </div>

        {/* Step 4: Policies */}
        <div className={`step-pane${step === 4 ? ' active' : ''}`}>
          <div className="step-title">Leave &amp; Termination Policies</div>
          <div className="step-desc">Standard defaults are pre-filled - edit as needed for your company.</div>
          <div className="row">
            <Field id="monthlyLeave" label="Monthly Leave Entitlement" value={d.monthlyLeave} onChange={onFieldChange} />
            <Field id="carryForward" label="Max Carry Forward Days" value={d.carryForward} onChange={onFieldChange} />
          </div>
          <div className="row">
            <Field id="noticePeriod" label="Employee Notice Period" required value={d.noticePeriod} onChange={onFieldChange} />
            <Field id="abscondDays" label="Absconding Threshold" value={d.abscondDays} onChange={onFieldChange} />
          </div>
          <div className="btn-row">
            <button className="btn btn-back" onClick={() => onGoToStep(3)}>&larr; Back</button>
            <button className="btn btn-next" onClick={() => onGoToStep(5)}>Review &amp; Generate &rarr;</button>
          </div>
        </div>

        {/* Step 5: Review & Generate */}
        <div className={`step-pane${step === 5 ? ' active' : ''}`}>
          <div className="step-title">Review &amp; Generate</div>
          <div className="step-desc">Verify all fields before generating the DOCX file.</div>
          <div className="review-grid">
            <div className="rv-card">
              <h4>Company</h4>
              {form.companyLogo && <div className="rv-row"><span>Logo</span><img src={form.companyLogo} alt="Logo" className="rv-logo-thumb" /></div>}
              <div className="rv-row"><span>Name</span><strong>{d.orgName || '\u2014'}</strong></div>
              <div className="rv-row"><span>Signatory</span><strong>{d.signatoryName || '\u2014'}</strong></div>
            </div>
            <div className="rv-card">
              <h4>Employee</h4>
              <div className="rv-row"><span>Name</span><strong>{d.empFullName || '\u2014'}</strong></div>
              <div className="rv-row"><span>Designation</span><strong>{d.designation || '\u2014'}</strong></div>
            </div>
            <div className="rv-card">
              <h4>Compensation</h4>
              <div className="rv-row"><span>Annual CTC</span><strong>{ctcVal > 0 ? fmtINR(ctcVal) : '\u2014'}</strong></div>
            </div>
          </div>
          {generating && (
            <div className="spinner-wrap">
              <div className="spinner"></div>
              <div className="gen-text">Generating your document...</div>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginBottom: '16px' }}>
            {!isPaid ? (
              <button
                onClick={onUnlock}
                disabled={paymentLoading || !hasDocumentId}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 24px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)', color: '#fff',
                  fontWeight: 700, fontSize: '14px',
                  boxShadow: '0 4px 14px rgba(30,58,95,0.25)',
                  transition: 'all 0.2s', opacity: paymentLoading || !hasDocumentId ? 0.5 : 1,
                }}
              >
                {paymentLoading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Unlock Document
                    <span style={{ padding: '2px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', fontSize: '12px', fontWeight: 800 }}>&#8377;199</span>
                  </>
                )}
              </button>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', fontSize: '12px', fontWeight: 700,
                color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '9999px',
              }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Paid
              </span>
            )}
          </div>
          <div className="btn-row btn-row--centered">
            <button className="btn btn-back" onClick={() => onGoToStep(4)}>&larr; Back</button>
            {isPaid && <button className="btn btn-gen" onClick={onGenerate} disabled={generating}>Generate DOCX</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── History Page ──
function HistoryPage({ offers, loading, onRefresh, onEdit, onRegenerate, onDuplicate, onDelete, onDownload, onView, onGoToGenerator }: {
  offers: OfferRecord[];
  loading: boolean;
  onRefresh: () => void;
  onEdit: (id: string) => void;
  onRegenerate: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onView: (id: string) => void;
  onGoToGenerator: () => void;
}) {
  return (
    <div className="history-page">
      <div className="history-container">
        <div className="history-header">
          <div>
            <h2 className="history-title">All Offer Letters</h2>
            <p className="history-subtitle">View and manage your previously generated offer letters.</p>
          </div>
          <button className="btn-refresh" onClick={onRefresh}>Refresh</button>
        </div>
        {loading && <div className="sidebar-empty sidebar-loading history-grid-status">Loading offer history&hellip;</div>}
        {!loading && offers.length === 0 && (
          <div className="history-empty">
            <h3>No offer letters yet</h3>
            <p>Generate your first offer letter to see it here.</p>
            <button className="btn btn-next btn-go-generator" onClick={onGoToGenerator}>Go to Generator &rarr;</button>
          </div>
        )}
        {!loading && offers.length > 0 && (
          <div className="history-grid">
            {offers.map(o => {
              const p = o.payload || {} as OfferPayload;
              return (
                <div key={o.id} className="offer-card">
                  <h3 className="offer-card-name">{o.emp_name || 'Unknown'}</h3>
                  <div className="offer-card-date">Generated on {formatCardDate(o.created_at)}</div>
                  {o.doc_url && <div className="offer-card-badge">Document saved</div>}
                  <div className="offer-card-divider"></div>
                  <div className="offer-card-details">
                    <div className="offer-detail-row"><span className="offer-detail-label">Organization</span><span className="offer-detail-value">{p.orgName || 'N/A'}</span></div>
                    <div className="offer-detail-row"><span className="offer-detail-label">Designation</span><span className="offer-detail-value">{o.designation || p.designation || 'N/A'}</span></div>
                    <div className="offer-detail-row"><span className="offer-detail-label">Annual CTC</span><span className="offer-detail-value">{fmtINR(o.annual_ctc || 0)}</span></div>
                    <div className="offer-detail-row"><span className="offer-detail-label">Joining</span><span className="offer-detail-value">{p.joiningDate || 'N/A'}</span></div>
                  </div>
                  <div className="offer-card-actions">
                    {o.doc_url && <button className="btn-card btn-download-offer" onClick={() => onDownload(o.id)}>Download</button>}
                    <button className="btn-card btn-regenerate" onClick={() => onRegenerate(o.id)}>Re-generate</button>
                    <button className="btn-card btn-edit-offer" onClick={() => onEdit(o.id)}>Edit</button>
                    <button className="btn-card btn-duplicate-offer" onClick={() => onDuplicate(o.id)}>Duplicate</button>
                    <button className="btn-card btn-view-stored" onClick={() => onView(o.id)}>View Details</button>
                    <button className="btn-card btn-delete-offer" onClick={() => onDelete(o.id)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable Field Component ──
function Field({ id, label, value, onChange, type = 'text', required, error, errorMsg, placeholder, hint, options }: {
  id: string;
  label: string;
  value: string;
  onChange: (id: string, value: string) => void;
  type?: 'text' | 'textarea' | 'select' | 'date' | 'time' | 'number';
  required?: boolean;
  error?: boolean;
  errorMsg?: string;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
}) {
  return (
    <div className={`field${error ? ' error' : ''}`}>
      <label htmlFor={id}>{label}{required && <> <span className="req">*</span></>}</label>
      {type === 'textarea' ? (
        <textarea id={id} value={value} onChange={(e) => onChange(id, e.target.value)} placeholder={placeholder} rows={3} />
      ) : type === 'select' && options ? (
        <select id={id} value={value} onChange={(e) => onChange(id, e.target.value)}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} id={id} value={value} onChange={(e) => onChange(id, e.target.value)} placeholder={placeholder} />
      )}
      {hint && <div className="hint">{hint}</div>}
      {error && errorMsg && <div className="field-error-msg">{errorMsg}</div>}
    </div>
  );
}
