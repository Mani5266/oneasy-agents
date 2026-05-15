"use client";

import { useMemo, useState, useCallback } from "react";
import { useLLPForm } from "../../hooks/useFormContext";
import { getMissing } from "@/features/llp/types";
import { renderDeed } from "@/features/llp/lib/deed-template";

interface Props {
  agreementId: string | null;
  isPaid: boolean;
  paymentLoading: boolean;
  onPayment: (onSuccess: () => void) => void;
}

export function StepPreview({ agreementId, isPaid, paymentLoading, onPayment }: Props) {
  const { data } = useLLPForm();
  const [downloading, setDownloading] = useState(false);

  const missing = useMemo(() => getMissing(data), [data]);
  const html = useMemo(() => renderDeed(data, "preview"), [data]);

  const handleDownloadPDF = useCallback(() => {
    onPayment(async () => {
      if (!agreementId) return;
      setDownloading(true);
      try {
        const res = await fetch("/api/llp/download-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agreementId }),
        });
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `LLP_Agreement_${data.llpName || "draft"}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        alert("Failed to download PDF");
      } finally {
        setDownloading(false);
      }
    });
  }, [agreementId, data.llpName, onPayment]);

  const handleDownloadDOCX = useCallback(() => {
    onPayment(async () => {
      if (!agreementId) return;
      setDownloading(true);
      try {
        const res = await fetch("/api/llp/download-docx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agreementId }),
        });
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `LLP_Agreement_${data.llpName || "draft"}.docx`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        alert("Failed to download DOCX");
      } finally {
        setDownloading(false);
      }
    });
  }, [agreementId, data.llpName, onPayment]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">LLP Agreement Preview</h2>
          <p className="text-sm text-slate-500">Review your agreement and download.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            disabled={missing.length > 0 || downloading || paymentLoading}
            className="relative inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold text-sm rounded-xl shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paymentLoading ? "Processing..." : isPaid ? "Download PDF" : <>Unlock PDF <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">&#8377;199</span></>}
          </button>
          {isPaid && (
            <button
              onClick={handleDownloadDOCX}
              disabled={missing.length > 0 || downloading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-200 text-emerald-700 font-semibold text-sm rounded-xl hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download DOCX
            </button>
          )}
          {isPaid && (
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
              Paid
            </span>
          )}
        </div>
      </div>

      {missing.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">Missing fields (complete before download):</p>
          <ul className="text-sm text-amber-700 list-disc list-inside space-y-0.5">
            {missing.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[65vh] overflow-y-auto">
        <div
          className="p-6 text-sm leading-relaxed llp-deed-preview"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
