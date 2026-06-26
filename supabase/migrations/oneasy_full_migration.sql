-- ══════════════════════════════════════════════════════════════════════════════
-- ONEASY AGENTS — COMPLETE MIGRATION (Run ONCE in Supabase SQL Editor)
-- Combines: 000_full_setup + 008_soft_deletes + 009_indexes
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT DO NOTHING throughout.
-- ══════════════════════════════════════════════════════════════════════════════


-- ############################################################################
-- 000: FULL SETUP (tables, RLS, storage buckets, policies)
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
  status      TEXT        NOT NULL DEFAULT 'draft',
  pdf_url     TEXT,
  doc_url     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_networth_certificates_client_id ON networth_certificates(client_id);
CREATE INDEX IF NOT EXISTS idx_networth_certificates_user_id   ON networth_certificates(user_id);

CREATE TABLE IF NOT EXISTS networth_documents (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_id  UUID        REFERENCES networth_certificates(id) ON DELETE CASCADE,
  document_type   TEXT        NOT NULL,
  file_name       TEXT        NOT NULL,
  file_url        TEXT,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_networth_documents_certificate_id ON networth_documents(certificate_id);

CREATE TABLE IF NOT EXISTS networth_usage_logs (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_networth_usage_logs_user_id ON networth_usage_logs(user_id);

CREATE TABLE IF NOT EXISTS networth_audit_logs (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  details     JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_networth_audit_logs_user_id ON networth_audit_logs(user_id);

CREATE TABLE IF NOT EXISTS networth_certificate_versions (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_id   UUID        NOT NULL REFERENCES networth_certificates(id) ON DELETE CASCADE,
  version_number   INT         NOT NULL,
  pdf_url          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(certificate_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_networth_cert_versions_cert_id ON networth_certificate_versions(certificate_id);

-- SECTION 2: ENABLE RLS ON ALL TABLES
ALTER TABLE networth_clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_certificates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_usage_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_certificate_versions ENABLE ROW LEVEL SECURITY;

-- SECTION 3: DROP EXISTING POLICIES TO AVOID DUPLICATE ERRORS
DROP POLICY IF EXISTS "Users can view own client data" ON networth_clients;
DROP POLICY IF EXISTS "Users can insert own client data" ON networth_clients;
DROP POLICY IF EXISTS "Users can update own client data" ON networth_clients;
DROP POLICY IF EXISTS "Users can delete own client data" ON networth_clients;
DROP POLICY IF EXISTS "Users can view own certificates" ON networth_certificates;
DROP POLICY IF EXISTS "Users can insert own certificates" ON networth_certificates;
DROP POLICY IF EXISTS "Users can update own certificates" ON networth_certificates;
DROP POLICY IF EXISTS "Users can delete own certificates" ON networth_certificates;
DROP POLICY IF EXISTS "Users can view own documents" ON networth_documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON networth_documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON networth_documents;
DROP POLICY IF EXISTS "Users can view own usage logs" ON networth_usage_logs;
DROP POLICY IF EXISTS "Users can insert own usage logs" ON networth_usage_logs;
DROP POLICY IF EXISTS "Users can view own audit logs" ON networth_audit_logs;
DROP POLICY IF EXISTS "Users can view own certificate versions" ON networth_certificate_versions;
DROP POLICY IF EXISTS "Users can insert own certificate versions" ON networth_certificate_versions;

-- SECTION 4: CREATE RLS POLICIES

-- networth_clients
CREATE POLICY "Users can view own client data"
  ON networth_clients FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own client data"
  ON networth_clients FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own client data"
  ON networth_clients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own client data"
  ON networth_clients FOR DELETE
  USING (user_id = auth.uid());

-- networth_certificates
CREATE POLICY "Users can view own certificates"
  ON networth_certificates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own certificates"
  ON networth_certificates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own certificates"
  ON networth_certificates FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own certificates"
  ON networth_certificates FOR DELETE
  USING (user_id = auth.uid());

-- networth_documents
CREATE POLICY "Users can view own documents"
  ON networth_documents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
  ON networth_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON networth_documents FOR DELETE
  USING (user_id = auth.uid());

-- networth_usage_logs
CREATE POLICY "Users can view own usage logs"
  ON networth_usage_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own usage logs"
  ON networth_usage_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- networth_audit_logs
CREATE POLICY "Users can view own audit logs"
  ON networth_audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- networth_certificate_versions
CREATE POLICY "Users can view own certificate versions"
  ON networth_certificate_versions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own certificate versions"
  ON networth_certificate_versions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Networth storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'networth-documents', 'networth-documents', false, 10485760, '{"application/pdf"}'
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'networth-documents');

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

-- ══════════════════════════════════════════════════════════════════════════════
-- PARTNERSHIP SCHEMA
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.partnership_deeds (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_addr TEXT NOT NULL,
  business_nature TEXT NOT NULL,
  capital       NUMERIC(12,2) NOT NULL DEFAULT 0,
  profit_ratio  TEXT NOT NULL,
  duration      TEXT,
  deed_text     TEXT,
  doc_url       TEXT,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partnership_deeds_user_id ON public.partnership_deeds(user_id);

CREATE TABLE IF NOT EXISTS public.partnership_partners (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  deed_id       UUID        NOT NULL REFERENCES public.partnership_deeds(id) ON DELETE CASCADE,
  full_name     TEXT        NOT NULL,
  father_name   TEXT NOT NULL DEFAULT '',
  address       TEXT NOT NULL DEFAULT '',
  occupation    TEXT NOT NULL DEFAULT '',
  aadhaar       TEXT NOT NULL DEFAULT '',
  pan           TEXT NOT NULL DEFAULT '',
  mobile        TEXT NOT NULL DEFAULT '',
  capital_contrib NUMERIC(12,2) NOT NULL DEFAULT 0,
  profit_share  NUMERIC(5,2) NOT NULL DEFAULT 0,
  designation   TEXT NOT NULL DEFAULT 'Partner',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partnership_partners_deed_id ON public.partnership_partners(deed_id);

CREATE TABLE IF NOT EXISTS public.partnership_addresses (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  deed_id       UUID        NOT NULL REFERENCES public.partnership_deeds(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL DEFAULT 'registered',
  address_line1 TEXT NOT NULL DEFAULT '',
  address_line2 TEXT DEFAULT '',
  city          TEXT NOT NULL DEFAULT '',
  state         TEXT NOT NULL DEFAULT '',
  pincode       TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partnership_addresses_deed_id ON public.partnership_addresses(deed_id);

CREATE TABLE IF NOT EXISTS public.partnership_documents (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  deed_id       UUID        NOT NULL REFERENCES public.partnership_deeds(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url      TEXT NOT NULL DEFAULT '',
  file_type     TEXT NOT NULL DEFAULT '',
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partnership_documents_deed_id ON public.partnership_documents(deed_id);

ALTER TABLE public.partnership_deeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own partnership deeds" ON public.partnership_deeds;
DROP POLICY IF EXISTS "Users can insert own partnership deeds" ON public.partnership_deeds;
DROP POLICY IF EXISTS "Users can update own partnership deeds" ON public.partnership_deeds;
DROP POLICY IF EXISTS "Users can delete own partnership deeds" ON public.partnership_deeds;

DROP POLICY IF EXISTS "Users can view own partnership partners" ON public.partnership_partners;
DROP POLICY IF EXISTS "Users can insert own partnership partners" ON public.partnership_partners;
DROP POLICY IF EXISTS "Users can update own partnership partners" ON public.partnership_partners;
DROP POLICY IF EXISTS "Users can delete own partnership partners" ON public.partnership_partners;

DROP POLICY IF EXISTS "Users can view own partnership addresses" ON public.partnership_addresses;
DROP POLICY IF EXISTS "Users can insert own partnership addresses" ON public.partnership_addresses;
DROP POLICY IF EXISTS "Users can update own partnership addresses" ON public.partnership_addresses;
DROP POLICY IF EXISTS "Users can delete own partnership addresses" ON public.partnership_addresses;

DROP POLICY IF EXISTS "Users can view own partnership documents" ON public.partnership_documents;
DROP POLICY IF EXISTS "Users can insert own partnership documents" ON public.partnership_documents;
DROP POLICY IF EXISTS "Users can delete own partnership documents" ON public.partnership_documents;

CREATE POLICY "Users can view own partnership deeds"
  ON public.partnership_deeds FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own partnership deeds"
  ON public.partnership_deeds FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own partnership deeds"
  ON public.partnership_deeds FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own partnership deeds"
  ON public.partnership_deeds FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own partnership partners"
  ON public.partnership_partners FOR SELECT
  USING (deed_id IN (SELECT id FROM public.partnership_deeds WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own partnership partners"
  ON public.partnership_partners FOR INSERT
  WITH CHECK (deed_id IN (SELECT id FROM public.partnership_deeds WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own partnership partners"
  ON public.partnership_partners FOR UPDATE
  USING (deed_id IN (SELECT id FROM public.partnership_deeds WHERE user_id = auth.uid()))
  WITH CHECK (deed_id IN (SELECT id FROM public.partnership_deeds WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own partnership partners"
  ON public.partnership_partners FOR DELETE
  USING (deed_id IN (SELECT id FROM public.partnership_deeds WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own partnership addresses"
  ON public.partnership_addresses FOR SELECT
  USING (deed_id IN (SELECT id FROM public.partnership_deeds WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own partnership addresses"
  ON public.partnership_addresses FOR INSERT
  WITH CHECK (deed_id IN (SELECT id FROM public.partnership_deeds WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own partnership addresses"
  ON public.partnership_addresses FOR UPDATE
  USING (deed_id IN (SELECT id FROM public.partnership_deeds WHERE user_id = auth.uid()))
  WITH CHECK (deed_id IN (SELECT id FROM public.partnership_deeds WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own partnership addresses"
  ON public.partnership_addresses FOR DELETE
  USING (deed_id IN (SELECT id FROM public.partnership_deeds WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own partnership documents"
  ON public.partnership_documents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own partnership documents"
  ON public.partnership_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own partnership documents"
  ON public.partnership_documents FOR DELETE
  USING (user_id = auth.uid());

-- Partnership storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'partnership-docs', 'partnership-docs', false, 10485760, '{"application/pdf"}'
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'partnership-docs');

DROP POLICY IF EXISTS "partnership_docs_select" ON storage.objects;
DROP POLICY IF EXISTS "partnership_docs_insert" ON storage.objects;
DROP POLICY IF EXISTS "partnership_docs_delete" ON storage.objects;

CREATE POLICY "partnership_docs_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'partnership-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "partnership_docs_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'partnership-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "partnership_docs_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'partnership-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ══════════════════════════════════════════════════════════════════════════════
-- OFFER LETTER SCHEMA
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS offerletter_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  position TEXT NOT NULL,
  offer_date DATE NOT NULL,
  joining_date DATE NOT NULL,
  ctc NUMERIC(12,2) NOT NULL,
  basic_salary NUMERIC(12,2) NOT NULL,
  hra NUMERIC(12,2) NOT NULL,
  special_allowance NUMERIC(12,2) NOT NULL,
  other_allowances NUMERIC(12,2) NOT NULL DEFAULT 0,
  conveyance NUMERIC(12,2) NOT NULL DEFAULT 0,
  medical NUMERIC(12,2) NOT NULL DEFAULT 0,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  doc_url TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE offerletter_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own offer letters" ON offerletter_offers;
DROP POLICY IF EXISTS "Users can insert own offer letters" ON offerletter_offers;
DROP POLICY IF EXISTS "Users can update own offer letters" ON offerletter_offers;
DROP POLICY IF EXISTS "Users can delete own offer letters" ON offerletter_offers;

CREATE POLICY "Users can view own offer letters"
  ON offerletter_offers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own offer letters"
  ON offerletter_offers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own offer letters"
  ON offerletter_offers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own offer letters"
  ON offerletter_offers FOR DELETE
  USING (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public)
SELECT 'offerletter-docs', 'offerletter-docs', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'offerletter-docs');

DROP POLICY IF EXISTS "Users upload own offer docs" ON storage.objects;
DROP POLICY IF EXISTS "Users read own offer docs" ON storage.objects;

CREATE POLICY "Users upload own offer docs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'offerletter-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users read own offer docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'offerletter-docs' AND auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════════════════════════
-- SALARY SCHEMA
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS salary_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  pan_number TEXT NOT NULL,
  monthly_ctc NUMERIC(12, 2) NOT NULL,
  basic_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50,
  hra_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20,
  hra_metro BOOLEAN NOT NULL DEFAULT true,
  pf_enabled BOOLEAN NOT NULL DEFAULT true,
  esi_enabled BOOLEAN NOT NULL DEFAULT false,
  professional_tax_state TEXT NOT NULL DEFAULT 'karnataka',
  basic_salary NUMERIC(12, 2) NOT NULL,
  hra_amount NUMERIC(12, 2) NOT NULL,
  special_allowance NUMERIC(12, 2) NOT NULL,
  employer_pf NUMERIC(12, 2) NOT NULL,
  employer_esi NUMERIC(12, 2) NOT NULL,
  employer_total NUMERIC(12, 2) NOT NULL,
  employee_pf NUMERIC(12, 2) NOT NULL,
  employee_esi NUMERIC(12, 2) NOT NULL,
  professional_tax NUMERIC(12, 2) NOT NULL,
  total_deductions NUMERIC(12, 2) NOT NULL,
  take_home NUMERIC(12, 2) NOT NULL,
  annual_ctc NUMERIC(12, 2) NOT NULL,
  annual_ctc_gross NUMERIC(12, 2) NOT NULL,
  new_regime_tax NUMERIC(12, 2),
  old_regime_tax NUMERIC(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_payslips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  pan_number TEXT NOT NULL,
  salary_result_id UUID REFERENCES salary_results(id) ON DELETE CASCADE,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  pan_number TEXT NOT NULL,
  monthly_ctc NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE salary_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salary_results_select" ON salary_results;
DROP POLICY IF EXISTS "salary_results_insert" ON salary_results;
DROP POLICY IF EXISTS "salary_results_delete" ON salary_results;
DROP POLICY IF EXISTS "salary_payslips_select" ON salary_payslips;
DROP POLICY IF EXISTS "salary_payslips_insert" ON salary_payslips;
DROP POLICY IF EXISTS "salary_payslips_delete" ON salary_payslips;
DROP POLICY IF EXISTS "salary_employees_select" ON salary_employees;
DROP POLICY IF EXISTS "salary_employees_insert" ON salary_employees;
DROP POLICY IF EXISTS "salary_employees_delete" ON salary_employees;

CREATE POLICY "salary_results_select" ON salary_results FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "salary_results_insert" ON salary_results FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "salary_results_delete" ON salary_results FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "salary_payslips_select" ON salary_payslips FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "salary_payslips_insert" ON salary_payslips FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "salary_payslips_delete" ON salary_payslips FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "salary_employees_select" ON salary_employees FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "salary_employees_insert" ON salary_employees FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "salary_employees_delete" ON salary_employees FOR DELETE USING (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public)
SELECT 'salary-payslips', 'salary-payslips', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'salary-payslips');

DROP POLICY IF EXISTS "Users upload own payslips" ON storage.objects;
DROP POLICY IF EXISTS "Public read payslips" ON storage.objects;

CREATE POLICY "Users upload own payslips" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'salary-payslips' AND auth.uid() IS NOT NULL);

CREATE POLICY "Public read payslips" ON storage.objects FOR SELECT
  USING (bucket_id = 'salary-payslips');

-- ══════════════════════════════════════════════════════════════════════════════
-- LLP SCHEMA
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS llp_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner1_name TEXT,
  partner2_name TEXT,
  llp_name TEXT,
  llp_definition TEXT,
  contribution1 NUMERIC,
  contribution2 NUMERIC,
  profit_ratio1 NUMERIC,
  profit_ratio2 NUMERIC,
  interest_on_capital NUMERIC,
  salary1 NUMERIC,
  salary2 NUMERIC,
  additional_terms TEXT,
  deed_of TEXT,
  status TEXT DEFAULT 'draft',
  doc_url TEXT,
  pdf_url TEXT,
  is_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE llp_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own LLP agreements" ON llp_agreements;
DROP POLICY IF EXISTS "Users can insert own LLP agreements" ON llp_agreements;
DROP POLICY IF EXISTS "Users can update own LLP agreements" ON llp_agreements;
DROP POLICY IF EXISTS "Users can delete own LLP agreements" ON llp_agreements;

CREATE POLICY "Users can view own LLP agreements"
  ON llp_agreements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own LLP agreements"
  ON llp_agreements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own LLP agreements"
  ON llp_agreements FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own LLP agreements"
  ON llp_agreements FOR DELETE
  USING (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public)
SELECT 'llp-docs', 'llp-docs', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'llp-docs');

DROP POLICY IF EXISTS "Users upload own llp docs" ON storage.objects;
DROP POLICY IF EXISTS "Users read own llp docs" ON storage.objects;

CREATE POLICY "Users upload own llp docs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'llp-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users read own llp docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'llp-docs' AND auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════════════════════════
-- LLP FORM SCHEMA (standalone mode without auth)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS llp_form_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  llp_name TEXT,
  llp_definition TEXT,
  registered_office TEXT,
  principal_office TEXT,
  partner1_name TEXT,
  partner1_father_name TEXT,
  partner1_address TEXT,
  partner1_occupation TEXT,
  partner1_aadhaar TEXT,
  partner1_pan TEXT,
  partner1_mobile TEXT,
  partner1_email TEXT,
  partner1_designation TEXT DEFAULT 'Designated Partner',
  partner1_contribution NUMERIC(12,2) DEFAULT 0,
  partner1_share NUMERIC(5,2) DEFAULT 50,
  partner2_name TEXT,
  partner2_father_name TEXT,
  partner2_address TEXT,
  partner2_occupation TEXT,
  partner2_aadhaar TEXT,
  partner2_pan TEXT,
  partner2_mobile TEXT,
  partner2_email TEXT,
  partner2_designation TEXT DEFAULT 'Designated Partner',
  partner2_contribution NUMERIC(12,2) DEFAULT 0,
  partner2_share NUMERIC(5,2) DEFAULT 50,
  max_partners INTEGER DEFAULT 2,
  obligation_of_contribution TEXT DEFAULT 'Upon demand by the designated partners.',
  profit_terms TEXT DEFAULT 'As per the profit sharing ratio mentioned above.',
  management_terms TEXT DEFAULT 'Both partners have equal rights in management.',
  indemnity TEXT DEFAULT 'The LLP shall indemnify each partner for acts done in good faith.',
  additional_terms TEXT,
  status TEXT DEFAULT 'draft',
  doc_url TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE llp_form_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own LLP form agreements" ON llp_form_agreements;
DROP POLICY IF EXISTS "Users can insert own LLP form agreements" ON llp_form_agreements;
DROP POLICY IF EXISTS "Users can update own LLP form agreements" ON llp_form_agreements;
DROP POLICY IF EXISTS "Users can delete own LLP form agreements" ON llp_form_agreements;

CREATE POLICY "Users can view own LLP form agreements"
  ON llp_form_agreements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own LLP form agreements"
  ON llp_form_agreements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own LLP form agreements"
  ON llp_form_agreements FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own LLP form agreements"
  ON llp_form_agreements FOR DELETE
  USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════════════════
-- PAYMENTS SCHEMA
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  agent_id UUID,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════════════════
-- 008: SOFT DELETES
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE networth_clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE networth_certificates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE networth_documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE partnership_deeds ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE partnership_documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE offerletter_offers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE salary_results ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE salary_payslips ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE salary_employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE llp_agreements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE llp_form_agreements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_networth_clients_deleted_at ON networth_clients(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_networth_certificates_deleted_at ON networth_certificates(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_networth_documents_deleted_at ON networth_documents(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partnership_deeds_deleted_at ON partnership_deeds(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partnership_documents_deleted_at ON partnership_documents(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_offerletter_offers_deleted_at ON offerletter_offers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_salary_results_deleted_at ON salary_results(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_salary_payslips_deleted_at ON salary_payslips(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_salary_employees_deleted_at ON salary_employees(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_llp_agreements_deleted_at ON llp_agreements(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_llp_form_agreements_deleted_at ON llp_form_agreements(deleted_at) WHERE deleted_at IS NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- 009: INDEXES (single-column performance indexes)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_offerletter_offers_user_id ON offerletter_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_llp_agreements_user_id ON llp_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_llp_form_agreements_user_id ON llp_form_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_results_user_id ON salary_results(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_payslips_user_id ON salary_payslips(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_employees_user_id ON salary_employees(user_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- DONE — ALL MIGRATIONS COMPLETE
-- ══════════════════════════════════════════════════════════════════════════════
