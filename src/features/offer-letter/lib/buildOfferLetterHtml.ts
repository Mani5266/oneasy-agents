/**
 * Builds a standalone HTML offer letter for Puppeteer PDF generation.
 * Mirrors the DOCX structure: Offer Letter + Annexure A (salary table).
 */

import type { OfferPayload, SalaryBreakdownRow } from "../types";

// Reuse the same logic as docGenerator/numberUtils
function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(n));
}

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function toWords(n: number): string {
  n = Math.round(n);
  if (n === 0) return "Zero";
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + toWords(n % 100) : "");
  if (n < 100000) return toWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + toWords(n % 1000) : "");
  if (n < 10000000) return toWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + toWords(n % 100000) : "");
  return toWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + toWords(n % 10000000) : "");
}

const SP = { BASIC: 0.40, HRA: 0.20, CONVEYANCE: 0.03, MEDICAL: 0.02, CHILDREN_EDU: 0.02, CHILDREN_HOST: 0.01, SPECIAL: 0.10, LTA: 0.05, EMPLOYER_PF_OF_BASIC: 0.12 };

function buildBreakdown(ctc: number): SalaryBreakdownRow[] {
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
    { label: "Basic Pay", monthly: basic, annual: basic * 12, type: "earn" },
    { label: "House Rent Allowance (HRA)", monthly: hra, annual: hra * 12, type: "earn" },
    { label: "Conveyance Allowance", monthly: convey, annual: convey * 12, type: "earn" },
    { label: "Medical Allowance", monthly: medical, annual: medical * 12, type: "earn" },
    { label: "Children Education", monthly: childEdu, annual: childEdu * 12, type: "earn" },
    { label: "Children Hostel Allowance", monthly: childHost, annual: childHost * 12, type: "earn" },
    { label: "Special Allowance", monthly: special, annual: special * 12, type: "earn" },
    { label: "Leave Travel Allowance", monthly: lta, annual: lta * 12, type: "earn" },
    { label: "Differential Allowance", monthly: diff, annual: diffAnnual, type: "earn" },
    { label: "Employer's contribution to PF", monthly: empPF, annual: empPF * 12, type: "earn" },
    { label: "Total Salary (in Rs.)", monthly: totalM, annual: ctc, type: "total" },
  ];
}

function formatDate(isoStr: string): string {
  if (!isoStr) return "________________";
  const d = new Date(isoStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function formatTime(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  const ampm = hr >= 12 ? "PM" : "AM";
  const hr12 = hr % 12 || 12;
  return `${hr12}:${m} ${ampm}`;
}

function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildOfferLetterHtml(d: OfferPayload): string {
  const ctc = parseInt(String(d.annualCTC)) || 0;
  const ctcWords = toWords(ctc);
  const breakdown = buildBreakdown(ctc);
  const firstName = (d.empFullName || "").split(" ")[0];
  const salute = d.salutation || "Mr.";
  const orgName = d.orgName || "";
  const workDays = `${d.workDayFrom || "Monday"} to ${d.workDayTo || "Saturday"}`;
  const workTime = `${formatTime(d.workStart) || "10:30 AM"} to ${formatTime(d.workEnd) || "7:30 PM"} IST`;
  const year = new Date().getFullYear();

  const salaryRows = breakdown.map(r => {
    const cls = r.type === "total" ? ' style="font-weight:bold; background:#f9f9f9;"' : "";
    return `<tr${cls}><td style="border:1px solid #000;padding:5pt 8pt;">${esc(r.label)}</td><td style="border:1px solid #000;padding:5pt 8pt;text-align:right;">${formatINR(r.monthly)}</td><td style="border:1px solid #000;padding:5pt 8pt;text-align:right;">${formatINR(r.annual)}</td></tr>`;
  }).join("\n");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@page { size: A4; margin: 0.5in 0 0 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
.offer-doc {
  padding: 0 18mm 12mm 18mm;
  font-family: "Calibri", "Segoe UI", sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #000;
}
.offer-doc h1 {
  text-align: center;
  font-size: 14pt;
  font-weight: bold;
  text-decoration: underline;
  margin: 0.5em 0 1em;
}
.offer-doc h2 {
  text-align: center;
  font-size: 12pt;
  font-weight: bold;
  margin: 0 0 1em;
}
.offer-doc p { margin: 0.4em 0; text-align: justify; }
.offer-doc .clause { margin: 1em 0 0.3em; font-weight: bold; }
.offer-doc .indent { margin-left: 2em; }
.offer-doc table { width: 100%; border-collapse: collapse; margin: 1em 0; page-break-inside: auto; }
.offer-doc th { border: 1px solid #000; padding: 5pt 8pt; font-weight: bold; background: #f0f0f0; text-align: left; }
.offer-doc td { border: 1px solid #000; padding: 5pt 8pt; }
.offer-doc tr { page-break-inside: avoid; }
.offer-doc thead { display: table-header-group; }
.page-break { page-break-before: always; }
.sig-block { margin-top: 2em; page-break-inside: avoid; }
</style>
</head>
<body>
<div class="offer-doc">

<h1>OFFER LETTER</h1>

<p><strong>Ref No.:</strong> OE/HR/OL/[Serial No.]/${year}</p>
<p><strong>Date:</strong> ${formatDate(d.offerDate)}</p>

<p style="margin-top:1.5em;">To,</p>
<p><strong>${esc(d.empFullName)}</strong></p>
<p>${esc(d.empAddress || "")}</p>

<p style="margin-top:1.5em;"><strong>Subject:</strong> Offer of Employment as ${esc(d.designation)}</p>

<p style="margin-top:1.5em;">Dear ${esc(salute)} ${esc(firstName)},</p>

<p class="clause">1. Offer of Employment</p>
<p class="indent">On behalf of <strong>${esc(orgName)}</strong> (hereinafter referred to as the "Company"), we are pleased to offer you the position of <strong>${esc(d.designation)}</strong> in our organization. This offer is made based on your qualifications, experience, and the favorable impression you have made during the selection process.</p>

<p class="clause">2. Compensation</p>
<p class="indent">Your annual compensation will be <strong>INR ${formatINR(ctc)}</strong> (${ctcWords} Only). The detailed breakdown of your compensation structure is provided in <strong>Annexure A</strong> attached herewith.</p>

<p class="clause">3. Date of Joining</p>
<p class="indent">Your proposed date of joining is <strong>${formatDate(d.joiningDate)}</strong>. Please report to our office at ${esc(d.officeAddress || "[Office Address]")} by <strong>10:30 AM</strong> on the said date.</p>

<p class="clause">4. Working Hours</p>
<p class="indent">Your working days will be <strong>${esc(workDays)}</strong> from <strong>${esc(workTime)}</strong>, with a break of <strong>${esc(d.breakDuration || "1 (one) hour")}</strong> which includes the lunch break.</p>

<p class="clause">5. Validity of Offer</p>
<p class="indent">This offer is valid until <strong>${formatDate(d.offerValidity)}</strong>. If we do not receive your acceptance by this date, the offer shall stand automatically withdrawn.</p>

<p class="clause">6. Conditions Precedent</p>
<p class="indent">This offer is contingent upon:</p>
<p class="indent" style="margin-left:3em;">1. Satisfactory verification of your credentials, references, and background.</p>
<p class="indent" style="margin-left:3em;">2. Submission of all required documents as listed in the joining formalities.</p>
<p class="indent" style="margin-left:3em;">3. Your acceptance of the terms and conditions outlined in the Appointment Letter and its annexures.</p>

<p class="clause">7. Documents Required at Joining</p>
<p class="indent">Please bring the following documents on your date of joining:</p>
<p class="indent" style="margin-left:3em;">1. Original and photocopies of all educational certificates and mark sheets.</p>
<p class="indent" style="margin-left:3em;">2. Experience certificates and relieving letters from previous employers.</p>
<p class="indent" style="margin-left:3em;">3. Copy of PAN Card and Aadhaar Card.</p>
<p class="indent" style="margin-left:3em;">4. Two passport-size photographs.</p>
<p class="indent" style="margin-left:3em;">5. Bank account details (cancelled cheque or bank statement).</p>
<p class="indent" style="margin-left:3em;">6. Address proof (Aadhaar / Passport / Utility Bill).</p>

<p class="clause">8. Acceptance</p>
<p class="indent">Please sign and return the duplicate copy of this Offer Letter as a token of your acceptance. Upon joining, you will be issued a formal Appointment Letter containing detailed terms and conditions of your employment.</p>

<p style="margin-top:1.5em;">We are confident that you will significantly contribute to our team's success and look forward to a mutually rewarding professional relationship.</p>
<p>If you have any questions, please do not hesitate to contact us.</p>

<div class="sig-block">
<p>Yours sincerely,</p>
<br>
<p><strong>For ${esc(orgName)}</strong></p>
<br>
<p>________________________________</p>
<p><strong>${esc(d.signatoryName || "")}</strong></p>
<p>${esc(d.signatoryDesig || "")}</p>
</div>

<div class="sig-block" style="margin-top:3em;">
<p style="text-align:center;"><strong><u>ACCEPTANCE BY CANDIDATE</u></strong></p>
<p style="margin-top:1em;">I, <strong>${esc(d.empFullName)}</strong>, hereby accept the offer of employment as <strong>${esc(d.designation)}</strong> at ${esc(orgName)} on the terms and conditions mentioned above. I confirm that I will join on <strong>${formatDate(d.joiningDate)}</strong> and will submit all required documents on the date of joining.</p>

<table style="border:none; margin-top:2em;">
<tr style="border:none;">
<td style="border:none; width:50%; vertical-align:top; padding:0;">
<p>Signature: ________________________________</p>
<br>
<p>Name: ${esc(d.empFullName)}</p>
</td>
<td style="border:none; width:50%; vertical-align:top; padding:0;">
<p>Date: ________________________________</p>
<br>
<p>Place: ________________________________</p>
</td>
</tr>
</table>
</div>

<!-- ANNEXURE A -->
<div class="page-break"></div>

<h1>ANNEXURE A</h1>
<h2>COMPENSATION STRUCTURE</h2>

<p><strong>Employee Name:</strong> ${esc(d.empFullName)} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Designation:</strong> ${esc(d.designation)}</p>
<p><strong>Date of Joining:</strong> ${formatDate(d.joiningDate)} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Annual CTC:</strong> INR ${formatINR(ctc)} (${ctcWords} Only)</p>

<table>
<thead>
<tr><th>Particulars</th><th style="text-align:right; width:120px;">Monthly (Rs.)</th><th style="text-align:right; width:120px;">Annual (Rs.)</th></tr>
</thead>
<tbody>
${salaryRows}
</tbody>
</table>

<p style="margin-top:1.5em;"><strong>Notes:</strong></p>
<p class="indent">• The above salary structure is subject to applicable statutory deductions.</p>
<p class="indent">• Any revisions to the salary structure will be communicated in writing.</p>
<p class="indent">• This annexure forms an integral part of the Appointment Letter.</p>

<div class="sig-block" style="margin-top:3em;">
<table style="border:none;">
<tr style="border:none;">
<td style="border:none; width:50%; vertical-align:top; padding:0;">
<p>Employee Signature: ________________________________</p>
<br>
<p>Date: ________________________________</p>
</td>
<td style="border:none; width:50%; vertical-align:top; padding:0;">
<p>For ${esc(orgName)}</p>
<br>
<p>Authorized Signatory</p>
</td>
</tr>
</table>
</div>

</div>
</body>
</html>`;

  return html;
}
