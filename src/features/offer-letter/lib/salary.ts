// ── Salary Breakdown Logic ──

import type { SalaryBreakdownRow } from '../types';

const SP = {
  BASIC: 0.50,
  HRA: 0.188,
  CONVEYANCE: 0.047,
  MEDICAL: 0.0282,
  CHILDREN_EDU: 0.0094,
  CHILDREN_HOST: 0.0094,
  SPECIAL: 0.047,
  LTA: 0.047,
  EMPLOYER_PF_OF_BASIC: 0.12,
};

export function buildBreakdown(ctc: number): SalaryBreakdownRow[] {
  const monthly = ctc / 12;
  const basic = Math.round(monthly * SP.BASIC);
  const hra = Math.round(monthly * SP.HRA);
  const convey = Math.round(monthly * SP.CONVEYANCE);
  const medical = Math.round(monthly * SP.MEDICAL);
  const childEdu = Math.round(monthly * SP.CHILDREN_EDU);
  const childHost = Math.round(monthly * SP.CHILDREN_HOST);
  const special = Math.round(monthly * SP.SPECIAL);
  const lta = Math.round(monthly * SP.LTA);
  const empPF = Math.round(basic * SP.EMPLOYER_PF_OF_BASIC);

  const allocated = basic + hra + convey + medical + childEdu + childHost + special + lta + empPF;
  const diff = Math.round(monthly) - allocated;
  const totalM = basic + hra + convey + medical + childEdu + childHost + special + lta + diff + empPF;

  const annualFixed = (basic + hra + convey + medical + childEdu + childHost + special + lta + empPF) * 12;
  const diffAnnual = ctc - annualFixed;

  return [
    { label: 'Basic Pay', monthly: basic, annual: basic * 12, type: 'earn' },
    { label: 'House Rent Allowance (HRA)', monthly: hra, annual: hra * 12, type: 'earn' },
    { label: 'Conveyance Allowance', monthly: convey, annual: convey * 12, type: 'earn' },
    { label: 'Medical Allowance', monthly: medical, annual: medical * 12, type: 'earn' },
    { label: 'Children Education', monthly: childEdu, annual: childEdu * 12, type: 'earn' },
    { label: 'Children Hostel Allowance', monthly: childHost, annual: childHost * 12, type: 'earn' },
    { label: 'Special Allowance', monthly: special, annual: special * 12, type: 'earn' },
    { label: 'Leave Travel Allowance', monthly: lta, annual: lta * 12, type: 'earn' },
    { label: 'Differential Allowance', monthly: diff, annual: diffAnnual, type: 'earn' },
    { label: "Employer's contribution to PF", monthly: empPF, annual: empPF * 12, type: 'earn' },
    { label: 'Total Salary (in Rs.)', monthly: totalM, annual: ctc, type: 'total' },
  ];
}
