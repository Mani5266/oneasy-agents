-- ===============================================================================
-- Partnership Deed Module — Schema for Unified App
-- Tables: partnership_deeds, partnership_partners, partnership_addresses, partnership_documents
-- Storage: partnership-docs bucket
-- Target: rrwrivleaqyqfklboopk.supabase.co (Oneasy Agents project)
-- ===============================================================================


-- ---------------------------------------------------------------------------
-- SECTION 1: SHARED TRIGGER FUNCTION
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------------
-- SECTION 2: TABLES
-- ---------------------------------------------------------------------------

-- Table 1: partnership_deeds (main deed records)
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
CREATE TRIGGER set_updated_at_partnership_deeds
    BEFORE UPDATE ON public.partnership_deeds
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Table 2: partnership_partners (child of partnership_deeds)
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


-- Table 3: partnership_addresses (one per deed)
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
CREATE TRIGGER set_updated_at_partnership_addresses
    BEFORE UPDATE ON public.partnership_addresses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Table 4: partnership_documents (generated document versions)
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


-- ---------------------------------------------------------------------------
-- SECTION 3: INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_partnership_deeds_user_id ON public.partnership_deeds(user_id);
CREATE INDEX IF NOT EXISTS idx_partnership_partners_deed_id ON public.partnership_partners(deed_id);
CREATE INDEX IF NOT EXISTS idx_partnership_addresses_deed_id ON public.partnership_addresses(deed_id);
CREATE INDEX IF NOT EXISTS idx_partnership_documents_deed_id ON public.partnership_documents(deed_id);
CREATE INDEX IF NOT EXISTS idx_partnership_documents_user_id ON public.partnership_documents(user_id);


-- ---------------------------------------------------------------------------
-- SECTION 4: ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.partnership_deeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_documents ENABLE ROW LEVEL SECURITY;

-- partnership_deeds: user can only see/modify their own deeds
DROP POLICY IF EXISTS "partnership_deeds_user_isolation" ON public.partnership_deeds;
CREATE POLICY "partnership_deeds_user_isolation" ON public.partnership_deeds
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- partnership_partners: access via deed ownership
DROP POLICY IF EXISTS "partnership_partners_via_deed" ON public.partnership_partners;
CREATE POLICY "partnership_partners_via_deed" ON public.partnership_partners
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.partnership_deeds WHERE id = partnership_partners.deed_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.partnership_deeds WHERE id = partnership_partners.deed_id AND user_id = auth.uid()));

-- partnership_addresses: access via deed ownership
DROP POLICY IF EXISTS "partnership_addresses_via_deed" ON public.partnership_addresses;
CREATE POLICY "partnership_addresses_via_deed" ON public.partnership_addresses
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.partnership_deeds WHERE id = partnership_addresses.deed_id AND user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.partnership_deeds WHERE id = partnership_addresses.deed_id AND user_id = auth.uid()));

-- partnership_documents: user isolation
DROP POLICY IF EXISTS "partnership_documents_user_isolation" ON public.partnership_documents;
CREATE POLICY "partnership_documents_user_isolation" ON public.partnership_documents
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- SECTION 5: STORAGE BUCKET
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'partnership-docs',
    'partnership-docs',
    false,
    10485760,
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760;


-- ---------------------------------------------------------------------------
-- SECTION 6: STORAGE RLS POLICIES
-- Path format: {user_id}/{deed_id}/{filename}
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "partnership_docs_select" ON storage.objects;
CREATE POLICY "partnership_docs_select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'partnership-docs'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "partnership_docs_insert" ON storage.objects;
CREATE POLICY "partnership_docs_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'partnership-docs'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "partnership_docs_delete" ON storage.objects;
CREATE POLICY "partnership_docs_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'partnership-docs'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );


-- ===============================================================================
-- DONE. Partnership tables, indexes, RLS, storage bucket and policies created.
-- All tables use partnership_ prefix to avoid collisions.
-- ===============================================================================
