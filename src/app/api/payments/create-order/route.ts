import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/api-auth";
import { createSupabaseAdminClient } from "@/features/networth/lib/supabase-server";

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const AMOUNT_PAISE = 19900; // Rs 199

const VALID_AGENTS = ["networth", "llp", "partnership", "offerletter"] as const;
type Agent = (typeof VALID_AGENTS)[number];

const AGENT_LABELS: Record<Agent, string> = {
  networth: "Net Worth Certificate",
  llp: "LLP Agreement",
  partnership: "Partnership Deed",
  offerletter: "Offer Letter",
};

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  let body: { agent: string; documentId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { agent, documentId } = body;
  if (!agent || !documentId) {
    return NextResponse.json({ error: "agent and documentId required" }, { status: 400 });
  }
  if (!VALID_AGENTS.includes(agent as Agent)) {
    return NextResponse.json({ error: "Invalid agent" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Check if already paid
  const { data: existingPayment } = await admin
    .from("payments")
    .select("id")
    .eq("agent", agent)
    .eq("document_id", documentId)
    .eq("user_id", user!.id)
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
      receipt: `${agent}_${documentId.slice(0, 8)}`,
      notes: {
        agent,
        document_id: documentId,
        user_id: user!.id,
      },
    }),
  });

  if (!orderRes.ok) {
    console.error("[create-order] Razorpay error:", orderRes.status);
    return NextResponse.json({ error: "Payment gateway error" }, { status: 502 });
  }

  const order = await orderRes.json();

  // Insert payment record
  await admin.from("payments").insert({
    user_id: user!.id,
    agent,
    document_id: documentId,
    razorpay_order_id: order.id,
    amount: AMOUNT_PAISE,
    currency: "INR",
    status: "created",
  });

  return NextResponse.json({
    orderId: order.id,
    amount: AMOUNT_PAISE,
    currency: "INR",
    keyId: RAZORPAY_KEY_ID,
    description: AGENT_LABELS[agent as Agent],
  });
}
