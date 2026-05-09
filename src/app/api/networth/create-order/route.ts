import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import {
  getClientIdentifier,
  rateLimitResponse,
  checkCsrfOrigin,
  paymentRateLimit,
} from "@/features/networth/lib/ratelimit";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/features/networth/lib/supabase-server";

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const AMOUNT_PAISE = 19900; // Rs 199

export async function POST(request: NextRequest) {
  // CSRF check
  const csrfError = checkCsrfOrigin(request);
  if (csrfError) return csrfError;

  // Rate limiting (reuse generate limiter — 10/hr)
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
  let body: { certificateId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.certificateId) {
    return NextResponse.json({ error: "certificateId required" }, { status: 400 });
  }

  // Check if already paid
  const admin = createSupabaseAdminClient();
  const { data: existingPayment } = await admin
    .from("payments")
    .select("id")
    .eq("agent", "networth")
    .eq("document_id", body.certificateId)
    .eq("user_id", user.id)
    .eq("status", "paid")
    .maybeSingle();

  if (existingPayment) {
    return NextResponse.json({ alreadyPaid: true });
  }

  // Create Razorpay order
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

  const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: AMOUNT_PAISE,
      currency: "INR",
      receipt: `cert_${body.certificateId.slice(0, 8)}`,
      notes: {
        certificate_id: body.certificateId,
        user_id: user.id,
      },
    }),
  });

  if (!orderRes.ok) {
    const errText = await orderRes.text();
    console.error("[create-order] Razorpay error:", orderRes.status, errText.length, "chars");
    return NextResponse.json({ error: "Payment gateway error" }, { status: 502 });
  }

  const order = await orderRes.json();

  // Insert payment record
  await Promise.resolve(
    admin.from("payments").insert({
      user_id: user.id,
      agent: "networth",
      document_id: body.certificateId,
      razorpay_order_id: order.id,
      amount: AMOUNT_PAISE,
      currency: "INR",
      status: "created",
    })
  );

  return NextResponse.json({
    orderId: order.id,
    amount: AMOUNT_PAISE,
    currency: "INR",
    keyId: RAZORPAY_KEY_ID,
  });
}
