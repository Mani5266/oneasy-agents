// -- Main App Page ------------------------------------------------------------
// Renders the app shell: Sidebar | AI Chat Panel (inline) | Main Content.
// Switches between Generator (wizard) and History (deed grid) views
// based on useWizardStore.currentPage — matching legacy SPA behavior.
// Layout matches Networth Agent 3-column pattern:
//   Left sidebar → Middle chat panel (toggleable) → Right form content.

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SaveIndicator } from '@/components/SaveIndicator';
import { Sidebar } from '@/features/partnership/components/Sidebar';
import { ProgressBar, WizardTabs } from '@/features/partnership/components/WizardTabs';
import { Step0Partners } from '@/features/partnership/components/Step0Partners';
import { Step1Business } from '@/features/partnership/components/Step1Business';
import { Step2Clauses } from '@/features/partnership/components/Step2Clauses';
import { Step3Review } from '@/features/partnership/components/Step3Review';
import { DeedGrid } from '@/features/partnership/components/DeedGrid';
import DetailModal from '@/features/partnership/components/DetailModal';
import { ChatPanel, type ChatMessage } from '@/features/partnership/components/ChatPanel';
import type { ExtractedDeedData } from '@/features/partnership/lib/merge';
import type { Partner } from '@/features/partnership/types';
import { useWizardStore } from '@/features/partnership/hooks/useWizardStore';
import { useDeedList } from '@/features/partnership/hooks/useDeedList';
import { useDeedActions } from '@/features/partnership/hooks/useDeedActions';
import { useAutoSave } from '@/features/partnership/hooks/useAutoSave';
import { useAuth } from '@/features/partnership/hooks/useAuth';

export default function PartnershipClient() {
  const { loading: authLoading } = useAuth();
  const currentPage = useWizardStore((s) => s.currentPage);
  const currentStep = useWizardStore((s) => s.currentStep);
  const goToStep = useWizardStore((s) => s.goToStep);
  const switchPage = useWizardStore((s) => s.switchPage);
  const resetForm = useWizardStore((s) => s.resetForm);
  const setFields = useWizardStore((s) => s.setFields);
  const setPartners = useWizardStore((s) => s.setPartners);
  const updateAddress = useWizardStore((s) => s.updateAddress);

  // ── Deed list for sidebar ──
  const {
    sidebarDrafts,
    fetchDeeds,
  } = useDeedList();

  // ── Deed actions (for sidebar edit/delete) ──
  const {
    editDeed,
    deleteDeed,
  } = useDeedActions({ onRefresh: fetchDeeds });

  // ── Auto-save ──
  const { saveNow, saving } = useAutoSave();

  // ── Detail modal state ──
  const [modalDeedId, setModalDeedId] = useState<string | null>(null);

  // ── Chat panel state (lifted so messages persist across panel open/close) ──
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatExtractedData, setChatExtractedData] = useState<ExtractedDeedData>({});

  // ── Fetch deeds on mount ──
  useEffect(() => {
    fetchDeeds();
  }, [fetchDeeds]);

  // ── Sidebar handlers ──
  const handleNewDeed = useCallback(async () => {
    // Save the current deed before resetting (if there's meaningful data)
    const state = useWizardStore.getState();
    const hasData = state.businessName || state.partners.some((p) => p.name.trim());
    if (hasData) {
      try {
        await saveNow();
        // Refresh sidebar so the saved deed appears
        fetchDeeds();
      } catch {
        // Save failed — still allow creating a new deed
      }
    }

    resetForm();
    switchPage('generator');
    // Reset chat when starting a new deed
    setChatMessages([]);
    setChatExtractedData({});
  }, [resetForm, switchPage, saveNow, fetchDeeds]);

  const handleEditDeed = useCallback(
    async (id: string) => {
      await editDeed(id);
      switchPage('generator');
    },
    [editDeed, switchPage]
  );

  const handleDeleteDeed = useCallback(
    async (id: string) => {
      if (!window.confirm('Delete this partnership deed?')) return;
      await deleteDeed(id);
    },
    [deleteDeed]
  );

  const handleNavigate = useCallback(
    (page: 'generator' | 'history') => {
      switchPage(page);
      if (page === 'history') fetchDeeds();
    },
    [switchPage, fetchDeeds]
  );

  // ── Toggle chat panel ──
  const handleToggleChat = useCallback(() => {
    setChatOpen((v) => !v);
  }, []);

  // ── History grid handlers ──
  const handleViewDeed = useCallback((id: string) => {
    setModalDeedId(id);
  }, []);

  // ── Step navigation helpers ──
  const nextStep = useCallback(() => goToStep(currentStep + 1), [goToStep, currentStep]);
  const prevStep = useCallback(() => goToStep(currentStep - 1), [goToStep, currentStep]);

  // ── Chat: handle AI-extracted data → push to Zustand store ──
  const handleExtractedData = useCallback(
    (data: ExtractedDeedData) => {
      // 1. If AI returned partners, push them to the store
      if (data.partners && Array.isArray(data.partners) && data.partners.length > 0) {
        // Ensure minimum 2 partners — pad with defaults if needed
        const aiPartners: Partner[] = data.partners.map((p) => ({
          name: p.name || '',
          relation: p.relation || 'S/O',
          fatherName: p.fatherName || '',
          age: p.age ?? '',
          address: p.address || '',
          capital: p.capital ?? 0,
          profit: p.profit ?? 0,
          isManagingPartner: p.isManagingPartner ?? false,
          isBankAuthorized: p.isBankAuthorized ?? false,
        }));
        // Pad to minimum 2
        while (aiPartners.length < 2) {
          aiPartners.push({
            name: '',
            relation: 'S/O',
            fatherName: '',
            age: '',
            address: '',
            capital: 0,
            profit: 0,
            isManagingPartner: false,
            isBankAuthorized: false,
          });
        }
        setPartners(aiPartners);
      }

      // 2. Push scalar (non-partner, non-address) fields
      const scalarFields: Partial<Record<string, unknown>> = {};
      const scalarKeys = [
        'businessName',
        'businessDescriptionInput',
        'natureOfBusiness',
        'businessObjectives',
        'deedDate',
        'bankOperation',
        'interestRate',
        'noticePeriod',
        'accountingYear',
        'additionalPoints',
        'partnershipDuration',
        'partnershipStartDate',
        'partnershipEndDate',
      ] as const;

      for (const key of scalarKeys) {
        if (data[key] !== undefined && data[key] !== null) {
          scalarFields[key] = data[key];
        }
      }

      // 3. Push address sub-fields
      const addrKeys = [
        'addrDoorNo',
        'addrBuildingName',
        'addrArea',
        'addrDistrict',
        'addrState',
        'addrPincode',
      ] as const;

      let hasAddrUpdate = false;
      for (const key of addrKeys) {
        if (data[key] !== undefined && data[key] !== null) {
          scalarFields[key] = data[key];
          hasAddrUpdate = true;
        }
      }

      if (Object.keys(scalarFields).length > 0) {
        setFields(scalarFields as Parameters<typeof setFields>[0]);
      }

      // 4. Recompute composed address if any address sub-field was updated
      if (hasAddrUpdate) {
        // Small delay to ensure setFields has applied
        setTimeout(() => updateAddress(), 0);
      }
    },
    [setFields, setPartners, updateAddress]
  );

  // ── Auth loading screen ──
  if (authLoading) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="partnership-root">
      {/* Back to Dashboard floating pill */}
      <a
        href="/dashboard"
        className="fixed top-4 left-4 z-[60] flex items-center gap-1.5 px-4 py-2 text-xs font-semibold
          text-white bg-[#0f172a] border border-[#1e293b] rounded-full shadow-lg
          hover:bg-[#1e293b] transition-all no-print"
        style={{ textDecoration: 'none' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Dashboard
      </a>

      {/* Skip to main content */}
      <a href="#mainContent" className="skip-link">
        Skip to main content
      </a>

      {/* App Shell */}
      <div className="app-shell">
        {/* Sidebar */}
        <Sidebar
          drafts={sidebarDrafts}
          onNewDeed={handleNewDeed}
          onEditDeed={handleEditDeed}
          onDeleteDeed={handleDeleteDeed}
          onNavigate={handleNavigate}
          onToggleChat={handleToggleChat}
          chatOpen={chatOpen}
        />

        {/* Main area */}
        <main id="mainContent" style={{ flex: 1, display: 'flex', minWidth: 0, height: '100%', overflow: 'hidden' }}>
          {/* ── AI Chat Panel ── */}
          {currentPage === 'generator' && chatOpen && (
            <>
              {/* Mobile overlay backdrop */}
              <div
                className="mobile-backdrop visible"
                onClick={() => setChatOpen(false)}
                aria-hidden="true"
                style={{ display: undefined }}
              />
              <div style={{ width: 300, minWidth: 280, maxWidth: 340, flexShrink: 0, height: '100%', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>
                <ChatPanel
                  onExtractedData={handleExtractedData}
                  onClose={() => setChatOpen(false)}
                  messages={chatMessages}
                  setMessages={setChatMessages}
                  latestExtractedData={chatExtractedData}
                  setLatestExtractedData={setChatExtractedData}
                />
              </div>
            </>
          )}

          {/* ── Form / Content area ── */}
          <div className="content flex-1" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, minWidth: 0 }}>
            {/* ── Generator View ── */}
            {currentPage === 'generator' && (
              <>
                {/* Sticky header */}
                <div style={{ flexShrink: 0, padding: 'var(--space-8) var(--space-8) 0' }}>
                  <div className="page">
                    {/* Page header */}
                    <div className="page-header">
                      <h2 className="page-title">Partnership Deed</h2>
                      <p className="page-sub">Fill in the details below to generate your deed</p>
                    </div>

                    {/* Progress bar */}
                    <ProgressBar step={currentStep} />

                    {/* Save status */}
                    <SaveIndicator saving={saving} />

                    {/* Step tabs */}
                    <WizardTabs currentStep={currentStep} onStepClick={goToStep} />
                  </div>
                </div>

                {/* Scrollable form card */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-8) var(--space-12)' }}>
                  <div className="page">
                    <div className="form-card">
                      {currentStep === 0 && <Step0Partners onNext={nextStep} />}
                      {currentStep === 1 && <Step1Business onPrev={prevStep} onNext={nextStep} />}
                      {currentStep === 2 && <Step2Clauses onPrev={prevStep} onNext={nextStep} />}
                      {currentStep === 3 && <Step3Review onPrev={prevStep} />}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── History View ── */}
            {currentPage === 'history' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-8)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                  <div className="page-header">
                    <h2 className="page-title">Deed History</h2>
                    <p className="page-sub">View and manage your saved partnership deeds</p>
                  </div>

                  <DeedGrid onViewDeed={handleViewDeed} />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      <DetailModal
        deedId={modalDeedId}
        onClose={() => setModalDeedId(null)}
        onRefresh={fetchDeeds}
      />
    </div>
  );
}
