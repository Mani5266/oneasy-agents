import { NextResponse } from "next/server";
import { compareTaxRegimes } from "@/features/salary/lib/engine/statutory";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      annual_ctc,
      deductions_80c = 150000,
      deductions_80d = 25000,
      hra_exemption = 0,
    } = body;

    if (!annual_ctc || annual_ctc <= 0) {
      return NextResponse.json(
        { detail: "annual_ctc must be a positive number" },
        { status: 400 },
      );
    }

    const result = compareTaxRegimes(annual_ctc, deductions_80c, deductions_80d, hra_exemption);

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Tax comparison failed";
    return NextResponse.json({ detail: msg }, { status: 400 });
  }
}
