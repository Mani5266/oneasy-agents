"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { useLLPForm } from "../../hooks/useFormContext";
import { getMissing } from "@/features/llp/types";
import { renderDeed } from "@/features/llp/lib/deed-template";
import { buildLlpHtml } from "../../lib/buildLlpHtml";

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
      setDownloading(true);
      try {
        const deedHtml = renderDeed(data, "preview");
        const fullHtml = buildLlpHtml(deedHtml);
        const res = await fetch("/api/llp-form/generate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html: fullHtml, llpName: data.llpName || "", agreementId }),
        });
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const name = (data.llpName || "").trim();
        a.download = name ? `LLP_Agreement - ${name}.pdf` : "LLP_Agreement.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        alert("Failed to download PDF");
      } finally {
        setDownloading(false);
      }
    });
  }, [data, onPayment]);

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
            onClick={handleDownloadDOCX}
            disabled={missing.length > 0 || downloading || paymentLoading || !isPaid}
            className="relative inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#d4a017', color: '#0f172a' }}
          >
            {paymentLoading ? "Processing..." : isPaid ? (
              <>
                Generate & Download DOCX
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </>
            ) : <>Unlock Document <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">&#8377;199</span></>}
          </button>
          {isPaid && (
            <button
              onClick={handleDownloadPDF}
              disabled={missing.length > 0 || downloading}
              className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#0f172a', color: '#fff' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Download PDF
            </button>
          )}
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[65vh] overflow-y-auto">
        <div
          className="p-6 text-sm leading-relaxed llp-deed-preview"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
        />
      </div>

      {missing.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">Missing fields (complete before download):</p>
          <ul className="text-sm text-amber-700 list-disc list-inside space-y-0.5">
            {missing.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
