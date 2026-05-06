-- ============================================================================
-- 002_networth_schema.sql — Net Worth Certificate Agent (Unified App)
-- ============================================================================
-- Complete database setup for the networth agent.
-- All tables prefixed with "networth_" for multi-agent isolation.
--
-- SAFE TO RE-RUN: Uses IF NOT EXISTS / DROP POLICY IF EXISTS throughout.
-- ============================================================================


-- ############################################################################
-- SECTION 1: TABLES
-- ############################################################################

-- TABLE: networth_clients
CREATE TABLE IF NOT EXISTS networth_clients (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL,
  salutation  TEXT        NOT NULL,
  pan_number  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pan_number)
);

CREATE INDEX IF NOT EXISTS idx_networth_clients_user_id ON networth_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_networth_clients_pan_number ON networth_clients(pan_number);


-- TABLE: networth_certificates
CREATE TABLE IF NOT EXISTS networth_certificates (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   UUID        NOT NULL REFERENCES networth_clients(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose     TEXT        NOT NULL,
  country     TEXT,
  cert_date   DATE,
  udin        TEXT,
  nickname    TEXT,
  status      TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  form_data   JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_networth_certificates_client_id ON networth_certificates(client_id);
CREATE INDEX IF NOT EXISTS idx_networth_certificates_user_id ON networth_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_networth_certificates_status ON networth_certificates(status);


-- TABLE: networth_documents
CREATE TABLE IF NOT EXISTS networth_documents (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id  UUID        NOT NULL REFERENCES networth_certificates(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  annexure_type   TEXT        NOT NULL,
  category        TEXT        NOT NULL,
  file_url        TEXT        NOT NULL,
  file_name       TEXT        NOT NULL,
  file_type       TEXT        NOT NULL,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_networth_documents_certificate_id ON networth_documents(certificate_id);
CREATE INDEX IF NOT EXISTS idx_networth_documents_user_id ON networth_documents(user_id);


-- TABLE: networth_usage_logs
CREATE TABLE IF NOT EXISTS networth_usage_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature     TEXT NOT NULL,
  units       INTEGER NOT NULL DEFAULT 1,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_networth_usage_logs_user_id ON networth_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_networth_usage_logs_feature ON networth_usage_logs(feature);
CREATE INDEX IF NOT EXISTS idx_networth_usage_logs_created_at ON networth_usage_logs(created_at);


-- TABLE: networth_audit_logs
CREATE TABLE IF NOT EXISTS networth_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  entity      TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  before_data JSONB,
  after_data  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_networth_audit_logs_user_id ON networth_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_networth_audit_logs_entity_id ON networth_audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_networth_audit_logs_created_at ON networth_audit_logs(created_at);


-- TABLE: networth_certificate_versions
CREATE TABLE IF NOT EXISTS networth_certificate_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id  UUID NOT NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot        JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_networth_cert_versions_cert_id ON networth_certificate_versions(certificate_id);
CREATE INDEX IF NOT EXISTS idx_networth_cert_versions_user_id ON networth_certificate_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_networth_cert_versions_created_at ON networth_certificate_versions(created_at);


-- ############################################################################
-- SHARED AUTH TABLES — REMOVED
-- ############################################################################
-- email_verifications and password_resets tables are no longer needed.
-- We use Supabase's built-in email confirmation and password reset flows.


-- ############################################################################
-- SECTION 2: ENABLE RLS ON ALL TABLES
-- ############################################################################

ALTER TABLE networth_clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_certificates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_usage_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_certificate_versions ENABLE ROW LEVEL SECURITY;



-- ############################################################################
-- SECTION 3: RLS POLICIES
-- ############################################################################

-- ─── networth_clients ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "nw_clients_select" ON networth_clients;
DROP POLICY IF EXISTS "nw_clients_insert" ON networth_clients;
DROP POLICY IF EXISTS "nw_clients_update" ON networth_clients;
DROP POLICY IF EXISTS "nw_clients_delete" ON networth_clients;

CREATE POLICY "nw_clients_select" ON networth_clients FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "nw_clients_insert" ON networth_clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nw_clients_update" ON networth_clients FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nw_clients_delete" ON networth_clients FOR DELETE
  USING (auth.uid() = user_id);


-- ─── networth_certificates ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "nw_certificates_select" ON networth_certificates;
DROP POLICY IF EXISTS "nw_certificates_insert" ON networth_certificates;
DROP POLICY IF EXISTS "nw_certificates_update" ON networth_certificates;
DROP POLICY IF EXISTS "nw_certificates_delete" ON networth_certificates;

CREATE POLICY "nw_certificates_select" ON networth_certificates FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "nw_certificates_insert" ON networth_certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nw_certificates_update" ON networth_certificates FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nw_certificates_delete" ON networth_certificates FOR DELETE
  USING (auth.uid() = user_id);


-- ─── networth_documents ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "nw_documents_select" ON networth_documents;
DROP POLICY IF EXISTS "nw_documents_insert" ON networth_documents;
DROP POLICY IF EXISTS "nw_documents_delete" ON networth_documents;

CREATE POLICY "nw_documents_select" ON networth_documents FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "nw_documents_insert" ON networth_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nw_documents_delete" ON networth_documents FOR DELETE
  USING (auth.uid() = user_id);


-- ─── networth_usage_logs ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "nw_usage_logs_select" ON networth_usage_logs;
DROP POLICY IF EXISTS "nw_usage_logs_insert" ON networth_usage_logs;

CREATE POLICY "nw_usage_logs_select" ON networth_usage_logs FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "nw_usage_logs_insert" ON networth_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ─── networth_audit_logs ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "nw_audit_logs_select" ON networth_audit_logs;
DROP POLICY IF EXISTS "nw_audit_logs_insert" ON networth_audit_logs;
DROP POLICY IF EXISTS "nw_audit_logs_deny_update" ON networth_audit_logs;
DROP POLICY IF EXISTS "nw_audit_logs_deny_delete" ON networth_audit_logs;

CREATE POLICY "nw_audit_logs_select" ON networth_audit_logs FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "nw_audit_logs_insert" ON networth_audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nw_audit_logs_deny_update" ON networth_audit_logs FOR UPDATE
  TO authenticated USING (false);
CREATE POLICY "nw_audit_logs_deny_delete" ON networth_audit_logs FOR DELETE
  TO authenticated USING (false);


-- ─── networth_certificate_versions ────────────────────────────────────────────

DROP POLICY IF EXISTS "nw_cert_versions_select" ON networth_certificate_versions;
DROP POLICY IF EXISTS "nw_cert_versions_insert" ON networth_certificate_versions;
DROP POLICY IF EXISTS "nw_cert_versions_deny_update" ON networth_certificate_versions;
DROP POLICY IF EXISTS "nw_cert_versions_deny_delete" ON networth_certificate_versions;

CREATE POLICY "nw_cert_versions_select" ON networth_certificate_versions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "nw_cert_versions_insert" ON networth_certificate_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nw_cert_versions_deny_update" ON networth_certificate_versions FOR UPDATE
  TO authenticated USING (false);
CREATE POLICY "nw_cert_versions_deny_delete" ON networth_certificate_versions FOR DELETE
  TO authenticated USING (false);





-- ############################################################################
-- SECTION 4: STORAGE BUCKET
-- ############################################################################

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'networth-documents',
  'networth-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (owner-scoped)
DROP POLICY IF EXISTS "nw_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "nw_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "nw_storage_delete" ON storage.objects;

CREATE POLICY "nw_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'networth-documents');

CREATE POLICY "nw_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'networth-documents'
    AND owner_id IS NOT NULL
    AND owner_id = auth.uid()::text
  );

CREATE POLICY "nw_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'networth-documents'
    AND owner_id IS NOT NULL
    AND owner_id = auth.uid()::text
  );


-- ############################################################################
-- SECTION 5: UPDATED_AT TRIGGER
-- ############################################################################

CREATE OR REPLACE FUNCTION networth_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS networth_clients_updated_at ON networth_clients;
CREATE TRIGGER networth_clients_updated_at
  BEFORE UPDATE ON networth_clients
  FOR EACH ROW EXECUTE FUNCTION networth_update_updated_at();

DROP TRIGGER IF EXISTS networth_certificates_updated_at ON networth_certificates;
CREATE TRIGGER networth_certificates_updated_at
  BEFORE UPDATE ON networth_certificates
  FOR EACH ROW EXECUTE FUNCTION networth_update_updated_at();
