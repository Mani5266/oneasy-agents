import { NextResponse } from "next/server";
import { calculateSalary, breakdownToResponse } from "@/features/salary/lib/engine/salary-calculator";
import { generatePayslipHTML } from "@/features/salary/lib/engine/payslip-generator";
import { saveCalculation } from "@/features/salary/lib/services/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_name,
      employee_name,
      employee_code = "",
      gender = "",
      designation = "",
      date_of_joining = "",
      annual_ctc,
      month,
      standard_days = 30,
      days_worked = 30,
      state = "default",
      company_logo,
    } = body;

    if (!company_name || !employee_name || !annual_ctc || !month) {
      return NextResponse.json(
        { detail: "company_name, employee_name, annual_ctc, and month are required" },
        { status: 400 },
      );
    }

    if (annual_ctc <= 0) {
      return NextResponse.json(
        { detail: "Annual CTC must be a positive number" },
        { status: 400 },
      );
    }

    const breakdown = calculateSalary(annual_ctc, state);
    const breakdownResponse = breakdownToResponse(breakdown);

    // Persist to Supabase (fire-and-forget)
    saveCalculation(breakdown, "payslip", employee_name).catch(() => {});

    const html = generatePayslipHTML({
      companyName: company_name,
      employeeName: employee_name,
      employeeCode: employee_code,
      gender,
      designation,
      dateOfJoining: date_of_joining,
      month,
      standardDays: standard_days,
      daysWorked: days_worked,
      breakdown,
      companyLogo: company_logo,
    });

    return NextResponse.json({
      employee_name,
      month,
      salary_breakdown: breakdownResponse,
      payslip_html: html,
      pdf_url: null, // PDF generation skipped (no xhtml2pdf in Node.js)
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Payslip generation failed";
    return NextResponse.json({ detail: msg }, { status: 400 });
  }
}
