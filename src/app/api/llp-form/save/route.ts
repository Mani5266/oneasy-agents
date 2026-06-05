import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  const { id, data } = await req.json();

  if (id) {
    // Update existing
    const { error } = await supabaseAdmin
      .from("llp_agreements")
      .update({
        form_data: data,
        llp_name: data.llpName || null,
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id });
  } else {
    // Create new
    const { data: row, error } = await supabaseAdmin
      .from("llp_agreements")
      .insert({
        user_id: userId,
        form_data: data,
        llp_name: data.llpName || "Untitled LLP",
        status: "draft",
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: row.id });
  }
}
