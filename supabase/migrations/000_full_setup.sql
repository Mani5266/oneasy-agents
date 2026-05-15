-- ══════════════════════════════════════════════════════════════════════════════
-- ONEASY AGENTS — COMPLETE DATABASE SETUP (ALL MIGRATIONS COMBINED)
-- Run this ONCE in Supabase SQL Editor to set up everything.
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT DO NOTHING throughout.
-- ══════════════════════════════════════════════════════════════════════════════


-- ############################################################################
-- 002: NETWORTH AGENT
-- ############################################################################

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

-- RLS
ALTER TABLE networth_clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_certificates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_usage_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_certificate_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nw_clients_select" ON networth_clients;
DROP POLICY IF EXISTS "nw_clients_insert" ON networth_clients;
DROP POLICY IF EXISTS "nw_clients_update" ON networth_clients;
DROP POLICY IF EXISTS "nw_clients_delete" ON networth_clients;
CREATE POLICY "nw_clients_select" ON networth_clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "nw_clients_insert" ON networth_clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nw_clients_update" ON networth_clients FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nw_clients_delete" ON networth_clients FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "nw_certificates_select" ON networth_certificates;
DROP POLICY IF EXISTS "nw_certificates_insert" ON networth_certificates;
DROP POLICY IF EXISTS "nw_certificates_update" ON networth_certificates;
DROP POLICY IF EXISTS "nw_certificates_delete" ON networth_certificates;
CREATE POLICY "nw_certificates_select" ON networth_certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "nw_certificates_insert" ON networth_certificates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nw_certificates_update" ON networth_certificates FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nw_certificates_delete" ON networth_certificates FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "nw_documents_select" ON networth_documents;
DROP POLICY IF EXISTS "nw_documents_insert" ON networth_documents;
DROP POLICY IF EXISTS "nw_documents_delete" ON networth_documents;
CREATE POLICY "nw_documents_select" ON networth_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "nw_documents_insert" ON networth_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nw_documents_delete" ON networth_documents FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "nw_usage_logs_select" ON networth_usage_logs;
DROP POLICY IF EXISTS "nw_usage_logs_insert" ON networth_usage_logs;
CREATE POLICY "nw_usage_logs_select" ON networth_usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "nw_usage_logs_insert" ON networth_usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "nw_audit_logs_select" ON networth_audit_logs;
DROP POLICY IF EXISTS "nw_audit_logs_insert" ON networth_audit_logs;
DROP POLICY IF EXISTS "nw_audit_logs_deny_update" ON networth_audit_logs;
DROP POLICY IF EXISTS "nw_audit_logs_deny_delete" ON networth_audit_logs;
CREATE POLICY "nw_audit_logs_select" ON networth_audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "nw_audit_logs_insert" ON networth_audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nw_audit_logs_deny_update" ON networth_audit_logs FOR UPDATE TO authenticated USING (false);
CREATE POLICY "nw_audit_logs_deny_delete" ON networth_audit_logs FOR DELETE TO authenticated USING (false);

DROP POLICY IF EXISTS "nw_cert_versions_select" ON networth_certificate_versions;
DROP POLICY IF EXISTS "nw_cert_versions_insert" ON networth_certificate_versions;
DROP POLICY IF EXISTS "nw_cert_versions_deny_update" ON networth_certificate_versions;
DROP POLICY IF EXISTS "nw_cert_versions_deny_delete" ON networth_certificate_versions;
CREATE POLICY "nw_cert_versions_select" ON networth_certificate_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "nw_cert_versions_insert" ON networth_certificate_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nw_cert_versions_deny_update" ON networth_certificate_versions FOR UPDATE TO authenticated USING (false);
CREATE POLICY "nw_cert_versions_deny_delete" ON networth_certificate_versions FOR DELETE TO authenticated USING (false);

-- Networth storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('networth-documents', 'networth-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "nw_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "nw_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "nw_storage_delete" ON storage.objects;
CREATE POLICY "nw_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'networth-documents');
CREATE POLICY "nw_storage_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'networth-documents' AND owner_id IS NOT NULL AND owner_id = auth.uid()::text);
CREATE POLICY "nw_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'networth-documents' AND owner_id IS NOT NULL AND owner_id = auth.uid()::text);

-- Networth triggers
CREATE OR REPLACE FUNCTION networth_update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS networth_clients_updated_at ON networth_clients;
CREATE TRIGGER networth_clients_updated_at BEFORE UPDATE ON networth_clients FOR EACH ROW EXECUTE FUNCTION networth_update_updated_at();

DROP TRIGGER IF EXISTS networth_certificates_updated_at ON networth_certificates;
CREATE TRIGGER networth_certificates_updated_at BEFORE UPDATE ON networth_certificates FOR EACH ROW EXECUTE FUNCTION networth_update_updated_at();


-- ############################################################################
-- 003: PARTNERSHIP AGENT
-- ############################################################################

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.partnership_deeds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name   TEXT NOT NULL DEFAULT '',
  partner1_name   TEXT NOT NULL DEFAULT '',
  partner2_name   TEXT NOT NULL DEFAULT '',
  payload         JSONB NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at_partnership_deeds ON public.partnership_deeds;
CREATE TRIGGER set_updated_at_partnership_deeds BEFORE UPDATE ON public.partnership_deeds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.partnership_partners (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deed_id             UUID NOT NULL REFERENCES public.partnership_deeds(id) ON DELETE CASCADE,
  ordinal             INT NOT NULL DEFAULT 0,
  name                TEXT NOT NULL DEFAULT '',
  relation            TEXT NOT NULL DEFAULT 'S/O',
  father_name         TEXT NOT NULL DEFAULT '',
  age                 INT,
  address             TEXT NOT NULL DEFAULT '',
  capital_pct         NUMERIC,
  profit_pct          NUMERIC,
  is_managing_partner BOOLEAN NOT NULL DEFAULT false,
  is_bank_authorized  BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partnership_addresses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deed_id         UUID NOT NULL UNIQUE REFERENCES public.partnership_deeds(id) ON DELETE CASCADE,
  door_no         TEXT NOT NULL DEFAULT '',
  building_name   TEXT NOT NULL DEFAULT '',
  area            TEXT NOT NULL DEFAULT '',
  district        TEXT NOT NULL DEFAULT '',
  state           TEXT NOT NULL DEFAULT '',
  pincode         TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at_partnership_addresses ON public.partnership_addresses;
CREATE TRIGGER set_updated_at_partnership_addresses BEFORE UPDATE ON public.partnership_addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.partnership_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deed_id     UUID NOT NULL REFERENCES public.partnership_deeds(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version     INT NOT NULL DEFAULT 1,
  file_url    TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  file_type   TEXT NOT NULL DEFAULT 'application/pdf',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partnership_deeds_user_id ON public.partnership_deeds(user_id);
CREATE INDEX IF NOT EXISTS idx_partnership_partners_deed_id ON public.partnership_partners(deed_id);
CREATE INDEX IF NOT EXISTS idx_partnership_addresses_deed_id ON public.partnership_addresses(deed_id);
CREATE INDEX IF NOT EXISTS idx_partnership_documents_deed_id ON public.partnership_documents(deed_id);
CREATE INDEX IF NOT EXISTS idx_partnership_documents_user_id ON public.partnership_documents(user_id);

ALTER TABLE public.partnership_deeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partnership_deeds_user_isolation" ON public.partnership_deeds;
CREATE POLICY "partnership_deeds_user_isolation" ON public.partnership_deeds
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "partnership_partners_via_deed" ON public.partnership_partners;
CREATE POLICY "partnership_partners_via_deed" ON public.partnership_partners
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.partnership_deeds WHERE id = partnership_partners.deed_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.partnership_deeds WHERE id = partnership_partners.deed_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "partnership_addresses_via_deed" ON public.partnership_addresses;
CREATE POLICY "partnership_addresses_via_deed" ON public.partnership_addresses
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.partnership_deeds WHERE id = partnership_addresses.deed_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.partnership_deeds WHERE id = partnership_addresses.deed_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "partnership_documents_user_isolation" ON public.partnership_documents;
CREATE POLICY "partnership_documents_user_isolation" ON public.partnership_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Partnership storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('partnership-docs', 'partnership-docs', false, 10485760, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 10485760;

DROP POLICY IF EXISTS "partnership_docs_select" ON storage.objects;
CREATE POLICY "partnership_docs_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'partnership-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "partnership_docs_insert" ON storage.objects;
CREATE POLICY "partnership_docs_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'partnership-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "partnership_docs_delete" ON storage.objects;
CREATE POLICY "partnership_docs_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'partnership-docs' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ############################################################################
-- 004: OFFER LETTER AGENT
-- ############################################################################

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

ALTER TABLE offerletter_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own offers" ON offerletter_offers;
CREATE POLICY "Users can manage own offers" ON offerletter_offers FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_offerletter_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_offerletter_offers_updated_at ON offerletter_offers;
CREATE TRIGGER trg_offerletter_offers_updated_at BEFORE UPDATE ON offerletter_offers FOR EACH ROW EXECUTE FUNCTION update_offerletter_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('offerletter-docs', 'offerletter-docs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own offer docs" ON storage.objects;
CREATE POLICY "Users upload own offer docs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'offerletter-docs' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users read own offer docs" ON storage.objects;
CREATE POLICY "Users read own offer docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'offerletter-docs' AND auth.uid() IS NOT NULL);


-- ############################################################################
-- 005: SALARY AGENT
-- ############################################################################

CREATE TABLE IF NOT EXISTS salary_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  annual_ctc NUMERIC NOT NULL DEFAULT 0,
  monthly_ctc NUMERIC NOT NULL DEFAULT 0,
  state TEXT,
  basic NUMERIC DEFAULT 0,
  hra NUMERIC DEFAULT 0,
  conveyance NUMERIC DEFAULT 0,
  medical NUMERIC DEFAULT 0,
  children_education NUMERIC DEFAULT 0,
  children_hostel NUMERIC DEFAULT 0,
  special_allowance NUMERIC DEFAULT 0,
  lta NUMERIC DEFAULT 0,
  differential_allowance NUMERIC DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  employee_epf NUMERIC DEFAULT 0,
  employee_esi NUMERIC DEFAULT 0,
  professional_tax NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  employer_epf NUMERIC DEFAULT 0,
  employer_esi NUMERIC DEFAULT 0,
  net_salary_monthly NUMERIC DEFAULT 0,
  net_salary_annual NUMERIC DEFAULT 0,
  esi_eligible BOOLEAN DEFAULT false,
  employee_name TEXT,
  calculation_type TEXT DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salary_payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL DEFAULT '',
  company_name TEXT DEFAULT '',
  month TEXT NOT NULL,
  annual_ctc NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  file_name TEXT NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salary_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  employee_code TEXT,
  designation TEXT,
  department TEXT,
  date_of_joining TEXT,
  annual_ctc NUMERIC NOT NULL DEFAULT 0,
  state TEXT DEFAULT 'Karnataka',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE salary_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own salary results" ON salary_results;
CREATE POLICY "Users can manage own salary results" ON salary_results FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own payslips" ON salary_payslips;
CREATE POLICY "Users can manage own payslips" ON salary_payslips FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own employees" ON salary_employees;
CREATE POLICY "Users can manage own employees" ON salary_employees FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('salary-payslips', 'salary-payslips', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own payslips" ON storage.objects;
CREATE POLICY "Users upload own payslips" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'salary-payslips' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Public read payslips" ON storage.objects;
CREATE POLICY "Public read payslips" ON storage.objects FOR SELECT
  USING (bucket_id = 'salary-payslips');


-- ############################################################################
-- 006: LLP AGENT
-- ############################################################################

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

DROP POLICY IF EXISTS "Users can manage own llp agreements" ON llp_agreements;
CREATE POLICY "Users can manage own llp agreements" ON llp_agreements FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('llp-docs', 'llp-docs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own llp docs" ON storage.objects;
CREATE POLICY "Users upload own llp docs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'llp-docs' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users read own llp docs" ON storage.objects;
CREATE POLICY "Users read own llp docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'llp-docs' AND auth.uid() IS NOT NULL);


-- ############################################################################
-- 006B: LLP FORM AGENT (new form-based wizard)
-- ############################################################################

CREATE TABLE IF NOT EXISTS llp_form_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  llp_name TEXT NOT NULL DEFAULT '',
  num_partners INTEGER NOT NULL DEFAULT 2,
  data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE llp_form_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own llp form agreements" ON llp_form_agreements;
CREATE POLICY "Users can manage own llp form agreements" ON llp_form_agreements FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_llp_form_agreements_user_id ON llp_form_agreements(user_id);


-- ############################################################################
-- 007: PAYMENTS (shared across all agents)
-- ############################################################################

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

CREATE INDEX IF NOT EXISTS idx_payments_lookup ON payments (agent, document_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (razorpay_order_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access" ON payments;
CREATE POLICY "Service role full access" ON payments FOR ALL
  USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════════════════════
-- DONE! All tables, indexes, RLS policies, storage buckets, and triggers created.
-- ══════════════════════════════════════════════════════════════════════════════
