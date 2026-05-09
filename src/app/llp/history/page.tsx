"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllLLPAgreements, deleteLLPAgreement, type LLPAgreementRecord } from "@/features/llp/lib/db";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Eye, Trash2, Plus, ArrowLeft, FileText } from "lucide-react";

export default function LLPHistoryPage() {
  const [agreements, setAgreements] = useState<LLPAgreementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllLLPAgreements();
      setAgreements(data);
    } catch (err) {
      if (err instanceof Error && err.message === "Not authenticated") return;
      console.error("Failed to load agreements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleResume = (id: string) => {
    router.push(`/llp?id=${id}`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteLLPAgreement(deleteTarget);
      await load();
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Failed to delete agreement");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      });
    } catch { return iso; }
  };

  const stepLabel = (step: string) => {
    const map: Record<string, string> = {
      num_partners: "Getting Started",
      partner_details: "Partner Details",
      llp_details: "LLP Details",
      capital: "Capital & Contributions",
      profits: "Profit Sharing",
      business_objectives: "Business Objectives",
      other_points: "Other Points",
      review: "Review",
    };
    return map[step] || step.replace(/_/g, " ");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              LLP Agreements
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              View, resume, or start a new LLP agreement
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/llp"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0f1a2e] hover:bg-[#1a2a45] rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Agreement
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-[#0f1a2e] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-500 animate-pulse">Loading agreements...</p>
            </div>
          ) : agreements.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No agreements yet. Start by creating one!</p>
              <Link
                href="/llp"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0f1a2e] hover:bg-[#1a2a45] rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create LLP Agreement
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-widest">LLP Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-widest">Partners</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-widest">Current Step</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-widest">Last Updated</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {agreements.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{a.llpName}</td>
                        <td className="px-6 py-4 text-slate-600">{a.numPartners}</td>
                        <td className="px-6 py-4 text-slate-600 capitalize">{stepLabel(a.step)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                            a.isDone
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {a.isDone ? "Completed" : "Draft"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{formatDate(a.updatedAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleResume(a.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0f1a2e] hover:bg-[#1a2a45] rounded-md transition-colors"
                            >
                              {a.isDone ? <><Eye className="w-3 h-3" /> View</> : <><Play className="w-3 h-3" /> Resume</>}
                            </button>
                            <button
                              onClick={() => setDeleteTarget(a.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-200">
                {agreements.map((a) => (
                  <div key={a.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{a.llpName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {a.numPartners} partners · {stepLabel(a.step)}
                        </p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        a.isDone ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {a.isDone ? "Completed" : "Draft"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Updated: {formatDate(a.updatedAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResume(a.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0f1a2e] hover:bg-[#1a2a45] rounded-md transition-colors"
                      >
                        {a.isDone ? <><Eye className="w-3 h-3" /> View</> : <><Play className="w-3 h-3" /> Resume</>}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(a.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Agreement</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this LLP agreement? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
