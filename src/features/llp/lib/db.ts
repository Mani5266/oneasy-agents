import { supabase } from "./supabase";
import type { LLPData } from "../types";

export interface LLPAgreementRecord {
  id: string;
  llpName: string;
  numPartners: number;
  step: string;
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
}

async function requireUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

export async function getAllLLPAgreements(): Promise<LLPAgreementRecord[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("llp_agreements")
    .select("id, data, step, is_done, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: Record<string, unknown>) => {
    const d = row.data as Record<string, unknown> | null;
    return {
      id: row.id as string,
      llpName: (d?.llpName as string) || "Untitled LLP",
      numPartners: (d?.numPartners as number) || 0,
      step: row.step as string,
      isDone: row.is_done as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  });
}

export async function getLLPAgreement(id: string): Promise<{ data: LLPData; step: string; isDone: boolean }> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("llp_agreements")
    .select("data, step, is_done")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return { data: data.data as LLPData, step: data.step as string, isDone: data.is_done as boolean };
}

export async function deleteLLPAgreement(id: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("llp_agreements")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
