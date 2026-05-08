-- Shared payments table for all agents (networth, llp, partnership, offer-letter)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent TEXT NOT NULL CHECK (agent IN ('networth', 'llp', 'partnership', 'offerletter')),
  document_id TEXT NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL DEFAULT 19900,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for checking if a document is already paid
CREATE INDEX IF NOT EXISTS idx_payments_lookup
  ON payments (agent, document_id, user_id, status);

-- Index for order lookup during verification
CREATE INDEX IF NOT EXISTS idx_payments_order
  ON payments (razorpay_order_id);

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON payments FOR ALL
  USING (true)
  WITH CHECK (true);
