import { NextResponse } from "next/server";
import { getRecentCalculations } from "@/features/salary/lib/services/database";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: Request) {
  const { user, error: authError } = await requireAuth();
  if (!user) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const calculations = await getRecentCalculations(limit);

    return NextResponse.json(calculations);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch history";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
}
