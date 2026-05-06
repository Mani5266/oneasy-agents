import { NextRequest, NextResponse } from "next/server";
import { renderDeed } from "@/features/llp/lib/deed-template";
import { llpDataSchema } from "@/features/llp/lib/schemas";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/features/llp/lib/rateLimit";
import { createSupabaseServerClient } from "@/features/llp/lib/supabase-server";

export async function POST(req: NextRequest) {
  // ── AUTH CHECK ──
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 60 requests per hour per IP
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const rl = rateLimit(`${clientIp}:renderDeed`, RATE_LIMITS.renderDeed);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await req.json();
    const parsed = llpDataSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json({ html: renderDeed(parsed.data, "preview") });
  } catch {
    return NextResponse.json({ html: "<p>Render error</p>" }, { status: 500 });
  }
}
