/**
 * API client for the On Easy Salary Calculator.
 */

const API_BASE = "/api/salary";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Earnings {
  basic_pay: number;
  hra: number;
  conveyance_allowance: number;
  medical_allowance: number;
  children_education: number;
  children_hostel_allowance: number;
  special_allowance: number;
  lta: number;
  differential_allowance: number;
  total_earnings: number;
}

export interface Deductions {
  employee_epf: number;
  employee_esi: number;
  professional_tax: number;
  total_deductions: number;
}

export interface EmployerContributions {
  employer_epf: number;
  employer_esi: number;
  total_employer_contributions: number;
}

export interface SalaryBreakdown {
  annual_ctc: number;
  monthly_ctc: number;
  earnings: Earnings;
  deductions: Deductions;
  employer_contributions: EmployerContributions;
  net_salary_monthly: number;
  net_salary_annual: number;
  esi_eligible: boolean;
  state: string;
}

export interface PayslipResponse {
  employee_name: string;
  month: string;
  salary_breakdown: SalaryBreakdown;
  payslip_html: string;
  pdf_url?: string | null;
}

export interface TaxRegimeResult {
  regime: "old" | "new";
  taxable_income: number;
  income_tax: number;
  cess: number;
  total_tax: number;
  effective_rate: number;
}

export interface TaxComparisonResponse {
  old_regime: TaxRegimeResult;
  new_regime: TaxRegimeResult;
  recommended: "old" | "new";
  savings: number;
}

export interface CTCComparisonResponse {
  current: SalaryBreakdown;
  proposed: SalaryBreakdown;
  delta: {
    annual_ctc: number;
    monthly_ctc: number;
    net_salary_monthly: number;
    net_salary_annual: number;
    employer_cost_monthly: number;
    hike_percentage: number;
  };
  flags: {
    esi_threshold_crossing: boolean;
    esi_current: boolean;
    esi_proposed: boolean;
  };
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  employee_code: string;
  designation: string;
  department: string;
  date_of_joining: string;
  annual_ctc: number;
  state: string;
  gender: string;
  created_at?: string;
  updated_at?: string;
}

export interface CalculationHistoryItem {
  id: string;
  annual_ctc: number;
  monthly_ctc: number;
  net_salary_monthly: number;
  net_salary_annual: number;
  state: string;
  esi_eligible: boolean;
  employee_name: string | null;
  calculation_type: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
export function formatINR(n: number): string {
  if (n === 0) return "0.00";
  const negative = n < 0;
  const abs = Math.abs(n);
  const integer = Math.floor(abs);
  const decimal = (abs - integer).toFixed(2).slice(1);
  const s = integer.toString();
  let formatted: string;
  if (s.length <= 3) {
    formatted = s;
  } else {
    const last3 = s.slice(-3);
    let remaining = s.slice(0, -3);
    const groups: string[] = [];
    while (remaining.length > 0) {
      groups.unshift(remaining.slice(-2));
      remaining = remaining.slice(0, -2);
    }
    formatted = groups.join(",") + "," + last3;
  }
  return (negative ? "-" : "") + formatted + decimal;
}

export function formatINRCompact(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(0);
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------
export async function calculateSalary(
  annual_ctc: number,
  state = "default"
): Promise<SalaryBreakdown> {
  const res = await fetch(`${API_BASE}/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ annual_ctc, state }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function generatePayslip(data: {
  company_name: string;
  employee_name: string;
  annual_ctc: number;
  month: string;
  employee_code?: string;
  gender?: string;
  designation?: string;
  date_of_joining?: string;
  standard_days?: number;
  days_worked?: number;
  state?: string;
  company_logo?: string;
}): Promise<PayslipResponse> {
  const res = await fetch(`${API_BASE}/payslip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function compareCTC(
  current_ctc: number,
  new_ctc: number,
  state = "default"
): Promise<CTCComparisonResponse> {
  const res = await fetch(`${API_BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_ctc, new_ctc, state }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function compareTaxRegimes(
  annual_ctc: number,
  deductions_80c = 150000,
  deductions_80d = 25000,
  hra_exemption = 0,
): Promise<TaxComparisonResponse> {
  const res = await fetch(`${API_BASE}/tax-compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ annual_ctc, deductions_80c, deductions_80d, hra_exemption }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getCalculationHistory(limit = 50): Promise<CalculationHistoryItem[]> {
  const res = await fetch(`${API_BASE}/history?limit=${limit}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Employee CRUD
export async function getEmployees(): Promise<Employee[]> {
  const res = await fetch(`${API_BASE}/employees`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function saveEmployee(data: Omit<Employee, "id" | "created_at" | "updated_at">): Promise<Employee> {
  const res = await fetch(`${API_BASE}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.detail ?? `API error: ${res.status}`);
  }
  return res.json();
}

export async function updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
  const res = await fetch(`${API_BASE}/employees`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.detail ?? `API error: ${res.status}`);
  }
  return res.json();
}

export async function deleteEmployee(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/employees?id=${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

// Bulk payslip
export async function generateBulkPayslips(data: {
  company_name: string;
  month: string;
  company_logo?: string;
  employees: { name: string; employee_code: string; annual_ctc: number; designation?: string; date_of_joining?: string; gender?: string; state?: string }[];
}): Promise<{ results: { employee_name: string; payslip_html: string; status: string; error?: string }[]; total: number; success: number; failed: number }> {
  const res = await fetch(`${API_BASE}/payslip/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
