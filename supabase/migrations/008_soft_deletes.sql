-- Migration 008: Soft Delete Support
-- Adds `deleted_at TIMESTAMPTZ DEFAULT NULL` to user document tables.
-- Application code is responsible for filtering `deleted_at IS NULL` on SELECT
-- and for setting `deleted_at = NOW()` on logical delete.
--
-- RLS policies are intentionally NOT modified — keeping `FOR ALL ... auth.uid() = user_id`
-- so that soft-delete UPDATEs work without requiring policy splits. Defense-in-depth
-- against accidentally returning deleted rows is enforced at the application layer via
-- src/lib/db/soft-delete.ts.
--
-- Excluded from soft-delete (immutable / audit / financial):
--   * networth_usage_logs
--   * networth_audit_logs
--   * networth_certificate_versions
--   * payments
--   * partnership_partners        (cascades from partnership_deeds)
--   * partnership_addresses       (cascades from partnership_deeds)
--
-- Re-runnable: uses ADD COLUMN IF NOT EXISTS.

BEGIN;

-- ─── Networth ─────────────────────────────────────────────────────────────────
ALTER TABLE public.networth_clients      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.networth_certificates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.networth_documents    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ─── Partnership ──────────────────────────────────────────────────────────────
ALTER TABLE public.partnership_deeds     ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.partnership_documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ─── Offer Letter ─────────────────────────────────────────────────────────────
ALTER TABLE public.offerletter_offers    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ─── Salary ───────────────────────────────────────────────────────────────────
ALTER TABLE public.salary_results        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.salary_payslips       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.salary_employees      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ─── LLP (legacy + form) ──────────────────────────────────────────────────────
ALTER TABLE public.llp_agreements        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.llp_form_agreements   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ─── Partial indexes for the live (non-deleted) hot path ──────────────────────
-- These indexes only include rows where deleted_at IS NULL, keeping them small
-- and making the most common queries (list-my-non-deleted-X-by-recent) fast.
CREATE INDEX IF NOT EXISTS idx_networth_clients_live      ON public.networth_clients      (user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_networth_certificates_live ON public.networth_certificates (user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_networth_documents_live    ON public.networth_documents    (user_id, uploaded_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_partnership_deeds_live     ON public.partnership_deeds     (user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partnership_documents_live ON public.partnership_documents (user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_offerletter_offers_live    ON public.offerletter_offers    (user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_salary_results_live        ON public.salary_results        (user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_salary_payslips_live       ON public.salary_payslips       (user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_salary_employees_live      ON public.salary_employees      (user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_llp_agreements_live        ON public.llp_agreements        (user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_llp_form_agreements_live   ON public.llp_form_agreements   (user_id, created_at DESC) WHERE deleted_at IS NULL;

COMMIT;
