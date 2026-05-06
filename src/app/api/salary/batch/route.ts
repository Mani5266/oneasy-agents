import { NextResponse } from "next/server";
import { calculateSalary, breakdownToResponse } from "@/features/salary/lib/engine/salary-calculator";
import { saveCalculation } from "@/features/salary/lib/services/database";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const month = (formData.get("month") as string) || "April 2025";
    const state = (formData.get("state") as string) || "default";

    if (!file) {
      return NextResponse.json({ detail: "File is required" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx")) {
      return NextResponse.json(
        { detail: "File must be CSV or XLSX" },
        { status: 400 },
      );
    }

    const content = await file.text();

    // Parse CSV (XLSX parsing would require a library like xlsx)
    if (!fileName.endsWith(".csv")) {
      return NextResponse.json(
        { detail: "Only CSV is currently supported for batch processing" },
        { status: 400 },
      );
    }

    const lines = content.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json(
        { detail: "CSV must have a header row and at least one data row" },
        { status: 400 },
      );
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = headers.findIndex((h) => h === "name");
    const ctcIdx = headers.findIndex(
      (h) => h === "annual_ctc" || h === "annual ctc",
    );

    if (nameIdx === -1 || ctcIdx === -1) {
      return NextResponse.json(
        { detail: "CSV must have 'name' and 'annual_ctc' columns" },
        { status: 400 },
      );
    }

    interface BatchResultItem {
      employee_name: string;
      annual_ctc: number;
      net_salary_monthly: number;
      esi_eligible: boolean;
      status: string;
      error?: string;
    }

    const results: BatchResultItem[] = [];
    let totalWages = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let failed = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const name = cols[nameIdx] || "Unknown";
      try {
        const ctc = parseFloat(cols[ctcIdx]);
        if (!ctc || ctc <= 0) throw new Error("CTC must be positive");

        const breakdown = calculateSalary(ctc, state);
        results.push({
          employee_name: name,
          annual_ctc: ctc,
          net_salary_monthly: breakdown.net_salary_monthly,
          esi_eligible: breakdown.esi_eligible,
          status: "success",
        });

        // Fire-and-forget persistence
        saveCalculation(breakdown, "batch", name).catch(() => {});

        const e = breakdown.earnings;
        totalWages += e.basic + e.hra + e.conveyance + e.medical +
          e.children_education + e.children_hostel +
          e.special_allowance + e.lta + e.differential_allowance;
        const d = breakdown.deductions;
        totalDeductions += d.employee_epf + d.employee_esi + d.professional_tax;
        totalNet += breakdown.net_salary_monthly;
      } catch (err: unknown) {
        failed++;
        results.push({
          employee_name: name,
          annual_ctc: 0,
          net_salary_monthly: 0,
          esi_eligible: false,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      total_employees: results.length,
      processed: results.length - failed,
      failed,
      results,
      total_wages: Math.round(totalWages * 100) / 100,
      total_deductions: Math.round(totalDeductions * 100) / 100,
      total_net_pay: Math.round(totalNet * 100) / 100,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Batch processing failed";
    return NextResponse.json({ detail: msg }, { status: 400 });
  }
}
