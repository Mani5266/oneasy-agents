/**
 * Payslip Generator - HTML payslip matching the XLSX Payslip template.
 * Pro-rates earnings & deductions when days_worked < standard_days.
 */

import {
  type SalaryBreakdown,
} from "./salary-calculator";
import {
  epfEmployeeContribution,
  esiEmployeeContribution,
  calculatePT,
} from "./statutory";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Format number in Indian currency style. */
function fmt(value: number): string {
  if (value === 0) return "0.00";
  const negative = value < 0;
  const abs = Math.abs(value);
  const integerPart = Math.floor(abs);
  const decimalPart = (abs - integerPart).toFixed(2).slice(1); // ".XX"

  const s = integerPart.toString();
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

  const result = formatted + decimalPart;
  return negative ? `-${result}` : result;
}

/** Convert number to Indian English words (simplified). */
function numberToWords(n: number): string {
  if (n === 0) return "Zero Rupees Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
    "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function twoDigit(num: number): string {
    if (num < 20) return ones[num];
    return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
  }

  function threeDigit(num: number): string {
    if (num >= 100) {
      return ones[Math.floor(num / 100)] + " Hundred" +
        (num % 100 ? " and " + twoDigit(num % 100) : "");
    }
    return twoDigit(num);
  }

  let intPart = Math.floor(Math.abs(n));
  const paise = Math.round((Math.abs(n) - intPart) * 100);

  let result: string;
  if (intPart === 0) {
    result = "Zero";
  } else {
    const parts: string[] = [];
    if (intPart >= 10000000) {
      parts.push(twoDigit(Math.floor(intPart / 10000000)) + " Crore");
      intPart %= 10000000;
    }
    if (intPart >= 100000) {
      parts.push(twoDigit(Math.floor(intPart / 100000)) + " Lakh");
      intPart %= 100000;
    }
    if (intPart >= 1000) {
      parts.push(twoDigit(Math.floor(intPart / 1000)) + " Thousand");
      intPart %= 1000;
    }
    if (intPart > 0) {
      parts.push(threeDigit(intPart));
    }
    result = parts.join(" ");
  }

  result += " Rupees";
  if (paise > 0) {
    result += " and " + twoDigit(paise) + " Paise";
  }
  result += " Only";
  return result;
}

// ---------------------------------------------------------------------------
// Generate HTML Payslip
// ---------------------------------------------------------------------------
export function generatePayslipHTML(params: {
  companyName: string;
  employeeName: string;
  employeeCode: string;
  gender: string;
  designation: string;
  dateOfJoining: string;
  month: string;
  standardDays: number;
  daysWorked: number;
  breakdown: SalaryBreakdown;
  companyLogo?: string;
}): string {
  const {
    companyName, employeeName, employeeCode, gender,
    designation, dateOfJoining, month, standardDays,
    daysWorked, breakdown, companyLogo,
  } = params;

  const e = breakdown.earnings;

  // Pro-rata factor
  const ratio = standardDays > 0 && daysWorked < standardDays
    ? daysWorked / standardDays
    : 1.0;

  // Pro-rate all earnings
  const basicPr = round2(e.basic * ratio);
  const hraPr = round2(e.hra * ratio);
  const conveyancePr = round2(e.conveyance * ratio);
  const medicalPr = round2(e.medical * ratio);
  const childrenEduPr = round2(e.children_education * ratio);
  const childrenHostelPr = round2(e.children_hostel * ratio);
  const specialPr = round2(e.special_allowance * ratio);
  const ltaPr = round2(e.lta * ratio);
  const differentialPr = round2(e.differential_allowance * ratio);

  const earningsRows: [string, number][] = [
    ["Basic Pay", basicPr],
    ["House Rent Allowance (HRA)", hraPr],
    ["Conveyance Allowance", conveyancePr],
    ["Medical Allowance", medicalPr],
    ["Children Education", childrenEduPr],
    ["Children Hostel Allowance", childrenHostelPr],
    ["Special Allowance", specialPr],
    ["Leave Travel Allowance", ltaPr],
    ["Differential Allowance", differentialPr],
  ];

  const totalEarningsPr = round2(earningsRows.reduce((sum, [, amt]) => sum + amt, 0));

  // Recalculate deductions on pro-rated amounts
  const epfPr = epfEmployeeContribution(basicPr);
  const esiWage = round2(breakdown.monthly_ctc * ratio);
  const esiPr = esiEmployeeContribution(esiWage);
  const ptPr = calculatePT(totalEarningsPr, breakdown.state);

  const deductionsRows: [string, number][] = [
    ["EPF", epfPr],
    ["ESI", esiPr],
    ["Professional Tax", ptPr],
  ];

  const totalDeductionsPr = round2(deductionsRows.reduce((sum, [, amt]) => sum + amt, 0));

  // Build earnings HTML rows
  let earningsHtml = "";
  for (const [label, amount] of earningsRows) {
    earningsHtml += `
            <tr>
                <td class="label">${label}</td>
                <td class="amount">${fmt(amount)}</td>
            </tr>`;
  }

  // Build deductions HTML rows
  let deductionsHtml = "";
  for (const [label, amount] of deductionsRows) {
    deductionsHtml += `
            <tr>
                <td class="label">${label}</td>
                <td class="amount">${fmt(amount)}</td>
            </tr>`;
  }

  // Pad deductions with empty rows
  for (let i = 0; i < earningsRows.length - deductionsRows.length; i++) {
    deductionsHtml += `
            <tr>
                <td class="label">&nbsp;</td>
                <td class="amount">&nbsp;</td>
            </tr>`;
  }

  const netSalary = round2(totalEarningsPr - totalDeductionsPr);
  const netInWords = numberToWords(netSalary);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payslip - ${employeeName} - ${month}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
        .payslip { max-width: 800px; margin: 0 auto; background: white; border: 2px solid #1a365d; border-radius: 4px; overflow: hidden; }
        .header { background: #1a365d; color: white; padding: 20px 30px; text-align: center; }
        .header h1 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
        .header h2 { font-size: 14px; font-weight: 400; opacity: 0.9; }
        .employee-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 40px; padding: 16px 30px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .employee-info .field { display: flex; justify-content: space-between; }
        .employee-info .field-label { font-weight: 600; color: #475569; }
        .employee-info .field-value { color: #1e293b; }
        .salary-table { display: grid; grid-template-columns: 1fr 1fr; padding: 0 30px; }
        .salary-section { padding: 16px 0; }
        .salary-section:first-child { border-right: 1px solid #e2e8f0; padding-right: 20px; }
        .salary-section:last-child { padding-left: 20px; }
        .section-title { font-size: 14px; font-weight: 700; color: #1a365d; padding-bottom: 8px; border-bottom: 2px solid #1a365d; margin-bottom: 8px; }
        .salary-section table { width: 100%; font-size: 12px; }
        .salary-section table td { padding: 5px 0; }
        .salary-section table .label { color: #475569; }
        .salary-section table .amount { text-align: right; font-family: 'Consolas', 'Courier New', monospace; color: #1e293b; }
        .totals-row { display: grid; grid-template-columns: 1fr 1fr; padding: 0 30px; border-top: 2px solid #1a365d; background: #f0f4ff; }
        .totals-row .total-item { display: flex; justify-content: space-between; padding: 12px 0; font-weight: 700; font-size: 13px; color: #1a365d; }
        .totals-row .total-item:first-child { border-right: 1px solid #e2e8f0; padding-right: 20px; }
        .totals-row .total-item:last-child { padding-left: 20px; }
        .net-salary { padding: 16px 30px; background: #1a365d; color: white; display: flex; justify-content: space-between; align-items: center; }
        .net-salary .net-label { font-size: 16px; font-weight: 700; }
        .net-salary .net-amount { font-size: 22px; font-weight: 700; font-family: 'Consolas', 'Courier New', monospace; }
        .net-words { padding: 8px 30px; font-size: 11px; color: #64748b; font-style: italic; border-top: 1px solid #e2e8f0; }
        @media print { @page { margin: 0; } body { background: white; padding: 0; } .payslip { border: 1px solid #ccc; } }
    </style>
</head>
<body>
    <div class="payslip">
        <div class="header">
            ${companyLogo ? `<img src="${companyLogo}" alt="Company Logo" style="max-height:40px;margin-bottom:8px;" />` : ""}
            <h1>${companyName}</h1>
            <h2>Pay Slip for the month of ${month}</h2>
        </div>

        <div class="employee-info">
            <div class="field"><span class="field-label">Employee Code:</span><span class="field-value">${employeeCode}</span></div>
            <div class="field"><span class="field-label">Date Of Joining:</span><span class="field-value">${dateOfJoining}</span></div>
            <div class="field"><span class="field-label">Name:</span><span class="field-value">${employeeName}</span></div>
            <div class="field"><span class="field-label">Standard Days:</span><span class="field-value">${standardDays}</span></div>
            <div class="field"><span class="field-label">Gender:</span><span class="field-value">${gender}</span></div>
            <div class="field"><span class="field-label">Days Worked:</span><span class="field-value">${daysWorked}</span></div>
            <div class="field"><span class="field-label">Designation:</span><span class="field-value">${designation}</span></div>
            <div class="field"><span class="field-label">&nbsp;</span><span class="field-value">&nbsp;</span></div>
        </div>

        <div class="salary-table">
            <div class="salary-section">
                <div class="section-title">Earnings</div>
                <table>${earningsHtml}
                </table>
            </div>
            <div class="salary-section">
                <div class="section-title">Deductions</div>
                <table>${deductionsHtml}
                </table>
            </div>
        </div>

        <div class="totals-row">
            <div class="total-item"><span>Total Earnings</span><span>${fmt(totalEarningsPr)}</span></div>
            <div class="total-item"><span>Total Deductions</span><span>${fmt(totalDeductionsPr)}</span></div>
        </div>

        <div class="net-salary">
            <span class="net-label">Net Salary</span>
            <span class="net-amount">${fmt(netSalary)}</span>
        </div>

        <div class="net-words">Net Salary in words: ${netInWords}</div>
    </div>
</body>
</html>`;
}
