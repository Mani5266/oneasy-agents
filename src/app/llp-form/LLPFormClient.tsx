"use client";

import "./llp-form.css";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { SaveIndicator } from "@/components/SaveIndicator";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LLPFormProvider, useLLPForm } from "@/features/llp-form/hooks/useFormContext";
import { ProgressBar } from "@/features/llp-form/components/ProgressBar";
import { WizardNav } from "@/features/llp-form/components/WizardNav";
import { ChatPanel, type ChatMessage } from "@/features/llp-form/components/ChatPanel";
import { StepBasicInfo } from "@/features/llp-form/components/steps/StepBasicInfo";
import { StepPartners } from "@/features/llp-form/components/steps/StepPartners";
import { StepCapital } from "@/features/llp-form/components/steps/StepCapital";
import { StepProfits } from "@/features/llp-form/components/steps/StepProfits";
import { StepGovernance } from "@/features/llp-form/components/steps/StepGovernance";
import { StepObjectives } from "@/features/llp-form/components/steps/StepObjectives";
import { StepPreview } from "@/features/llp-form/components/steps/StepPreview";
import { STEPS } from "@/features/llp-form/constants";
import { type LLPData, defaultData, blankPartner } from "@/features/llp/types";
import {
  Plus,
  Sparkles,
  FileText,
  Trash2,
  CheckCircle2,
  History,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";

export default function LLPFormClient() {
  return (
    <LLPFormProvider>
      <WizardShell />
    </LLPFormProvider>
  );
}

interface HistoryItem {
  id: string;
  llp_name: string | null;
  status: string;
  created_at: string;
}

function WizardShell() {
  const { data, setData, resetForm } = useLLPForm();
  const router = useRouter();
  const supabase = createClient();
  const [authReady, setAuthReady] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [agreementId, setAgreementId] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(true); // BYPASS: payment disabled for testing
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(true);
  const INITIAL_CHAT: ChatMessage[] = [
    { role: "assistant", content: "Hello! I'll help you fill out your LLP Agreement. Tell me about your LLP — the name, partners, and business objectives." },
  ];
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [chatExtractedData, setChatExtractedData] = useState<Partial<LLPData>>({});

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Sidebar mobile state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // AI flash
  const [aiFlashKey, setAiFlashKey] = useState(0);

  // Auth guard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (!session) { router.replace("/login"); return; }
      setAuthReady(true);
    });
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (user) setUserEmail(user.email ?? null);
    });
  }, [router, supabase]);

  // Close mobile sidebar on resize
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/llp-form/history");
      if (res.ok) {
        const items = await res.json();
        setHistory(items);
      }
    } catch {}
  }, []);

  useEffect(() => { if (authReady) loadHistory(); }, [authReady, loadHistory]);

  // Auto-save
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const currentData = dataRef.current;
      const res = await fetch("/api/llp-form/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agreementId, data: currentData }),
      });
      const result = await res.json();
      if (!res.ok) return false;
      if (result.id && !agreementId) setAgreementId(result.id);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [agreementId]);

  // Check payment on preview step
  useEffect(() => {
    if (step === 6 && agreementId) {
      fetch(`/api/payments/check?agent=llp&documentId=${agreementId}`)
        .then(async (r) => { const d = await r.json(); if (d.paid) setIsPaid(true); })
        .catch(() => {});
    }
  }, [step, agreementId]);

  // Payment handler
  const handlePayment = useCallback(async (onSuccess: () => void) => {
    if (isPaid) { onSuccess(); return; }
    if (!agreementId) { alert("Save the agreement first"); return; }
    setPaymentLoading(true);
    try {
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => resolve();
          document.head.appendChild(s);
        });
      }
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: "llp", documentId: agreementId }),
      });
      const orderData = await res.json();
      if (orderData.alreadyPaid) { setIsPaid(true); setPaymentLoading(false); onSuccess(); return; }
      if (!res.ok) { alert(orderData.error || "Failed to create order"); setPaymentLoading(false); return; }
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "OneAsy",
        description: "LLP Agreement",
        order_id: orderData.orderId,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) { setIsPaid(true); onSuccess(); }
          setPaymentLoading(false);
        },
        modal: { ondismiss: () => setPaymentLoading(false) },
        theme: { color: "#1e3a5f" },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch { setPaymentLoading(false); }
  }, [isPaid, agreementId]);

  // AI extracted data → form
  const handleExtractedData = useCallback((extracted: Partial<LLPData>) => {
    setData((prev) => {
      const merged = { ...prev };
      for (const [key, value] of Object.entries(extracted)) {
        if (key === "partners" && Array.isArray(value)) {
          const partners = [...merged.partners];
          for (const p of value as any[]) {
            if (typeof p.index === "number" && p.index < 10) {
              while (partners.length <= p.index) {
                partners.push(blankPartner(partners.length));
              }
              partners[p.index] = { ...partners[p.index], ...p };
            }
          }
          merged.partners = partners;
          merged.numPartners = Math.max(merged.numPartners, partners.length);
        } else if (key === "contributions" && Array.isArray(value)) {
          merged.contributions = value as any;
        } else if (key === "profits" && Array.isArray(value)) {
          merged.profits = value as any;
        } else if (key === "registeredAddress" && typeof value === "object") {
          merged.registeredAddress = { ...merged.registeredAddress, ...(value as any) };
        } else {
          (merged as any)[key] = value;
        }
      }
      return merged;
    });
    setAiFlashKey((k) => k + 1);
  }, [setData]);

  // Navigation
  const handleNext = useCallback(async () => {
    const saved = await handleSave();
    if (!saved && step === 0) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo(0, 0);
  }, [step, handleSave]);

  const handleBack = useCallback(() => { setStep((s) => Math.max(0, s - 1)); }, []);

  // History actions
  const handleLoadDraft = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/llp-form/get?id=${id}`);
      if (!res.ok) return;
      const item = await res.json();
      if (item.form_data) {
        setData({ ...defaultData(), ...item.form_data });
        setAgreementId(id);
        setStep(0);
        setMobileOpen(false);
        setIsPaid(false);
      }
    } catch {}
  }, [setData]);

  const handleDeleteDraft = useCallback(async (id: string) => {
    if (!confirm("Delete this draft?")) return;
    try {
      await fetch(`/api/llp-form/delete?id=${id}`, { method: "DELETE" });
      loadHistory();
      if (agreementId === id) {
        resetForm();
        setAgreementId(null);
        setStep(0);
      }
    } catch {}
  }, [agreementId, resetForm, loadHistory]);

  const handleNewAgreement = useCallback(async () => {
    if (agreementId) await handleSave();
    resetForm();
    setAgreementId(null);
    setStep(0);
    setChatMessages(INITIAL_CHAT);
    setChatExtractedData({});
    setIsPaid(false);
    setMobileOpen(false);
    loadHistory();
  }, [agreementId, handleSave, resetForm, loadHistory]);

  if (!authReady) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Loading...</span>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 0: return <StepBasicInfo />;
      case 1: return <StepPartners />;
      case 2: return <StepCapital />;
      case 3: return <StepProfits />;
      case 4: return <StepGovernance />;
      case 5: return <StepObjectives />;
      case 6: return <StepPreview agreementId={agreementId} isPaid={isPaid} paymentLoading={paymentLoading} onPayment={handlePayment} />;
      default: return null;
    }
  };

  // ── Sidebar Content ──────────────────────────────────────────────────────
  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gold-500 rounded-2xl flex items-center justify-center text-navy-950 font-black text-lg shadow-lg shadow-gold-500/20">
          O
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight leading-tight">
            OnEasy
          </h1>
          <p className="text-[11px] font-semibold text-gold-400 tracking-wide leading-tight">
            LLP Agreement Agent
          </p>
        </div>
      </div>

      {/* New Agreement */}
      <button
        onClick={handleNewAgreement}
        className="w-full flex items-center justify-center gap-2 mb-3 py-3 px-4 rounded-xl font-semibold text-sm
          text-navy-950 bg-white hover:bg-slate-100 shadow-md shadow-black/10
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:ring-offset-2 focus:ring-offset-navy-900"
      >
        <Plus className="w-4 h-4" /> New Agreement
      </button>

      {/* AI Fill */}
      <button
        onClick={() => { setIsChatOpen((v) => !v); setMobileOpen(false); }}
        className="w-full flex items-center justify-center gap-2 mb-8 py-2.5 px-4 rounded-xl font-semibold text-sm
          text-gold-400 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/20
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:ring-offset-2 focus:ring-offset-navy-900"
      >
        <Sparkles className="w-4 h-4" /> Fill with AI
      </button>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Recent Drafts
          </h2>
        </div>

        <div className="space-y-1.5">
          {history.length === 0 ? (
            <p className="text-xs text-center text-slate-500 py-8 italic">
              No drafts yet. Create your first agreement above.
            </p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className={`relative group w-full rounded-xl transition-all border ${
                  agreementId === item.id
                    ? "bg-navy-800/60 border-gold-500/30 ring-1 ring-gold-500/20"
                    : "bg-transparent border-transparent hover:bg-navy-800/40 hover:border-navy-700/50"
                }`}
              >
                <button
                  onClick={() => handleLoadDraft(item.id)}
                  className="w-full text-left p-3 pr-12 flex items-start gap-2.5"
                >
                  <div
                    className={`mt-0.5 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      item.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : agreementId === item.id
                          ? "bg-gold-500/20 text-gold-400"
                          : "bg-navy-700/50 text-slate-500 group-hover:bg-navy-700 group-hover:text-slate-400"
                    }`}
                  >
                    {item.status === "completed" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                      {item.llp_name || "Untitled LLP"}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded leading-none ${
                          item.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-gold-500/20 text-gold-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Delete button */}
                <div className="absolute right-2 top-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteDraft(item.id); }}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-md hover:bg-red-500/10"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="mt-auto pt-4 border-t border-navy-700/50">
        {userEmail && (
          <p className="text-[11px] text-slate-500 truncate mb-3 px-1" title={userEmail}>
            {userEmail}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold
              text-white bg-navy-700/60 hover:bg-navy-700 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            Generator
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold
              text-slate-400 hover:text-white hover:bg-navy-700/60 transition-all"
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
        </div>
      </div>
    </>
  );

  // ── Layout (matching networth exactly) ──────────────────────────────────
  return (
    <div className="h-full print-bg-none bg-slate-50 overflow-hidden">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Back to Dashboard floating pill */}
        <Link
          href="/dashboard"
          className="fixed top-4 left-4 z-[60] flex items-center gap-1.5 px-4 py-2 text-xs font-semibold
            text-white bg-navy-900 border border-navy-700 rounded-full shadow-lg
            hover:bg-navy-800 transition-all no-print"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>

        {/* ── Sidebar ── */}
        <>
          {/* Mobile hamburger */}
          <div className="lg:hidden fixed top-14 left-4 z-40 no-print">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2.5 bg-navy-900 border border-navy-700 rounded-xl shadow-md hover:bg-navy-800 transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Mobile overlay */}
          {mobileOpen && (
            <div
              className="lg:hidden fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
          )}

          {/* Sidebar panel */}
          <aside
            className={`
              fixed lg:relative top-0 left-0 z-50 lg:z-auto
              h-screen lg:h-full w-72 bg-navy-900 border-r border-navy-800 p-6 pt-14 flex flex-col no-print
              transition-transform duration-300 ease-in-out
              ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}
          >
            {/* Mobile close */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </>

        {/* ── Main content area ── */}
        <main className="flex-1 flex flex-col lg:flex-row min-w-0">
          {/* AI Chat Panel */}
          {isChatOpen && (
            <>
              <div
                className="lg:hidden fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm no-print"
                onClick={() => setIsChatOpen(false)}
              />
              <div
                className="
                  fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-auto
                  lg:flex-[27] lg:min-w-0 lg:border-r lg:border-slate-200
                  h-[100dvh] lg:h-full animate-panel-in no-print
                "
              >
                <ChatPanel
                  onExtractedData={handleExtractedData}
                  onClose={() => setIsChatOpen(false)}
                  messages={chatMessages}
                  setMessages={setChatMessages}
                  extractedData={chatExtractedData}
                  setExtractedData={setChatExtractedData}
                />
              </div>
            </>
          )}

          {/* Form area */}
          <div className={`${isChatOpen ? "lg:flex-[73] lg:min-w-0" : "flex-1"} px-4 py-4 lg:px-10 lg:py-6 overflow-y-auto`}>
            <div className="max-w-4xl mx-auto">
              {/* Page Header */}
              <div className="no-print mb-4 mt-6 lg:mt-0">
                <h1 className="text-2xl lg:text-3xl font-black text-navy-950 tracking-tight">
                  LLP Agreement
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Fill in the details below to generate your LLP agreement deed
                </p>
                {!isChatOpen && (
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold
                      text-gold-700 bg-gold-50 border border-gold-200 rounded-xl
                      hover:bg-gold-100 hover:border-gold-300 transition-all duration-150"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Fill with AI Assistant
                  </button>
                )}
              </div>

              {/* Progress Tabs */}
              <div className="no-print mb-4">
                <ProgressBar currentStep={step} onClickStep={(i) => setStep(i)} />
              </div>

              {/* Save Status */}
              <SaveIndicator saving={saving} />

              {/* Step Content */}
              <div key={step} className="animate-fade-in relative">
                <div key={`ai-${aiFlashKey}`} className={aiFlashKey > 0 ? "ai-flash rounded-xl" : ""}>
                  {renderStep()}
                </div>
              </div>

              {/* Navigation */}
              <WizardNav
                step={step}
                totalSteps={STEPS.length}
                saving={saving}
                onBack={handleBack}
                onNext={handleNext}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
