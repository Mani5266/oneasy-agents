-- ══════════════════════════════════════════════════════════════════════════════
-- 006: LLP Agent Schema
-- ══════════════════════════════════════════════════════════════════════════════

-- Table: llp_agreements (stores LLP deed wizard state)
CREATE TABLE IF NOT EXISTS llp_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  step TEXT NOT NULL DEFAULT 'num_partners',
  is_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE llp_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own llp agreements"
  ON llp_agreements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('llp-docs', 'llp-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own llp docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'llp-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users read own llp docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'llp-docs' AND auth.uid() IS NOT NULL);
