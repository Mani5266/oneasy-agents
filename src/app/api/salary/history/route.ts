import { NextResponse } from "next/server";
import { getRecentCalculations } from "@/features/salary/lib/services/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const calculations = await getRecentCalculations(limit);

    return NextResponse.json(calculations);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch history";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
}
