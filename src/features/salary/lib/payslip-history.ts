/**
 * Payslip History Store - localStorage-backed persistence for generated payslips.
 *
 * Each payslip record stores the form inputs + generated HTML so users can
 * view, re-edit, regenerate, or delete past payslips.
 */

const STORAGE_KEY = "oneasy_payslip_history";

export interface PayslipHistoryRecord {
  id: string;
  created_at: string;
  updated_at: string;
  // Form inputs (for re-editing)
  company_name: string;
  employee_name: string;
  employee_code: string;
  gender: string;
  designation: string;
  date_of_joining: string;
  annual_ctc: number;
  month: string;
  standard_days: number;
  days_worked: number;
  // Generated output
  payslip_html: string;
  net_salary_monthly: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getPayslipHistory(): PayslipHistoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const records: PayslipHistoryRecord[] = JSON.parse(raw);
    // Sort newest first
    records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Auto-cleanup: remove duplicates (same employee, company, month, CTC
    // created within 60 seconds of each other). Keeps the earliest entry.
    const seen = new Set<string>();
    const deduped: PayslipHistoryRecord[] = [];
    for (const r of records) {
      const key = `${r.employee_name}|${r.company_name}|${r.month}|${r.annual_ctc}`;
      // Build a time-bucketed key (records within 60s share the same bucket)
      const bucket = Math.floor(new Date(r.created_at).getTime() / 60_000);
      const dedupKey = `${key}|${bucket}`;
      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        deduped.push(r);
      }
    }

    // Persist the cleaned list if duplicates were removed
    if (deduped.length < records.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
    }

    return deduped;
  } catch {
    return [];
  }
}

export function savePayslipToHistory(
  formData: {
    company_name: string;
    employee_name: string;
    employee_code: string;
    gender: string;
    designation: string;
    date_of_joining: string;
    annual_ctc: number;
    month: string;
    standard_days: number;
    days_worked: number;
  },
  payslip_html: string,
  net_salary_monthly: number,
): PayslipHistoryRecord {
  const now = new Date().toISOString();
  const record: PayslipHistoryRecord = {
    id: generateId(),
    created_at: now,
    updated_at: now,
    ...formData,
    payslip_html,
    net_salary_monthly,
  };

  const existing = getPayslipHistory();

  // Deduplicate: reject if an identical record (same employee, company, month,
  // CTC) was saved within the last 10 seconds — guards against double-clicks
  // and accidental re-submissions.
  const TEN_SECONDS = 10_000;
  const isDuplicate = existing.some((r) => {
    const timeDiff = new Date(now).getTime() - new Date(r.created_at).getTime();
    return (
      timeDiff < TEN_SECONDS &&
      r.employee_name === formData.employee_name &&
      r.company_name === formData.company_name &&
      r.month === formData.month &&
      r.annual_ctc === formData.annual_ctc
    );
  });

  if (isDuplicate) {
    // Return the already-saved record instead of creating a duplicate
    return existing[0];
  }

  existing.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return record;
}

export function updatePayslipInHistory(
  id: string,
  formData: {
    company_name: string;
    employee_name: string;
    employee_code: string;
    gender: string;
    designation: string;
    date_of_joining: string;
    annual_ctc: number;
    month: string;
    standard_days: number;
    days_worked: number;
  },
  payslip_html: string,
  net_salary_monthly: number,
): PayslipHistoryRecord | null {
  const records = getPayslipHistory();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  records[idx] = {
    ...records[idx],
    ...formData,
    payslip_html,
    net_salary_monthly,
    updated_at: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return records[idx];
}

export function deletePayslipFromHistory(id: string): boolean {
  const records = getPayslipHistory();
  const filtered = records.filter((r) => r.id !== id);
  if (filtered.length === records.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function getPayslipById(id: string): PayslipHistoryRecord | null {
  const records = getPayslipHistory();
  return records.find((r) => r.id === id) ?? null;
}

export function getPayslipCount(): number {
  return getPayslipHistory().length;
}
