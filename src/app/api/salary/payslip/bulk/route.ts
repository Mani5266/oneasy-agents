import { NextResponse } from "next/server";
import { calculateSalary, breakdownToResponse } from "@/features/salary/lib/engine/salary-calculator";
import { generatePayslipHTML } from "@/features/salary/lib/engine/payslip-generator";
import { requireAuth } from "@/lib/api-auth";

export async function POST(request: Request) {
  const { user, error: authError } = await requireAuth();
  if (!user) return authError;

  try {
    const body = await request.json();
    const { company_name, month, company_logo, employees } = body;

    if (!company_name || !month || !employees || !Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json(
        { detail: "company_name, month, and a non-empty employees array are required" },
        { status: 400 },
      );
    }

    const results: { employee_name: string; payslip_html: string; salary_breakdown?: ReturnType<typeof breakdownToResponse>; status: string; error?: string }[] = [];
    let success = 0;
    let failed = 0;

    for (const emp of employees) {
      try {
        if (!emp.name || !emp.annual_ctc || emp.annual_ctc <= 0) {
          throw new Error("Name and positive annual_ctc are required");
        }

        const breakdown = calculateSalary(emp.annual_ctc, emp.state || "default");
        const html = generatePayslipHTML({
          companyName: company_name,
          employeeName: emp.name,
          employeeCode: emp.employee_code || "",
          gender: emp.gender || "",
          designation: emp.designation || "",
          dateOfJoining: emp.date_of_joining || "",
          month,
          standardDays: 30,
          daysWorked: 30,
          breakdown,
          companyLogo: company_logo,
        });

        results.push({
          employee_name: emp.name,
          payslip_html: html,
          salary_breakdown: breakdownToResponse(breakdown),
          status: "success",
        });
        success++;
      } catch (err: unknown) {
        failed++;
        results.push({
          employee_name: emp.name || "Unknown",
          payslip_html: "",
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      results,
      total: employees.length,
      success,
      failed,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bulk payslip generation failed";
    return NextResponse.json({ detail: msg }, { status: 400 });
  }
}
