-- ══════════════════════════════════════════════════════════════════════════════
-- 004: Offer Letter Agent Schema
-- ══════════════════════════════════════════════════════════════════════════════

-- Table: offerletter_offers
CREATE TABLE IF NOT EXISTS offerletter_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emp_name TEXT NOT NULL DEFAULT '',
  designation TEXT NOT NULL DEFAULT '',
  annual_ctc NUMERIC NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}',
  doc_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE offerletter_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own offers"
  ON offerletter_offers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_offerletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_offerletter_offers_updated_at
  BEFORE UPDATE ON offerletter_offers
  FOR EACH ROW EXECUTE FUNCTION update_offerletter_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('offerletter-docs', 'offerletter-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own offer docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'offerletter-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users read own offer docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'offerletter-docs' AND auth.uid() IS NOT NULL);
