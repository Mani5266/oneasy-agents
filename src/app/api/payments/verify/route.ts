import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import crypto from "crypto";

import { requireAuth } from "@/lib/api-auth";
import { createSupabaseAdminClient } from "@/features/networth/lib/supabase-server";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

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

  // Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.error("[verify] Signature mismatch for order:", razorpay_order_id.slice(0, 10));
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
    .eq("user_id", user!.id);

  if (error) {
    console.error("[verify] DB update error:", error.message);
    return NextResponse.json({ error: "Payment record update failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
