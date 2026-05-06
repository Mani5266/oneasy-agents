import { NextResponse } from "next/server";
import { calculateSalary, breakdownToResponse } from "@/features/salary/lib/engine/salary-calculator";
import { saveCalculation } from "@/features/salary/lib/services/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { annual_ctc, state = "default" } = body;

    if (!annual_ctc || annual_ctc <= 0) {
      return NextResponse.json(
        { detail: "Annual CTC must be a positive number" },
        { status: 400 },
      );
    }

    const result = calculateSalary(annual_ctc, state);

    // Persist to Supabase (fire-and-forget)
    saveCalculation(result, "standard").catch(() => {});

    return NextResponse.json(breakdownToResponse(result));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Calculation failed";
    return NextResponse.json({ detail: msg }, { status: 400 });
  }
}
