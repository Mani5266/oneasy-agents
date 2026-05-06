import { NextResponse } from "next/server";
import { getStatutoryRates } from "@/features/salary/lib/engine/statutory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state") || "default";
  return NextResponse.json(getStatutoryRates(state));
}
