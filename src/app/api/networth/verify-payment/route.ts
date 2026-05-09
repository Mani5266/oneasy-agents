import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import crypto from "crypto";
import {
  getClientIdentifier,
  rateLimitResponse,
  checkCsrfOrigin,
  paymentRateLimit,
} from "@/features/networth/lib/ratelimit";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/features/networth/lib/supabase-server";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

export async function POST(request: NextRequest) {
  // CSRF check
  const csrfError = checkCsrfOrigin(request);
  if (csrfError) return csrfError;

  // Rate limiting
  const identifier = await getClientIdentifier(request);
  const rl = await paymentRateLimit.check(identifier);
  if (!rl.success) return rateLimitResponse(rl.reset);

  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  // Verify signature: HMAC-SHA256(order_id|payment_id, secret)
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.error("[verify-payment] Signature mismatch for order:", razorpay_order_id.slice(0, 10));
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // Update payment record
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("payments")
    .update({
      razorpay_payment_id,
      razorpay_signature,
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("razorpay_order_id", razorpay_order_id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[verify-payment] DB update error:", error.message);
    return NextResponse.json({ error: "Payment record update failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
