import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/api-auth";
import { createSupabaseAdminClient } from "@/features/networth/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const agent = request.nextUrl.searchParams.get("agent");
  const documentId = request.nextUrl.searchParams.get("documentId");

  if (!agent || !documentId) {
    return NextResponse.json({ error: "agent and documentId required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id")
    .eq("agent", agent)
    .eq("document_id", documentId)
    .eq("user_id", user!.id)
    .eq("status", "paid")
    .maybeSingle();

  return NextResponse.json({ paid: !!payment });
}
