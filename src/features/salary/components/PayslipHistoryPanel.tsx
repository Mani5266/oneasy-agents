"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPayslipHistory,
  deletePayslipFromHistory,
  type PayslipHistoryRecord,
} from "../lib/payslip-history";
import { formatINR } from "../lib/api";

interface PayslipHistoryPanelProps {
  onEdit?: (record: PayslipHistoryRecord) => void;
}

export default function PayslipHistoryPanel({ onEdit }: PayslipHistoryPanelProps) {
  const [records, setRecords] = useState<PayslipHistoryRecord[]>([]);
  const [previewRecord, setPreviewRecord] = useState<PayslipHistoryRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadRecords = useCallback(() => {
    setRecords(getPayslipHistory());
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleDelete = (id: string) => {
    deletePayslipFromHistory(id);
    setDeleteConfirm(null);
    setPreviewRecord(null);
    loadRecords();
  };

  const filteredRecords = records.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.employee_name.toLowerCase().includes(q) ||
      r.company_name.toLowerCase().includes(q) ||
      r.employee_code.toLowerCase().includes(q) ||
      r.month.toLowerCase().includes(q) ||
      r.designation.toLowerCase().includes(q)
    );
  });

  const handlePrint = (record: PayslipHistoryRecord) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(record.payslip_html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  // Preview modal
  if (previewRecord) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPreviewRecord(null)}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to History
          </button>
          <div className="flex gap-2">
            <button onClick={() => handlePrint(previewRecord)} className="btn-secondary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(previewRecord);
                  setPreviewRecord(null);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit & Regenerate
              </button>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="section-header">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-[var(--accent-muted)]">
              <svg className="w-3 h-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3>{previewRecord.employee_name} &mdash; {previewRecord.month}</h3>
            <span className="text-[11px] text-[var(--text-faint)]">
              Generated {new Date(previewRecord.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="p-1 bg-white">
            <iframe
              srcDoc={previewRecord.payslip_html}
              className="w-full border-0"
              style={{ minHeight: "700px" }}
              title="Payslip Preview"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card" style={{ "--stat-accent": "var(--accent)" } as React.CSSProperties}>
          <p className="stat-label">Total Generated</p>
          <p className="stat-value text-[var(--text-primary)]">{records.length}</p>
        </div>
        <div className="stat-card" style={{ "--stat-accent": "#7C3AED" } as React.CSSProperties}>
          <p className="stat-label">This Month</p>
          <p className="stat-value text-[var(--text-primary)]">
            {records.filter((r) => {
              const d = new Date(r.created_at);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
        <div className="stat-card" style={{ "--stat-accent": "#0891B2" } as React.CSSProperties}>
          <p className="stat-label">Unique Employees</p>
          <p className="stat-value text-[var(--text-primary)]">
            {new Set(records.map((r) => r.employee_name.toLowerCase())).size}
          </p>
        </div>
        <div className="stat-card" style={{ "--stat-accent": "#D97706" } as React.CSSProperties}>
          <p className="stat-label">Unique Companies</p>
          <p className="stat-value text-[var(--text-primary)]">
            {new Set(records.map((r) => r.company_name.toLowerCase())).size}
          </p>
        </div>
      </div>

      {/* Search & Table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Payslip History
          </p>
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, company, month..."
              className="input-field pl-9 w-[280px]"
            />
          </div>
        </div>

        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Company</th>
                  <th>Month</th>
                  <th>CTC</th>
                  <th className="text-right">Net Salary</th>
                  <th>Generated On</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, idx) => (
                  <tr key={record.id}>
                    <td className="text-[var(--text-faint)] font-mono text-[11px]">{idx + 1}</td>
                    <td>
                      <div>
                        <span className="font-medium text-[var(--text-primary)]">{record.employee_name}</span>
                        {record.employee_code && (
                          <span className="text-[11px] text-[var(--text-faint)] ml-1.5">({record.employee_code})</span>
                        )}
                      </div>
                      {record.designation && (
                        <span className="text-[11px] text-[var(--text-muted)]">{record.designation}</span>
                      )}
                    </td>
                    <td className="text-[var(--text-secondary)]">{record.company_name}</td>
                    <td>
                      <span className="badge badge-neutral">{record.month}</span>
                    </td>
                    <td className="font-mono text-[var(--text-secondary)]">{formatINR(record.annual_ctc)}/yr</td>
                    <td className="amount font-bold text-[var(--accent)]">{formatINR(record.net_salary_monthly)}</td>
                    <td className="text-[12px] text-[var(--text-muted)]">
                      {new Date(record.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      <br />
                      <span className="text-[11px] text-[var(--text-faint)]">
                        {new Date(record.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        {/* View */}
                        <button
                          onClick={() => setPreviewRecord(record)}
                          className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors"
                          title="View payslip"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {/* Edit */}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(record)}
                            className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[#D97706] hover:bg-amber-50 transition-colors"
                            title="Edit & regenerate"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {/* Print */}
                        <button
                          onClick={() => handlePrint(record)}
                          className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[#0891B2] hover:bg-cyan-50 transition-colors"
                          title="Print payslip"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                        {/* Delete */}
                        {deleteConfirm === record.id ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="px-2 py-1 text-[11px] font-medium bg-red-500 text-white rounded-[var(--radius-md)] hover:bg-red-600 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-[11px] font-medium text-[var(--text-muted)] rounded-[var(--radius-md)] hover:bg-[var(--bg-subtle)] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(record.id)}
                            className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-50 transition-colors"
                            title="Delete payslip"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-[var(--border-default)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[14px] font-medium text-[var(--text-muted)]">
              {searchTerm ? "No payslips match your search" : "No payslips generated yet"}
            </p>
            <p className="text-[12px] text-[var(--text-faint)] mt-1">
              {searchTerm ? "Try a different search term" : "Go to the Payslip tab to generate your first payslip"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
