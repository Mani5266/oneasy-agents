/**
 * Core Salary Calculation Engine
 * Implements all 16 XLSX-verified formulas in exact computation order.
 *
 * XLSX Formula Analysis:
 *   - C17 = Monthly CTC = Annual CTC / 12
 *   - C6 (Basic) = C17 * 50%
 *   - C7 (HRA) = C6 * E7       -> HRA = Basic x 35.49%
 *   - C8..C13 = C6 * E8..E13   -> Each = Basic x respective %
 *
 * Formula chain:
 *   1.  Monthly CTC = Annual CTC / 12
 *   2.  Basic = Monthly CTC x 50%
 *   3.  HRA = Basic x 35.4917%
 *   4.  Conveyance = Basic x 9.8729%
 *   5.  Medical = Basic x 5.9238%
 *   6.  Children Education = Basic x 1.9746%
 *   7.  Children Hostel = Basic x 1.9746%
 *   8.  Special Allowance = Basic x 9.8729%
 *   9.  LTA = Basic x 9.8729%
 *  10.  Employer EPF = 12% x min(Basic, 15000)
 *  11.  Employer ESI = 3.25% x Monthly CTC IF Monthly CTC <= 21000, else 0
 *  12.  Differential Allowance = Monthly CTC - SUM(Basic..LTA) - Employer EPF - Employer ESI
 *  13.  Employee EPF = 12% x min(Basic, 15000)
 *  14.  Employee ESI = 3.25% x Monthly CTC IF Monthly CTC <= 21000, else 0
 *  15.  PT = slab logic on Total Earnings
 *  16.  Net Salary = Total Earnings - (Employee EPF + Employee ESI + PT)
 */

import {
  epfEmployeeContribution,
  epfEmployerContribution,
  esiEmployeeContribution,
  esiEmployerContribution,
  esiIsEligible,
  calculatePT,
} from "./statutory";

// ---------------------------------------------------------------------------
// XLSX-verified component percentages
// Basic is % of Monthly CTC. All others are % of BASIC PAY.
// ---------------------------------------------------------------------------
const BASIC_PERCENTAGE_OF_CTC = 0.50;

const COMPONENT_PERCENTAGES_OF_BASIC: Record<string, number> = {
  hra: 0.354917647058824,
  conveyance: 0.0987294117647059,
  medical: 0.059237647058823534,
  children_education: 0.0197458823529412,
  children_hostel: 0.019745882352941176,
  special_allowance: 0.09872941176470588,
  lta: 0.09872941176470588,
};

// ---------------------------------------------------------------------------
// Result Interfaces
// ---------------------------------------------------------------------------
export interface EarningsBreakdown {
  basic: number;
  hra: number;
  conveyance: number;
  medical: number;
  children_education: number;
  children_hostel: number;
  special_allowance: number;
  lta: number;
  differential_allowance: number;
}

export interface DeductionsBreakdown {
  employee_epf: number;
  employee_esi: number;
  professional_tax: number;
}

export interface EmployerContributions {
  employer_epf: number;
  employer_esi: number;
}

export interface SalaryBreakdown {
  annual_ctc: number;
  monthly_ctc: number;
  earnings: EarningsBreakdown;
  deductions: DeductionsBreakdown;
  employer_contributions: EmployerContributions;
  net_salary_monthly: number;
  net_salary_annual: number;
  esi_eligible: boolean;
  state: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function earningsTotal(e: EarningsBreakdown): number {
  return round2(
    e.basic + e.hra + e.conveyance + e.medical +
    e.children_education + e.children_hostel +
    e.special_allowance + e.lta +
    e.differential_allowance
  );
}

function earningsSumBeforeDifferential(e: EarningsBreakdown): number {
  return round2(
    e.basic + e.hra + e.conveyance + e.medical +
    e.children_education + e.children_hostel +
    e.special_allowance + e.lta
  );
}

function deductionsTotal(d: DeductionsBreakdown): number {
  return round2(d.employee_epf + d.employee_esi + d.professional_tax);
}

function employerTotal(ec: EmployerContributions): number {
  return round2(ec.employer_epf + ec.employer_esi);
}

// ---------------------------------------------------------------------------
// Serialisation helpers (match Python to_dict output shape for API compat)
// ---------------------------------------------------------------------------
export function earningsToResponse(e: EarningsBreakdown) {
  return {
    basic_pay: round2(e.basic),
    hra: round2(e.hra),
    conveyance_allowance: round2(e.conveyance),
    medical_allowance: round2(e.medical),
    children_education: round2(e.children_education),
    children_hostel_allowance: round2(e.children_hostel),
    special_allowance: round2(e.special_allowance),
    lta: round2(e.lta),
    differential_allowance: round2(e.differential_allowance),
    total_earnings: earningsTotal(e),
  };
}

export function deductionsToResponse(d: DeductionsBreakdown) {
  return {
    employee_epf: round2(d.employee_epf),
    employee_esi: round2(d.employee_esi),
    professional_tax: round2(d.professional_tax),
    total_deductions: deductionsTotal(d),
  };
}

export function employerToResponse(ec: EmployerContributions) {
  return {
    employer_epf: round2(ec.employer_epf),
    employer_esi: round2(ec.employer_esi),
    total_employer_contributions: employerTotal(ec),
  };
}

export function breakdownToResponse(b: SalaryBreakdown) {
  return {
    annual_ctc: round2(b.annual_ctc),
    monthly_ctc: round2(b.monthly_ctc),
    earnings: earningsToResponse(b.earnings),
    deductions: deductionsToResponse(b.deductions),
    employer_contributions: employerToResponse(b.employer_contributions),
    net_salary_monthly: round2(b.net_salary_monthly),
    net_salary_annual: round2(b.net_salary_annual),
    esi_eligible: b.esi_eligible,
    state: b.state,
  };
}

// ---------------------------------------------------------------------------
// The Salary Calculation Engine
// ---------------------------------------------------------------------------

/**
 * Compute full salary breakdown from Annual CTC.
 * Follows the exact XLSX formula chain order.
 */
export function calculateSalary(annualCTC: number, state = "default"): SalaryBreakdown {
  if (annualCTC <= 0) {
    throw new Error("Annual CTC must be a positive number");
  }

  // Step 1: Monthly CTC
  const monthlyCTC = annualCTC / 12;

  // Step 2: Basic Pay = Monthly CTC x 50%
  const basic = monthlyCTC * BASIC_PERCENTAGE_OF_CTC;

  // Steps 3-9: Components = Basic x respective %
  const earnings: EarningsBreakdown = {
    basic,
    hra: basic * COMPONENT_PERCENTAGES_OF_BASIC.hra,
    conveyance: basic * COMPONENT_PERCENTAGES_OF_BASIC.conveyance,
    medical: basic * COMPONENT_PERCENTAGES_OF_BASIC.medical,
    children_education: basic * COMPONENT_PERCENTAGES_OF_BASIC.children_education,
    children_hostel: basic * COMPONENT_PERCENTAGES_OF_BASIC.children_hostel,
    special_allowance: basic * COMPONENT_PERCENTAGES_OF_BASIC.special_allowance,
    lta: basic * COMPONENT_PERCENTAGES_OF_BASIC.lta,
    differential_allowance: 0, // computed below
  };

  // Step 10: Employer EPF
  const employerEPF = epfEmployerContribution(earnings.basic);

  // Step 11: Employer ESI (conditional on Monthly CTC)
  const employerESI = esiEmployerContribution(monthlyCTC);

  const employer_contributions: EmployerContributions = {
    employer_epf: employerEPF,
    employer_esi: employerESI,
  };

  const esiEligible = esiIsEligible(monthlyCTC);

  // Step 12: Differential Allowance (TRUE residual)
  // = Monthly CTC - SUM(Basic..LTA) - Employer EPF - Employer ESI
  earnings.differential_allowance = round2(
    monthlyCTC - earningsSumBeforeDifferential(earnings) - employerEPF - employerESI
  );

  // Step 13: Employee EPF
  const employeeEPF = epfEmployeeContribution(earnings.basic);

  // Step 14: Employee ESI
  const employeeESI = esiEmployeeContribution(monthlyCTC);

  // Step 15: Professional Tax (on Total Earnings)
  const totalEarnings = earningsTotal(earnings);
  const professionalTax = calculatePT(totalEarnings, state);

  const deductions: DeductionsBreakdown = {
    employee_epf: employeeEPF,
    employee_esi: employeeESI,
    professional_tax: professionalTax,
  };

  // Step 16: Net Salary
  const netSalaryMonthly = round2(totalEarnings - deductionsTotal(deductions));
  const netSalaryAnnual = round2(netSalaryMonthly * 12);

  return {
    annual_ctc: annualCTC,
    monthly_ctc: round2(monthlyCTC),
    earnings,
    deductions,
    employer_contributions,
    net_salary_monthly: netSalaryMonthly,
    net_salary_annual: netSalaryAnnual,
    esi_eligible: esiEligible,
    state,
  };
}
