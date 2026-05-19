"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SaveIndicator } from "@/components/SaveIndicator";
import { ProgressBar } from "@/features/networth/components/ui/ProgressBar";
import { Button, Input } from "@/features/networth/components/ui";
import { Sidebar } from "@/features/networth/components/Sidebar";
import { WizardNav } from "@/features/networth/components/WizardNav";
import { ChatPanel, type ChatMessage } from "@/features/networth/components/ChatPanel";
import { StepPurpose } from "@/features/networth/components/steps/StepPurpose";
import { StepApplicant } from "@/features/networth/components/steps/StepApplicant";
import { StepIncome } from "@/features/networth/components/steps/StepIncome";
import { StepImmovable } from "@/features/networth/components/steps/StepImmovable";
import { StepMovable } from "@/features/networth/components/steps/StepMovable";
import { StepSavings } from "@/features/networth/components/steps/StepSavings";
import { StepSignatory } from "@/features/networth/components/steps/StepSignatory";
import { CertificatePreview } from "@/features/networth/components/certificate/CertificatePreview";
import { AuditLog } from "@/features/networth/components/AuditLog";
import { FormDataProvider, useFormContext } from "@/features/networth/hooks/useFormContext";
import { INITIAL_STATE } from "@/features/networth/hooks/useFormData";
import { STEPS } from "@/features/networth/constants";
import { buildCertificateText, computeTotals, formatINR, parseAmount } from "@/features/networth/lib/utils";
import { validateFormStep, getValidationMessages, validateAmountsForCertificate } from "@/features/networth/lib/validation";
import { deepMergeFormData } from "@/features/networth/lib/merge";
import { buildCertificateHtml } from "@/features/networth/lib/buildCertificateHtml";
import {
  saveCertificateDraft,
  updateCertificateDraft,
  getAllCertificates,
  getCertificate,
  renameCertificate,
  deleteCertificate,
} from "@/features/networth/lib/db";
import { supabase } from "@/features/networth/lib/supabase";
import type { CertificateRecord } from "@/features/networth/types";
import type { FormData } from "@/features/networth/types";
import { useToast } from "@/features/networth/components/ui/Toast";
import { Modal } from "@/features/networth/components/ui/Modal";
import { StepSkeleton } from "@/features/networth/components/ui/Skeleton";

// ─── Main Page (wraps inner content with FormDataProvider) ───────────────────

export default function NetworthClient() {
  return (
    <FormDataProvider>
      <WizardShell />
    </FormDataProvider>
  );
}

// ─── Wizard Shell (consumes FormDataContext) ─────────────────────────────────

function WizardShell() {
  const { data, setData, updateField, resetStep, auditEntries, clearAudit } = useFormContext();
  const { toast } = useToast();
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

  // Client-side auth guard — verify session on mount + listen for sign-out
  useEffect(() => {
    let cancelled = false;

    // 1. Check session immediately on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      setAuthReady(true);
    });

    // 2. Listen for auth state changes (sign-out, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  // Initialize step; restore from localStorage after mount to avoid hydration mismatch
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [amountWarnings, setAmountWarnings] = useState<string[]>([]);
  const certRef = useRef<HTMLDivElement>(null);

  // FIX 1: Keep a ref to latest data so handleSave never reads stale closure
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // FIX 3: Ref-based mutex to prevent double-click duplicate saves
  const savingRef = useRef(false);

  // Phase 3 FIX 7: Track unsaved changes (no beforeunload warning — soft reload expected)
  const dirtyRef = useRef(false);
  const initialDataRef = useRef(data);

  // Mark dirty whenever data changes (except initial mount)
  useEffect(() => {
    if (initialDataRef.current !== data) {
      dirtyRef.current = true;
    }
  }, [data]);

  // Restore saved step from localStorage on mount, then persist on change
  useEffect(() => {
    const saved = localStorage.getItem("networth_current_step");
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < STEPS.length) {
        setStep(parsed);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("networth_current_step", String(step));
  }, [step]);

  // Supabase state
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CertificateRecord[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [aiFlashKey, setAiFlashKey] = useState(0);
  const INITIAL_CHAT: ChatMessage[] = [
    {
      role: "assistant",
      content:
        "Hello! I'll help you fill out your net worth certificate. Let's start \u2014 what is the purpose of this certificate? (e.g. Travelling Visa, Study Loan, Bank Finance, etc.)",
    },
  ];

  // ── Per-document chat history ──────────────────────────────────────────────
  // Map<certificateId | "__new__", { messages, extractedData }>
  const [chatMapInit] = useState<
    Record<string, { messages: ChatMessage[]; extractedData: Partial<FormData> }>
  >(() => {
    try {
      const raw = localStorage.getItem("networth_chat_map");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const chatMapRef = useRef(chatMapInit);

  const saveChatMap = useCallback(() => {
    try {
      localStorage.setItem("networth_chat_map", JSON.stringify(chatMapRef.current));
    } catch { /* quota exceeded — silently ignore */ }
  }, []);

  const chatMapKey = useCallback(
    (id: string | null) => id ?? "__new__",
    []
  );

  /** Snapshot current chat into the map */
  const snapshotChat = useCallback(
    (id: string | null, msgs: ChatMessage[], ext: Partial<FormData>) => {
      chatMapRef.current[chatMapKey(id)] = { messages: msgs, extractedData: ext };
      saveChatMap();
    },
    [chatMapKey, saveChatMap]
  );

  /** Load chat from map (returns initial greeting if none stored) */
  const loadChat = useCallback(
    (id: string | null): { messages: ChatMessage[]; extractedData: Partial<FormData> } => {
      const entry = chatMapRef.current[chatMapKey(id)];
      return entry ?? { messages: INITIAL_CHAT, extractedData: {} };
    },
    [chatMapKey]
  );

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [chatExtractedData, setChatExtractedData] = useState<Partial<FormData>>({});

  // ── Auto-persist chat to per-document map ──────────────────────────────────
  useEffect(() => {
    chatMapRef.current[chatMapKey(certificateId)] = {
      messages: chatMessages,
      extractedData: chatExtractedData,
    };
    saveChatMap();
  }, [chatMessages, chatExtractedData, certificateId, chatMapKey, saveChatMap]);

  // ── AI Chat → Form real-time binding ─────────────────────────────────────

  const handleExtractedData = useCallback(
    (extracted: Partial<FormData>) => {
      setData((prev) => deepMergeFormData(prev, extracted) as FormData);
      // Trigger gold flash on form area
      setAiFlashKey((k) => k + 1);
    },
    [setData]
  );

  // ── Persistence helpers ──────────────────────────────────────────────────

  const updateCertificateId = useCallback((id: string | null) => {
    setCertificateId(id);
    if (id) {
      localStorage.setItem("networth_current_id", id);
    } else {
      localStorage.removeItem("networth_current_id");
    }
  }, []);

  // ── Load sidebar history ─────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    try {
      const certs = await getAllCertificates();
      setHistory(certs);
    } catch (err) {
      // Suppress toast if user is not authenticated (middleware will redirect)
      if (err instanceof Error && err.message === "Not authenticated") return;
      toast("Failed to load history", "error");
    }
  }, [toast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, certificateId]);

  // ── Resume / Restore on mount ────────────────────────────────────────────

  useEffect(() => {
    const handleInit = async () => {
      // 1. Manual resume from History page
      const resumeData = localStorage.getItem("networth_resume_data");
      const resumeId = localStorage.getItem("networth_resume_id");
      const viewOnly = localStorage.getItem("networth_view_only");

      if (resumeData && resumeId) {
        try {
          const parsed = JSON.parse(resumeData);
          if (parsed.purpose !== undefined) {
            setData(parsed);
            setCertificateId(resumeId);
            localStorage.setItem("networth_current_id", resumeId);
            // Restore chat for resumed certificate
            const { messages: m, extractedData: e } = loadChat(resumeId);
            setChatMessages(m);
            setChatExtractedData(e);
            if (viewOnly === "true") setStep(6);
            return;
          }
        } catch {
          // ignore parse errors
        } finally {
          localStorage.removeItem("networth_resume_data");
          localStorage.removeItem("networth_resume_id");
          localStorage.removeItem("networth_view_only");
        }
      }

      // 2. Restore certificate ID for continued editing (form data is already in localStorage)
      const currentId = localStorage.getItem("networth_current_id");
      if (currentId) {
        // Verify it still exists in DB before restoring
        try {
          await getCertificate(currentId);
          setCertificateId(currentId);
          // Restore chat for the active certificate
          const { messages: m, extractedData: e } = loadChat(currentId);
          setChatMessages(m);
          setChatExtractedData(e);
        } catch {
          // Stale ID — certificate no longer exists, clear it
          localStorage.removeItem("networth_current_id");
        }
      }
    };

    handleInit();
  }, [setData]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setShowResetModal(true);
  }, []);

  const confirmReset = useCallback(async () => {
    setShowResetModal(false);

    // Auto-save current work before starting fresh
    const currentData = dataRef.current;
    const hasData = currentData.purpose || currentData.fullName || currentData.passportNumber;

    if (hasData) {
      try {
        setSaving(true);
        if (certificateId) {
          await updateCertificateDraft(certificateId, currentData);
        } else {
          // First-time save — create a new draft so it appears in sidebar
          const autoName = currentData.purpose
            ? currentData.purpose.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
            : "Untitled";
          const dataToSave = { ...currentData, nickname: currentData.nickname || autoName };
          await saveCertificateDraft(dataToSave);
        }
      } catch {
        // Save failed — still proceed with new certificate
      } finally {
        setSaving(false);
        savingRef.current = false;
      }
    }

    // Now start fresh
    // Save current chat before resetting
    snapshotChat(certificateId, chatMessages, chatExtractedData);
    // Remove the "__new__" entry so new cert gets fresh chat
    delete chatMapRef.current["__new__"];
    saveChatMap();

    setData(INITIAL_STATE);
    setStep(0);
    updateCertificateId(null);
    clearAudit();
    dirtyRef.current = false;
    localStorage.removeItem("networth_form_data");
    // Reset chat to clean state
    setChatMessages(INITIAL_CHAT);
    setChatExtractedData({});
    await loadHistory(); // Refresh sidebar to show the saved draft
    toast("New certificate started", "success");
    window.scrollTo(0, 0);
  }, [certificateId, chatMessages, chatExtractedData, setData, updateCertificateId, clearAudit, loadHistory, toast, snapshotChat, saveChatMap]);

  const handleSwitchCertificate = useCallback(async (id: string) => {
    try {
      setLoading(true);
      // Save current chat before switching
      snapshotChat(certificateId, chatMessages, chatExtractedData);
      const freshData = await getCertificate(id);
      setData(freshData);
      updateCertificateId(id);
      setStep(0);
      // Restore chat for the target certificate
      const { messages: restoredMsgs, extractedData: restoredExt } = loadChat(id);
      setChatMessages(restoredMsgs);
      setChatExtractedData(restoredExt);
    } catch {
      toast("Failed to switch certificate", "error");
    } finally {
      setLoading(false);
    }
  }, [certificateId, chatMessages, chatExtractedData, setData, updateCertificateId, toast, snapshotChat, loadChat]);

  const handleRename = useCallback(async (id: string, newName: string) => {
    try {
      await renameCertificate(id, newName);
      if (id === certificateId) {
        setData((prev) => ({ ...prev, nickname: newName }));
      }
      loadHistory();
      toast("Certificate renamed", "success");
    } catch {
      toast("Failed to rename certificate", "error");
    }
  }, [certificateId, setData, loadHistory, toast]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteCertificate(id);
      if (certificateId === id) {
        setData(INITIAL_STATE);
        setStep(0);
        updateCertificateId(null);
      }
      await loadHistory();
      toast("Certificate deleted", "success");
    } catch {
      toast("Failed to delete certificate", "error");
    }
  }, [certificateId, setData, updateCertificateId, loadHistory, toast]);

  // ── Save draft ───────────────────────────────────────────────────────────

  const handleSave = useCallback(async (currentStep: number): Promise<boolean> => {
    // FIX 3: Ref-based mutex — skip if already saving (prevents double-click duplicates)
    if (savingRef.current) return false;
    savingRef.current = true;

    try {
      setSaving(true);

      // FIX 1: Read from ref instead of stale closure
      const newData = { ...dataRef.current };
      if (!newData.nickname && newData.purpose) {
        newData.nickname = newData.purpose
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        setData(newData);
      }

      if (!certificateId) {
        const id = await saveCertificateDraft(newData);
        // Migrate chat from "__new__" to real ID
        if (chatMapRef.current["__new__"]) {
          chatMapRef.current[id] = chatMapRef.current["__new__"];
          delete chatMapRef.current["__new__"];
          saveChatMap();
        }
        updateCertificateId(id);
        await loadHistory(); // Refresh sidebar to show new draft
      } else {
        const updated = await updateCertificateDraft(certificateId, newData);
        if (!updated) {
          // Certificate ID is stale (doesn't exist in DB) — create fresh
          const id = await saveCertificateDraft(newData);
          if (chatMapRef.current[certificateId]) {
            chatMapRef.current[id] = chatMapRef.current[certificateId];
            delete chatMapRef.current[certificateId];
            saveChatMap();
          }
          updateCertificateId(id);
        }
        await loadHistory(); // Refresh sidebar with updated draft
      }

      dirtyRef.current = false; // Phase 3 FIX 7: Reset dirty flag after successful save
      toast("Draft saved", "success");
      return true; // FIX 2: Signal success
    } catch (err) {
      console.error("[handleSave] Failed:", err);
      toast("Failed to save draft", "error");
      return false; // FIX 2: Signal failure
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }, [certificateId, updateCertificateId, setData, toast, saveChatMap, loadHistory]);

  // ── Next with Zod validation ─────────────────────────────────────────────

  const handleNext = useCallback(async () => {
    setValidationError(null);

    const result = validateFormStep(step, data);
    if (!result.success) {
      const messages = getValidationMessages(result);
      setValidationError(messages[0] ?? "Please fix the errors before continuing.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // FIX 2: Only advance step if save succeeded
    const saved = await handleSave(step);
    if (!saved) return;

    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo(0, 0);
  }, [step, data, handleSave]);

  const handleBack = useCallback(() => {
    setValidationError(null);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  // ── Copy & Print ─────────────────────────────────────────────────────────

  // Payment state
  const [isPaid, setIsPaid] = useState(true); // BYPASS: payment disabled for testing
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Check payment status when certificate changes or step reaches preview
  useEffect(() => {
    if (step === 7 && certificateId) {
      fetch(`/api/networth/check-payment?certificateId=${certificateId}`)
        .then(async (res) => {
          const d = await res.json();
          if (d.paid) setIsPaid(true);
        })
        .catch(() => {});
    }
  }, [step, certificateId]);

   // Razorpay payment flow
  const handlePayment = useCallback(async (onSuccess: () => void) => {
    if (isPaid) { onSuccess(); return; }
    if (!certificateId) { toast("Save the certificate first", "error"); return; }

    setPaymentLoading(true);
    try {
      // Ensure Razorpay script is loaded
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => resolve();
          document.head.appendChild(s);
        });
      }

      const res = await fetch("/api/networth/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateId }),
      });
      const orderData = await res.json();

      if (orderData.alreadyPaid) {
        setIsPaid(true);
        setPaymentLoading(false);
        onSuccess();
        return;
      }

      if (!res.ok) {
        toast(orderData.error || "Failed to create payment order", "error");
        setPaymentLoading(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "OneAsy",
        description: "Net Worth Certificate",
        order_id: orderData.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          // Verify payment on server
          const verifyRes = await fetch("/api/networth/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) {
            setIsPaid(true);
            toast("Payment successful!", "success");
            onSuccess();
          } else {
            toast("Payment verification failed", "error");
          }
          setPaymentLoading(false);
        },
        modal: {
          ondismiss: () => { setPaymentLoading(false); },
        },
        theme: { color: "#1e3a5f" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      toast("Payment failed", "error");
      setPaymentLoading(false);
    }
  }, [isPaid, certificateId, toast]);

  // Recompute amount warnings when on Certificate step
  useEffect(() => {
    if (step === 7) {
      setAmountWarnings(validateAmountsForCertificate(data));
    } else {
      setAmountWarnings([]);
    }
  }, [step, data]);

  const copyText = useCallback(() => {
    handlePayment(() => {
      const text = buildCertificateText(data);
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        toast("Certificate text copied to clipboard", "success");
        setTimeout(() => setCopied(false), 2000);
      });
    });
  }, [data, toast, handlePayment]);

  const printCertificate = useCallback(() => {
    handlePayment(async () => {
      // Grab the rendered certificate HTML from the DOM
      const el = document.querySelector(".print-full");
      if (!el) {
        toast("Certificate preview not found", "error");
        return;
      }
      const html = buildCertificateHtml(el.innerHTML);

      toast("Generating PDF...", "info");

      try {
        const res = await fetch("/api/networth/generate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html, candidateName: data.fullName || "", certificateId }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          toast(err.error || "PDF generation failed", "error");
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const candidateName = (data.fullName || "").trim();
        a.download = candidateName
          ? `NetWorth_Certificate - ${candidateName}.pdf`
          : "NetWorth_Certificate.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast("PDF downloaded!", "success");
      } catch (e) {
        console.error("[PDF Download]", e);
        toast("PDF generation failed", "error");
      }
    });
  }, [handlePayment, toast]);

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      // Ctrl+S — save draft
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave(step);
      }
      // Ctrl+P — print certificate
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        printCertificate();
      }
      // Arrow keys for step navigation (only when not in an input)
      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          handleNext();
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          handleBack();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, handleSave, printCertificate, handleNext, handleBack]);

  // ── Step Renderer ────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepPurpose />;
      case 1:
        return <StepApplicant />;
      case 2:
        return <StepIncome certificateId={certificateId} />;
      case 3:
        return <StepImmovable certificateId={certificateId} />;
      case 4:
        return <StepMovable certificateId={certificateId} />;
      case 5:
        return <StepSavings certificateId={certificateId} />;
      case 6:
        return <StepSignatory />;
      case 7:
        return (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 no-print">
              <h2 className="text-lg font-bold text-navy-950 m-0">
                Net Worth Certificate
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={printCertificate}
                  disabled={amountWarnings.length > 0 || paymentLoading}
                  className="relative group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-navy-900 to-navy-700 text-white font-semibold text-sm rounded-full shadow-lg shadow-navy-900/25 hover:shadow-xl hover:shadow-navy-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {paymentLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : isPaid ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      Download Certificate
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Unlock Certificate
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">&#8377;199</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Amount warnings banner */}
            {amountWarnings.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 no-print">
                <p className="text-sm font-semibold text-red-800 mb-2">
                  Missing amounts — fix before generating certificate:
                </p>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  {amountWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* UDIN — collected at the end after CA signs */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 mb-6 no-print">
              <Input
                label="UDIN (Unique Document Identification Number)"
                hint="Enter the UDIN after the certificate is signed by the CA"
                placeholder="14-digit UDIN number"
                value={data.udin}
                onChange={(e) => updateField("udin", e.target.value)}
              />
            </div>

            {/* Self-review summary (collapsible) */}
            <details className="mb-6 no-print border border-slate-200 rounded-xl bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-navy-950 select-none hover:bg-slate-50 rounded-xl">
                Review Data Summary
              </summary>
              <div className="px-4 pb-4 pt-2 text-sm text-slate-700 space-y-4">
                {/* Applicant */}
                <div>
                  <h4 className="font-semibold text-navy-900 mb-1">Applicant</h4>
                  <p>{data.salutation} {data.fullName || "—"} &middot; Passport: {data.passportNumber || "—"}</p>
                  <p>Purpose: {data.purpose || "—"} &middot; Country: {data.country || "—"} &middot; Date: {data.certDate || "—"}</p>
                </div>

                {/* Annexure I — Income */}
                {data.incomeTypes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-navy-900 mb-1">Annexure I — Income</h4>
                    <table className="w-full text-xs border-collapse">
                      <tbody>
                        {data.incomeTypes.map((person, i) => {
                          const name = data.incomeLabels[person]?.trim() || (person === "Self" ? data.fullName : person);
                          const inr = data.incomeRows[i]?.inr?.trim();
                          return (
                            <tr key={i} className="border-b border-slate-100">
                              <td className="py-1 pr-2">{person} — {name}</td>
                              <td className="py-1 text-right font-mono">{inr ? formatINR(parseAmount(inr)) : <span className="text-red-500">Missing</span>}</td>
                            </tr>
                          );
                        })}
                        <tr className="font-semibold">
                          <td className="py-1 pr-2">Total</td>
                          <td className="py-1 text-right font-mono">{formatINR(computeTotals(data).incomeINR)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Annexure II — Immovable */}
                {data.immovableRows.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-navy-900 mb-1">Annexure II — Immovable Assets</h4>
                    <table className="w-full text-xs border-collapse">
                      <tbody>
                        {data.immovableRows.map((row, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="py-1 pr-2 max-w-[300px] truncate">{row.label || `Row ${i + 1}`}</td>
                            <td className="py-1 text-right font-mono">{row.inr?.trim() ? formatINR(parseAmount(row.inr)) : <span className="text-red-500">Missing</span>}</td>
                          </tr>
                        ))}
                        <tr className="font-semibold">
                          <td className="py-1 pr-2">Total</td>
                          <td className="py-1 text-right font-mono">{formatINR(computeTotals(data).immovableINR)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Annexure III — Movable */}
                {data.movableRows.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-navy-900 mb-1">Annexure III — Movable Properties</h4>
                    <table className="w-full text-xs border-collapse">
                      <tbody>
                        {data.movableRows.map((row, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="py-1 pr-2 max-w-[300px] truncate">{row.label || `Row ${i + 1}`}</td>
                            <td className="py-1 text-right font-mono">{row.inr?.trim() ? formatINR(parseAmount(row.inr)) : <span className="text-red-500">Missing</span>}</td>
                          </tr>
                        ))}
                        <tr className="font-semibold">
                          <td className="py-1 pr-2">Total</td>
                          <td className="py-1 text-right font-mono">{formatINR(computeTotals(data).movableINR)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Annexure IV — Savings */}
                {(data.savingsRows ?? []).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-navy-900 mb-1">Annexure IV — Current Savings</h4>
                    <table className="w-full text-xs border-collapse">
                      <tbody>
                        {(data.savingsRows ?? []).map((row, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="py-1 pr-2 max-w-[300px] truncate">{row.label || `Row ${i + 1}`}</td>
                            <td className="py-1 text-right font-mono">{row.inr?.trim() ? formatINR(parseAmount(row.inr)) : <span className="text-red-500">Missing</span>}</td>
                          </tr>
                        ))}
                        <tr className="font-semibold">
                          <td className="py-1 pr-2">Total</td>
                          <td className="py-1 text-right font-mono">{formatINR(computeTotals(data).savingsINR)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Grand Total */}
                <div className="pt-2 border-t border-slate-300">
                  <p className="font-bold text-navy-950">
                    Grand Total Net Worth: {formatINR(computeTotals(data).grandINR)}
                  </p>
                </div>

                {/* Signatory */}
                <div>
                  <h4 className="font-semibold text-navy-900 mb-1">Signatory</h4>
                  <p>{data.firmName || "—"}, Chartered Accountants, FRN {data.firmFRN || "—"}</p>
                  <p>{data.signatoryName || "—"} &middot; {data.signatoryTitle || "—"} &middot; M.No. {data.membershipNo || "—"}</p>
                  <p>Place: {data.signPlace || "—"}</p>
                </div>
              </div>
            </details>

            <div className="max-h-[70vh] overflow-y-auto border border-slate-200 rounded-xl print:max-h-none print:overflow-visible print:border-none print:rounded-none">
              <CertificatePreview ref={certRef} data={data} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // ── Layout ───────────────────────────────────────────────────────────────

  // Block rendering until auth is confirmed
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

  return (
    <div className="h-full print-bg-none bg-slate-50 overflow-hidden">
      <div className="flex flex-col lg:flex-row h-full">
        <Sidebar
          history={history}
          certificateId={certificateId}
          onNewCertificate={handleReset}
          onSwitchCertificate={handleSwitchCertificate}
          onRename={handleRename}
          onDelete={handleDelete}
          onToggleChat={() => setIsChatOpen((v) => !v)}
          loading={loading}
        />

        <main className={`flex-1 flex flex-col lg:flex-row min-w-0`}>
          {/* AI Chat Panel — desktop: side-by-side on left; mobile: full-screen overlay */}
          {isChatOpen && (
            <>
              {/* Mobile overlay backdrop */}
              <div
                className="lg:hidden fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm no-print"
                onClick={() => setIsChatOpen(false)}
                aria-hidden="true"
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
                  latestExtractedData={chatExtractedData}
                  setLatestExtractedData={setChatExtractedData}
                />
              </div>
            </>
          )}

          {/* Form area — shrinks when chat is open */}
          <div className={`${isChatOpen ? "lg:flex-[73] lg:min-w-0" : "flex-1"} px-4 py-4 lg:px-10 lg:py-6 overflow-y-auto`}>
            <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="no-print mb-4 mt-6 lg:mt-0">
              <h1 className="text-2xl lg:text-3xl font-black text-navy-950 tracking-tight">
                Net Worth Certificate
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Fill in the details below to generate your certificate
              </p>
              {!isChatOpen && (
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold
                    text-gold-700 bg-gold-50 border border-gold-200 rounded-xl
                    hover:bg-gold-100 hover:border-gold-300 transition-all duration-150"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  Fill with AI Assistant
                </button>
              )}
            </div>

            {/* Progress Tabs */}
            <div className="no-print mb-4">
              <ProgressBar
                steps={STEPS}
                currentStep={step}
                onClickStep={(i) => setStep(i)}
              />
            </div>

            {/* Save Status Indicator */}
            <SaveIndicator saving={saving} />

            {/* Step Content */}
            <div key={step} className="animate-fade-in relative">
              {loading ? (
                <StepSkeleton />
              ) : (
                <div key={`ai-${aiFlashKey}`} className={aiFlashKey > 0 ? "ai-flash rounded-xl" : ""}>
                  {renderStep()}
                </div>
              )}
            </div>

            {/* Navigation */}
            <WizardNav
              step={step}
              saving={saving}
              validationError={validationError}
              onBack={handleBack}
              onNext={handleNext}
              onResetStep={() => resetStep(step)}
            />
          </div>
          </div>
        </main>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        open={showResetModal}
        title="Start New Certificate"
        onClose={() => setShowResetModal(false)}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={confirmReset}>
              Start New
            </Button>
          </>
        }
      >
        Your current certificate will be saved as a draft. You can switch back to it anytime from the sidebar.
      </Modal>
    </div>
  );
}
