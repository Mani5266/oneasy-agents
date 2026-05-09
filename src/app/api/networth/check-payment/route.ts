import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/features/networth/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const certificateId = request.nextUrl.searchParams.get("certificateId");
  if (!certificateId) {
    return NextResponse.json({ error: "certificateId required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id")
    .eq("agent", "networth")
    .eq("document_id", certificateId)
    .eq("user_id", user.id)
    .eq("status", "paid")
    .maybeSingle();

  return NextResponse.json({ paid: !!payment });
}
