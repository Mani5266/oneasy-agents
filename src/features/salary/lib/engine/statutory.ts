/**
 * Statutory Compliance Module
 * EPF, ESI, and Professional Tax rules as per XLSX-verified formulas.
 * Multi-state PT support for all major Indian states.
 */

// ---------------------------------------------------------------------------
// EPF Rules
// ---------------------------------------------------------------------------
export interface EPFConfig {
  employeeRate: number; // 12% of Basic
  employerRate: number; // 12% of Basic
  wageCeiling: number; // Basic cap for PF calculation
}

const DEFAULT_EPF: EPFConfig = {
  employeeRate: 0.12,
  employerRate: 0.12,
  wageCeiling: 15_000,
};

export function epfCappedWage(basic: number, config = DEFAULT_EPF): number {
  return Math.min(basic, config.wageCeiling);
}

export function epfEmployeeContribution(basic: number, config = DEFAULT_EPF): number {
  return Math.round(config.employeeRate * epfCappedWage(basic, config) * 100) / 100;
}

export function epfEmployerContribution(basic: number, config = DEFAULT_EPF): number {
  return Math.round(config.employerRate * epfCappedWage(basic, config) * 100) / 100;
}

// ---------------------------------------------------------------------------
// ESI Rules
// ---------------------------------------------------------------------------
export interface ESIConfig {
  employeeRate: number; // 3.25% of Monthly CTC (XLSX: C21=J12)
  employerRate: number; // 3.25% of Monthly CTC
  grossThreshold: number; // ESI applicable only if Monthly CTC <= threshold
}

const DEFAULT_ESI: ESIConfig = {
  employeeRate: 0.0325,
  employerRate: 0.0325,
  grossThreshold: 21_000,
};

export function esiIsEligible(monthlyCTC: number, config = DEFAULT_ESI): boolean {
  return monthlyCTC <= config.grossThreshold;
}

export function esiEmployeeContribution(monthlyCTC: number, config = DEFAULT_ESI): number {
  if (!esiIsEligible(monthlyCTC, config)) return 0;
  return Math.round(config.employeeRate * monthlyCTC * 100) / 100;
}

export function esiEmployerContribution(monthlyCTC: number, config = DEFAULT_ESI): number {
  if (!esiIsEligible(monthlyCTC, config)) return 0;
  return Math.round(config.employerRate * monthlyCTC * 100) / 100;
}

// ---------------------------------------------------------------------------
// Professional Tax Rules — Multi-state
// ---------------------------------------------------------------------------
export interface PTSlab {
  minSalary: number;
  maxSalary: number | null; // null = no upper limit
  tax: number;
}

const DEFAULT_SLABS: PTSlab[] = [
  { minSalary: 0, maxSalary: 14_999.99, tax: 0 },
  { minSalary: 15_000, maxSalary: 19_999.99, tax: 150 },
  { minSalary: 20_000, maxSalary: null, tax: 200 },
];

const STATE_SLABS: Record<string, PTSlab[]> = {
  default: DEFAULT_SLABS,

  // Karnataka — max Rs 200/mo
  karnataka: [
    { minSalary: 0, maxSalary: 14_999.99, tax: 0 },
    { minSalary: 15_000, maxSalary: 24_999.99, tax: 150 },
    { minSalary: 25_000, maxSalary: null, tax: 200 },
  ],

  // Maharashtra — max Rs 300/mo (Feb: Rs 300)
  maharashtra: [
    { minSalary: 0, maxSalary: 7_499.99, tax: 0 },
    { minSalary: 7_500, maxSalary: 9_999.99, tax: 175 },
    { minSalary: 10_000, maxSalary: null, tax: 200 },
  ],

  // Telangana
  telangana: [
    { minSalary: 0, maxSalary: 14_999.99, tax: 0 },
    { minSalary: 15_000, maxSalary: 19_999.99, tax: 150 },
    { minSalary: 20_000, maxSalary: null, tax: 200 },
  ],

  // Tamil Nadu
  tamil_nadu: [
    { minSalary: 0, maxSalary: 21_000, tax: 0 },
    { minSalary: 21_001, maxSalary: 30_000, tax: 135 },
    { minSalary: 30_001, maxSalary: 45_000, tax: 315 },
    { minSalary: 45_001, maxSalary: 60_000, tax: 690 },
    { minSalary: 60_001, maxSalary: 75_000, tax: 1025 },
    { minSalary: 75_001, maxSalary: null, tax: 1250 },
  ],

  // Andhra Pradesh
  andhra_pradesh: [
    { minSalary: 0, maxSalary: 14_999.99, tax: 0 },
    { minSalary: 15_000, maxSalary: 19_999.99, tax: 150 },
    { minSalary: 20_000, maxSalary: null, tax: 200 },
  ],

  // West Bengal
  west_bengal: [
    { minSalary: 0, maxSalary: 10_000, tax: 0 },
    { minSalary: 10_001, maxSalary: 15_000, tax: 110 },
    { minSalary: 15_001, maxSalary: 25_000, tax: 130 },
    { minSalary: 25_001, maxSalary: 40_000, tax: 150 },
    { minSalary: 40_001, maxSalary: null, tax: 200 },
  ],

  // Gujarat
  gujarat: [
    { minSalary: 0, maxSalary: 5_999.99, tax: 0 },
    { minSalary: 6_000, maxSalary: 8_999.99, tax: 80 },
    { minSalary: 9_000, maxSalary: 11_999.99, tax: 150 },
    { minSalary: 12_000, maxSalary: null, tax: 200 },
  ],

  // Rajasthan
  rajasthan: [
    { minSalary: 0, maxSalary: 12_000, tax: 0 },
    { minSalary: 12_001, maxSalary: 15_000, tax: 100 },
    { minSalary: 15_001, maxSalary: 25_000, tax: 150 },
    { minSalary: 25_001, maxSalary: null, tax: 200 },
  ],

  // Madhya Pradesh
  madhya_pradesh: [
    { minSalary: 0, maxSalary: 12_500, tax: 0 },
    { minSalary: 12_501, maxSalary: 16_666, tax: 125 },
    { minSalary: 16_667, maxSalary: null, tax: 208 },
  ],

  // Kerala
  kerala: [
    { minSalary: 0, maxSalary: 11_999.99, tax: 0 },
    { minSalary: 12_000, maxSalary: 17_999.99, tax: 120 },
    { minSalary: 18_000, maxSalary: 24_999.99, tax: 180 },
    { minSalary: 25_000, maxSalary: null, tax: 250 },
  ],

  // Odisha
  odisha: [
    { minSalary: 0, maxSalary: 13_304, tax: 0 },
    { minSalary: 13_305, maxSalary: 25_000, tax: 125 },
    { minSalary: 25_001, maxSalary: null, tax: 200 },
  ],

  // Assam
  assam: [
    { minSalary: 0, maxSalary: 10_000, tax: 0 },
    { minSalary: 10_001, maxSalary: 14_999.99, tax: 150 },
    { minSalary: 15_000, maxSalary: 24_999.99, tax: 180 },
    { minSalary: 25_000, maxSalary: null, tax: 208 },
  ],

  // Bihar
  bihar: [
    { minSalary: 0, maxSalary: 25_000, tax: 0 },
    { minSalary: 25_001, maxSalary: 41_666, tax: 100 },
    { minSalary: 41_667, maxSalary: 83_333, tax: 167 },
    { minSalary: 83_334, maxSalary: null, tax: 208 },
  ],

  // Punjab
  punjab: [
    { minSalary: 0, maxSalary: 15_000, tax: 0 },
    { minSalary: 15_001, maxSalary: 20_000, tax: 150 },
    { minSalary: 20_001, maxSalary: null, tax: 200 },
  ],

  // Jharkhand
  jharkhand: [
    { minSalary: 0, maxSalary: 25_000, tax: 0 },
    { minSalary: 25_001, maxSalary: 41_666, tax: 100 },
    { minSalary: 41_667, maxSalary: 66_666, tax: 150 },
    { minSalary: 66_667, maxSalary: null, tax: 200 },
  ],

  // Delhi / UT (no PT)
  delhi: [
    { minSalary: 0, maxSalary: null, tax: 0 },
  ],

  // Haryana (no PT)
  haryana: [
    { minSalary: 0, maxSalary: null, tax: 0 },
  ],

  // Uttar Pradesh (no PT)
  uttar_pradesh: [
    { minSalary: 0, maxSalary: null, tax: 0 },
  ],
};

/** All supported state keys for dropdowns */
export const SUPPORTED_STATES: { key: string; label: string }[] = [
  { key: "default", label: "Default" },
  { key: "andhra_pradesh", label: "Andhra Pradesh" },
  { key: "assam", label: "Assam" },
  { key: "bihar", label: "Bihar" },
  { key: "delhi", label: "Delhi (No PT)" },
  { key: "gujarat", label: "Gujarat" },
  { key: "haryana", label: "Haryana (No PT)" },
  { key: "jharkhand", label: "Jharkhand" },
  { key: "karnataka", label: "Karnataka" },
  { key: "kerala", label: "Kerala" },
  { key: "madhya_pradesh", label: "Madhya Pradesh" },
  { key: "maharashtra", label: "Maharashtra" },
  { key: "odisha", label: "Odisha" },
  { key: "punjab", label: "Punjab" },
  { key: "rajasthan", label: "Rajasthan" },
  { key: "tamil_nadu", label: "Tamil Nadu" },
  { key: "telangana", label: "Telangana" },
  { key: "uttar_pradesh", label: "Uttar Pradesh (No PT)" },
  { key: "west_bengal", label: "West Bengal" },
];

export function calculatePT(totalEarnings: number, state = "default"): number {
  const slabs = STATE_SLABS[state.toLowerCase()] ?? DEFAULT_SLABS;

  for (const slab of slabs) {
    const upper = slab.maxSalary ?? Infinity;
    if (totalEarnings >= slab.minSalary && totalEarnings <= upper) {
      return slab.tax;
    }
  }

  // Fallback: highest slab
  return slabs[slabs.length - 1].tax;
}

// ---------------------------------------------------------------------------
// Old vs New Tax Regime Estimation
// ---------------------------------------------------------------------------
export interface TaxRegimeResult {
  regime: "old" | "new";
  taxable_income: number;
  income_tax: number;
  cess: number;
  total_tax: number;
  effective_rate: number;
}

/** New regime slabs (FY 2024-25 / AY 2025-26) */
function newRegimeTax(taxableIncome: number): number {
  if (taxableIncome <= 300000) return 0;
  let tax = 0;
  const slabs = [
    { limit: 300000, rate: 0 },
    { limit: 700000, rate: 0.05 },
    { limit: 1000000, rate: 0.10 },
    { limit: 1200000, rate: 0.15 },
    { limit: 1500000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 },
  ];
  let prev = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prev) break;
    const taxable = Math.min(taxableIncome, slab.limit) - prev;
    if (taxable > 0) tax += taxable * slab.rate;
    prev = slab.limit;
  }
  // Rebate u/s 87A: If taxable income <= 7,00,000 then no tax
  if (taxableIncome <= 700000) tax = 0;
  return Math.round(tax);
}

/** Old regime slabs (FY 2024-25) */
function oldRegimeTax(taxableIncome: number): number {
  if (taxableIncome <= 250000) return 0;
  let tax = 0;
  const slabs = [
    { limit: 250000, rate: 0 },
    { limit: 500000, rate: 0.05 },
    { limit: 1000000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 },
  ];
  let prev = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prev) break;
    const taxable = Math.min(taxableIncome, slab.limit) - prev;
    if (taxable > 0) tax += taxable * slab.rate;
    prev = slab.limit;
  }
  // Rebate u/s 87A: If taxable income <= 5,00,000 then no tax
  if (taxableIncome <= 500000) tax = 0;
  return Math.round(tax);
}

/**
 * Compare old vs new tax regime.
 * Standard deduction: Rs 75,000 (new) / Rs 50,000 (old).
 * Old regime allows 80C (1.5L), 80D (25K), HRA exemption (simplified).
 */
export function compareTaxRegimes(
  annualCTC: number,
  deductions80C = 150000,
  deductions80D = 25000,
  hraExemption = 0,
): { old_regime: TaxRegimeResult; new_regime: TaxRegimeResult; recommended: "old" | "new"; savings: number } {
  const gross = annualCTC;

  // New regime: only standard deduction of 75,000
  const newTaxable = Math.max(0, gross - 75000);
  const newTax = newRegimeTax(newTaxable);
  const newCess = Math.round(newTax * 0.04);

  // Old regime: standard deduction 50,000 + 80C + 80D + HRA
  const oldDeductions = 50000 + Math.min(deductions80C, 150000) + Math.min(deductions80D, 25000) + hraExemption;
  const oldTaxable = Math.max(0, gross - oldDeductions);
  const oldTax = oldRegimeTax(oldTaxable);
  const oldCess = Math.round(oldTax * 0.04);

  const oldTotal = oldTax + oldCess;
  const newTotal = newTax + newCess;

  return {
    old_regime: {
      regime: "old",
      taxable_income: oldTaxable,
      income_tax: oldTax,
      cess: oldCess,
      total_tax: oldTotal,
      effective_rate: gross > 0 ? Math.round((oldTotal / gross) * 10000) / 100 : 0,
    },
    new_regime: {
      regime: "new",
      taxable_income: newTaxable,
      income_tax: newTax,
      cess: newCess,
      total_tax: newTotal,
      effective_rate: gross > 0 ? Math.round((newTotal / gross) * 10000) / 100 : 0,
    },
    recommended: oldTotal <= newTotal ? "old" : "new",
    savings: Math.abs(oldTotal - newTotal),
  };
}

// ---------------------------------------------------------------------------
// Convenience: get all statutory rates for API response
// ---------------------------------------------------------------------------
export function getStatutoryRates(state = "default") {
  const slabs = STATE_SLABS[state.toLowerCase()] ?? DEFAULT_SLABS;
  return {
    epf: {
      employee_rate: `${DEFAULT_EPF.employeeRate * 100}%`,
      employer_rate: `${DEFAULT_EPF.employerRate * 100}%`,
      wage_ceiling: DEFAULT_EPF.wageCeiling,
      max_monthly_contribution: epfEmployerContribution(DEFAULT_EPF.wageCeiling),
    },
    esi: {
      employee_rate: `${DEFAULT_ESI.employeeRate * 100}%`,
      employer_rate: `${DEFAULT_ESI.employerRate * 100}%`,
      gross_threshold: DEFAULT_ESI.grossThreshold,
    },
    professional_tax: {
      state,
      slabs: slabs.map((s) => ({
        range: s.maxSalary != null
          ? `\u20B9${s.minSalary.toLocaleString("en-IN")} - \u20B9${s.maxSalary.toLocaleString("en-IN")}`
          : `\u2265 \u20B9${s.minSalary.toLocaleString("en-IN")}`,
        tax: `\u20B9${s.tax.toLocaleString("en-IN")}`,
      })),
    },
  };
}
