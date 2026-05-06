/**
 * Shared helper functions for services.
 */

import type { SalaryBreakdown } from "../engine/salary-calculator";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function earningsTotal(b: SalaryBreakdown): number {
  const e = b.earnings;
  return round2(
    e.basic + e.hra + e.conveyance + e.medical +
    e.children_education + e.children_hostel +
    e.special_allowance + e.lta + e.differential_allowance
  );
}

export function deductionsTotal(b: SalaryBreakdown): number {
  const d = b.deductions;
  return round2(d.employee_epf + d.employee_esi + d.professional_tax);
}
