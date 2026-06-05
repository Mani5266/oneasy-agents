-- Migration 009: Performance Indexes
-- Adds missing user_id and lookup indexes for tables that only had a PK index.
-- Idempotent: uses CREATE INDEX IF NOT EXISTS.
--
-- This migration complements 008 (live-row partial indexes) by adding full
-- (non-partial) indexes that also cover deleted rows — useful for admin
-- queries, GDPR exports, and reconciliation jobs.
--
-- Skips tables that already have proper user_id indexes (from 002, 003, 006B).

BEGIN;

-- ─── Offer Letter (had only PK) ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_offerletter_offers_user_id    ON public.offerletter_offers (user_id);
CREATE INDEX IF NOT EXISTS idx_offerletter_offers_created_at ON public.offerletter_offers (created_at DESC);

-- ─── Salary (all 3 tables had only PK) ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_salary_results_user_id        ON public.salary_results   (user_id);
CREATE INDEX IF NOT EXISTS idx_salary_results_created_at     ON public.salary_results   (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_salary_payslips_user_id       ON public.salary_payslips  (user_id);
CREATE INDEX IF NOT EXISTS idx_salary_payslips_created_at    ON public.salary_payslips  (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_salary_employees_user_id      ON public.salary_employees (user_id);
CREATE INDEX IF NOT EXISTS idx_salary_employees_updated_at   ON public.salary_employees (updated_at DESC);

-- ─── LLP legacy (had only PK) ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_llp_agreements_user_id        ON public.llp_agreements (user_id);
CREATE INDEX IF NOT EXISTS idx_llp_agreements_updated_at     ON public.llp_agreements (updated_at DESC);

-- ─── Payments lookup variants ────────────────────────────────────────────────
-- Existing in 007: idx_payments_lookup(agent, document_id, user_id, status) and idx_payments_order
-- Add individual indexes for common single-column queries:
CREATE INDEX IF NOT EXISTS idx_payments_user_id              ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_document_id          ON public.payments (document_id);
CREATE INDEX IF NOT EXISTS idx_payments_status               ON public.payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at           ON public.payments (created_at DESC);

-- ─── Partnership children (look up by parent) ────────────────────────────────
-- Already have idx_partnership_partners_deed_id and idx_partnership_addresses_deed_id

-- ─── Networth supplementary indexes ──────────────────────────────────────────
-- created_at sort index for history pages
CREATE INDEX IF NOT EXISTS idx_networth_certificates_created_at ON public.networth_certificates (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partnership_deeds_created_at     ON public.partnership_deeds     (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llp_form_agreements_created_at   ON public.llp_form_agreements   (created_at DESC);

COMMIT;
