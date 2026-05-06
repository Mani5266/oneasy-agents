"use client";

import { useState, useRef, useEffect } from "react";
import { generatePayslip, getEmployees, type PayslipResponse, type Employee } from "../lib/api";
import {
  savePayslipToHistory,
  updatePayslipInHistory,
  type PayslipHistoryRecord,
} from "../lib/payslip-history";

interface PayslipGeneratorProps {
  editRecord?: PayslipHistoryRecord | null;
  onEditComplete?: () => void;
}

export default function PayslipGenerator({ editRecord, onEditComplete }: PayslipGeneratorProps) {
  const [form, setForm] = useState({
    company_name: "",
    employee_name: "",
    employee_code: "",
    gender: "Male",
    designation: "",
    date_of_joining: "",
    annual_ctc: "",
    month: "April 2025",
    standard_days: "30",
    days_worked: "30",
  });
  const [result, setResult] = useState<PayslipResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string>("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generatingRef = useRef(false);

  // Fetch saved employees from directory
  useEffect(() => {
    getEmployees()
      .then(setEmployees)
      .catch(() => setEmployees([]));
  }, []);

  // Load edit record into form if provided
  useEffect(() => {
    if (editRecord) {
      setForm({
        company_name: editRecord.company_name,
        employee_name: editRecord.employee_name,
        employee_code: editRecord.employee_code,
        gender: editRecord.gender || "Male",
        designation: editRecord.designation,
        date_of_joining: editRecord.date_of_joining,
        annual_ctc: editRecord.annual_ctc.toString(),
        month: editRecord.month,
        standard_days: editRecord.standard_days.toString(),
        days_worked: editRecord.days_worked.toString(),
      });
      setResult(null);
      setSaved(false);
    }
  }, [editRecord]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    if (!empId) return;
    const emp = employees.find((em) => em.id === empId);
    if (!emp) return;
    setForm((prev) => ({
      ...prev,
      employee_name: emp.name,
      employee_code: emp.employee_code || "",
      gender: emp.gender || "Male",
      designation: emp.designation || "",
      date_of_joining: emp.date_of_joining || "",
      annual_ctc: emp.annual_ctc?.toString() || "",
    }));
    setResult(null);
    setSaved(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, SVG)");
      return;
    }

    // Validate file size (max 500KB)
    if (file.size > 512000) {
      setError("Logo file must be under 500KB");
      return;
    }

    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setCompanyLogo(reader.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setCompanyLogo(null);
    setLogoFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!form.company_name || !form.employee_name || !form.annual_ctc) {
      setError("Company name, Employee name and Annual CTC are required");
      return;
    }

    // Prevent double-click / duplicate invocations
    if (generatingRef.current) return;
    generatingRef.current = true;

    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const data = await generatePayslip({
        company_name: form.company_name,
        employee_name: form.employee_name,
        employee_code: form.employee_code,
        gender: form.gender,
        designation: form.designation,
        date_of_joining: form.date_of_joining,
        annual_ctc: parseFloat(form.annual_ctc),
        month: form.month,
        standard_days: parseInt(form.standard_days) || 30,
        days_worked: parseInt(form.days_worked) || 30,
        company_logo: companyLogo ?? undefined,
      });
      setResult(data);

      // Save to history
      const formData = {
        company_name: form.company_name,
        employee_name: form.employee_name,
        employee_code: form.employee_code,
        gender: form.gender,
        designation: form.designation,
        date_of_joining: form.date_of_joining,
        annual_ctc: parseFloat(form.annual_ctc),
        month: form.month,
        standard_days: parseInt(form.standard_days) || 30,
        days_worked: parseInt(form.days_worked) || 30,
      };

      if (editRecord) {
        updatePayslipInHistory(editRecord.id, formData, data.payslip_html, data.salary_breakdown.net_salary_monthly);
        onEditComplete?.();
      } else {
        savePayslipToHistory(formData, data.payslip_html, data.salary_breakdown.net_salary_monthly);
      }
      setSaved(true);
    } catch {
      setError("Failed to generate payslip. Please try again.");
    } finally {
      setLoading(false);
      generatingRef.current = false;
    }
  };

  const handlePrint = () => {
    if (!result) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(result.payslip_html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setPdfLoading(true);

    try {
      // Use the browser's built-in print-to-PDF via an iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.top = "-10000px";
      iframe.style.left = "-10000px";
      iframe.style.width = "800px";
      iframe.style.height = "1200px";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Unable to create iframe for PDF");
      }

      iframeDoc.open();
      iframeDoc.write(result.payslip_html);
      iframeDoc.close();

      // Wait for content to render, then trigger save-as-PDF via print dialog
      await new Promise((resolve) => setTimeout(resolve, 800));

      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        iframeWindow.print();
      }

      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    } catch {
      setError("PDF download failed. Use Print / PDF as an alternative.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
      {/* Form */}
      <div className="card p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                {editRecord ? "Edit & Regenerate Payslip" : "Payslip Generator"}
              </h2>
              <p className="text-[13px] text-[var(--text-muted)] mt-1">
                {editRecord
                  ? `Editing payslip for ${editRecord.employee_name} — ${editRecord.month}`
                  : "Fill in the details below to generate a professional payslip"}
              </p>
            </div>
            {editRecord && onEditComplete && (
              <button onClick={onEditComplete} className="btn-secondary text-[12px]">
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* Quick-fill from Employee Directory */}
        {!editRecord && employees.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-3">
              Quick Fill from Employee Directory
            </p>
            <div className="flex items-center gap-3">
              <select
                onChange={handleEmployeeSelect}
                defaultValue=""
                className="input-field max-w-md"
              >
                <option value="" disabled>
                  Select a saved employee to auto-fill...
                </option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}{emp.employee_code ? ` (${emp.employee_code})` : ""}{emp.designation ? ` — ${emp.designation}` : ""}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-[var(--text-faint)]">
                Employee details will be auto-filled
              </span>
            </div>
          </div>
        )}

        {!editRecord && employees.length > 0 && <hr className="divider my-6" />}

        {/* Company & Employee Section */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-3">
            Company & Employee Details
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Company Name" name="company_name" value={form.company_name} onChange={handleChange} placeholder="e.g. Acme Technologies Pvt Ltd" required />
            <FormField label="Employee Name" name="employee_name" value={form.employee_name} onChange={handleChange} placeholder="e.g. Ravi Kumar" required />
            <FormField label="Employee Code" name="employee_code" value={form.employee_code} onChange={handleChange} placeholder="e.g. EMP001" />
            <div>
              <label className="form-label">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <FormField label="Designation" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Software Engineer" />
            <FormField label="Date of Joining" name="date_of_joining" type="date" value={form.date_of_joining} onChange={handleChange} />
          </div>
        </div>

        <hr className="divider my-6" />

        {/* Company Logo Upload */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-3">
            Company Logo (Optional)
          </p>
          <div className="flex items-center gap-4">
            {companyLogo ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-default)]">
                <img
                  src={companyLogo}
                  alt="Company logo preview"
                  className="h-8 max-w-[120px] object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-[12px] text-[var(--text-secondary)] font-medium truncate max-w-[150px]">
                    {logoFileName}
                  </span>
                  <button
                    onClick={removeLogo}
                    className="text-[11px] text-[var(--danger)] hover:underline text-left mt-0.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] text-[12px] font-medium text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload Logo
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <span className="text-[11px] text-[var(--text-faint)]">
              PNG, JPG or SVG, max 500KB
            </span>
          </div>
        </div>

        <hr className="divider my-6" />

        {/* Salary & Period Section */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-3">
            Salary & Period
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Annual CTC (INR)" name="annual_ctc" type="number" value={form.annual_ctc} onChange={handleChange} placeholder="e.g. 480000" required />
            <FormField label="Payslip Month" name="month" value={form.month} onChange={handleChange} placeholder="e.g. April 2025" />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Standard Days" name="standard_days" type="number" value={form.standard_days} onChange={handleChange} />
              <FormField label="Days Worked" name="days_worked" type="number" value={form.days_worked} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 items-center flex-wrap">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Payslip
              </>
            )}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent)]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {editRecord ? "Updated & saved" : "Saved to history"}
            </span>
          )}
          {result && (
            <>
              <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="btn-secondary flex items-center gap-2"
              >
                {pdfLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Preparing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="alert alert-error mt-4">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Payslip Preview */}
      {result && (
        <div className="card overflow-hidden animate-fade-in">
          <div className="section-header">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-[var(--accent-muted)]">
              <svg className="w-3 h-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3>Preview &mdash; {result.employee_name} &mdash; {result.month}</h3>
            <span className="badge badge-success section-badge">Ready</span>
          </div>
          <div className="p-1 bg-white">
            <iframe
              srcDoc={result.payslip_html}
              className="w-full border-0"
              style={{ minHeight: "700px" }}
              title="Payslip Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="form-label">
        {label}{required && <span className="text-[var(--danger)] ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
}
