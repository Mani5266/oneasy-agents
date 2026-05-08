import { NextResponse } from "next/server";
import { getStatutoryRates } from "@/features/salary/lib/engine/statutory";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: Request) {
  const { user, error: authError } = await requireAuth();
  if (!user) return authError;

  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state") || "default";
  return NextResponse.json(getStatutoryRates(state));
}
