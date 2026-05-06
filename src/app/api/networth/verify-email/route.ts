import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { createSupabaseServerClient } from "@/features/networth/lib/supabase-server";
import { createLimiter, getClientIdentifier } from "@/features/networth/lib/ratelimit";

const verifyEmailLimit = createLimiter("verify-email", { requests: 15, window: "1 h" });

// ─── GET /api/networth/verify-email/callback ──────────────────────────────────
// Supabase redirects here after the user clicks the verification link.
// The URL contains token_hash and type params from Supabase's /auth/v1/verify.
// We also support the legacy ?token= param for backward compatibility.
//
// With Supabase's generateLink(), the flow is:
// 1. User clicks link → Supabase /auth/v1/verify?token_hash=...&type=signup&redirect_to=...
// 2. Supabase verifies the token, confirms the email, and redirects here
// 3. We redirect to /login?verified=true

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Rate limit
  const ipId = getClientIdentifier(req);
  const rl = await verifyEmailLimit.check(ipId);
  if (!rl.success) {
    return NextResponse.redirect(new URL("/login?error=ratelimit", appUrl));
  }

  try {
    // Supabase passes code param after verification for PKCE flow
    const code = req.nextUrl.searchParams.get("code");

    if (code) {
      // Exchange the code for a session (this confirms the email in Supabase)
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[VERIFY_EMAIL] Code exchange failed", { error: error.message });
        return NextResponse.redirect(new URL("/login?error=expired", appUrl));
      }

      console.log("[VERIFY_EMAIL] Email verified via code exchange");
      return NextResponse.redirect(new URL("/login?verified=true", appUrl));
    }

    // If no code, the email was already confirmed by Supabase's /auth/v1/verify
    // Just redirect to login with success
    console.log("[VERIFY_EMAIL] Redirect callback (no code — already verified)");
    return NextResponse.redirect(new URL("/login?verified=true", appUrl));
  } catch (err) {
    console.error("[VERIFY_EMAIL] Unexpected error", {
      error: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.redirect(new URL("/login?error=expired", appUrl));
  }
}
