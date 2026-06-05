import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Tables that support soft-delete (migration 008).
 * Keeping a typed allowlist prevents typos and accidental soft-delete on
 * audit/log/payment tables.
 */
export type SoftDeleteTable =
  | "networth_clients"
  | "networth_certificates"
  | "networth_documents"
  | "partnership_deeds"
  | "partnership_documents"
  | "offerletter_offers"
  | "salary_results"
  | "salary_payslips"
  | "salary_employees"
  | "llp_agreements"
  | "llp_form_agreements";

export const SOFT_DELETE_TABLES: readonly SoftDeleteTable[] = [
  "networth_clients",
  "networth_certificates",
  "networth_documents",
  "partnership_deeds",
  "partnership_documents",
  "offerletter_offers",
  "salary_results",
  "salary_payslips",
  "salary_employees",
  "llp_agreements",
  "llp_form_agreements",
] as const;

export interface SoftDeleteResult {
  ok: boolean;
  error?: string;
}

/**
 * Soft-deletes a row by setting `deleted_at = NOW()`.
 *
 * Scopes by `user_id` to defense-in-depth against missing/misconfigured RLS.
 * Returns `{ ok: true }` on success, `{ ok: false, error }` on failure.
 *
 * Safe to call on an already-soft-deleted row (idempotent at the app layer —
 * a second call just bumps deleted_at to a newer timestamp).
 *
 * @example
 *   const result = await softDelete(supabase, "networth_certificates", certId, user.id);
 *   if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
 */
export async function softDelete(
  supabase: SupabaseClient,
  table: SoftDeleteTable,
  id: string,
  userId: string
): Promise<SoftDeleteResult> {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null); // only soft-delete if not already deleted

  if (error) {
    console.error(`[softDelete] ${table} id=${id} userId=${userId}:`, error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Restores a soft-deleted row by clearing `deleted_at`.
 * Useful for an "undo delete" feature or admin recovery.
 */
export async function softUndelete(
  supabase: SupabaseClient,
  table: SoftDeleteTable,
  id: string,
  userId: string
): Promise<SoftDeleteResult> {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error(`[softUndelete] ${table} id=${id} userId=${userId}:`, error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Helper to apply the standard `deleted_at IS NULL` filter to a Supabase select query.
 *
 * @example
 *   const q = supabase.from("networth_certificates").select("*").eq("user_id", userId);
 *   const { data } = await onlyLive(q);
 *
 * NOTE: TypeScript can't infer the exact builder type across versions, so callers
 * should generally just chain `.is("deleted_at", null)` directly. This helper
 * exists for readability in long query chains.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function onlyLive<T extends { is: (col: string, val: null) => any }>(query: T): ReturnType<T["is"]> {
  return query.is("deleted_at", null);
}
