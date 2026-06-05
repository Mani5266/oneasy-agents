/**
 * Database persistence service - Supabase backend.
 *
 * All methods are fire-and-forget safe: if Supabase is not configured or a
 * write fails, the caller is NOT affected. Salary engine results are always
 * returned regardless of persistence success.
 *
 * Table name mappings (unified app):
 *   salary_calculations -> salary_results
 *   payslips -> salary_payslips
 */

import { getSupabaseClient } from "./supabase";
import type { SalaryBreakdown } from "../engine/salary-calculator";
import { earningsTotal, deductionsTotal } from "./helpers";

const PAYSLIPS_BUCKET = "salary-payslips";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// Re-export helper functions that compute totals from breakdown objects
function getEarningsTotal(b: SalaryBreakdown): number {
  const e = b.earnings;
  return round2(
    e.basic + e.hra + e.conveyance + e.medical +
    e.children_education + e.children_hostel +
    e.special_allowance + e.lta + e.differential_allowance
  );
}

function getDeductionsTotal(b: SalaryBreakdown): number {
  const d = b.deductions;
  return round2(d.employee_epf + d.employee_esi + d.professional_tax);
}

// ------------------------------------------------------------------
// Salary calculation persistence
// ------------------------------------------------------------------
export async function saveCalculation(
  breakdown: SalaryBreakdown,
  calculationType = "standard",
  employeeName?: string,
): Promise<string | null> {
  const client = await getSupabaseClient();
  if (!client) return null;

  try {
    const row = {
      annual_ctc: breakdown.annual_ctc,
      monthly_ctc: breakdown.monthly_ctc,
      state: breakdown.state,
      basic: round2(breakdown.earnings.basic),
      hra: round2(breakdown.earnings.hra),
      conveyance: round2(breakdown.earnings.conveyance),
      medical: round2(breakdown.earnings.medical),
      children_education: round2(breakdown.earnings.children_education),
      children_hostel: round2(breakdown.earnings.children_hostel),
      special_allowance: round2(breakdown.earnings.special_allowance),
      lta: round2(breakdown.earnings.lta),
      differential_allowance: round2(breakdown.earnings.differential_allowance),
      total_earnings: getEarningsTotal(breakdown),
      employee_epf: round2(breakdown.deductions.employee_epf),
      employee_esi: round2(breakdown.deductions.employee_esi),
      professional_tax: round2(breakdown.deductions.professional_tax),
      total_deductions: getDeductionsTotal(breakdown),
      employer_epf: round2(breakdown.employer_contributions.employer_epf),
      employer_esi: round2(breakdown.employer_contributions.employer_esi),
      net_salary_monthly: breakdown.net_salary_monthly,
      net_salary_annual: breakdown.net_salary_annual,
      esi_eligible: breakdown.esi_eligible,
      employee_name: employeeName ?? null,
      calculation_type: calculationType,
    };
    const result = await client.from("salary_results").insert(row).select("id").single();
    return result.data?.id ?? null;
  } catch (e) {
    console.warn("Failed to persist salary calculation:", e);
    return null;
  }
}

export async function getRecentCalculations(limit = 50) {
  const client = await getSupabaseClient();
  if (!client) return [];

  try {
    const { data } = await client
      .from("salary_results")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch (e) {
    console.warn("Failed to fetch calculations:", e);
    return [];
  }
}

// ------------------------------------------------------------------
// Payslip PDF storage
// ------------------------------------------------------------------
export async function uploadPayslipPDF(params: {
  pdfBytes: Uint8Array;
  fileName: string;
  employeeName: string;
  month: string;
  annualCTC: number;
  netSalary: number;
  companyName?: string;
}): Promise<string | null> {
  const client = await getSupabaseClient();
  if (!client) return null;

  try {
    await client.storage.from(PAYSLIPS_BUCKET).upload(params.fileName, params.pdfBytes, {
      contentType: "application/pdf",
    });

    const { data: urlData } = client.storage.from(PAYSLIPS_BUCKET).getPublicUrl(params.fileName);
    const publicUrl = urlData.publicUrl;

    await client.from("salary_payslips").insert({
      employee_name: params.employeeName,
      company_name: params.companyName ?? "",
      month: params.month,
      annual_ctc: params.annualCTC,
      net_salary: params.netSalary,
      file_name: params.fileName,
      pdf_url: publicUrl,
    });

    return publicUrl;
  } catch (e) {
    console.warn("Failed to upload payslip PDF:", e);
    return null;
  }
}
