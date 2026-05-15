import { supabase } from "./supabase";
import { FormDataSchema } from "./schemas";
import { INITIAL_STATE } from "../hooks/useFormData";
import { logAudit, snapshotVersion } from "./audit";
import type { FormData, CertificateRecord, DocumentRecord } from "../types";

async function requireUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

function parseFormData(raw: unknown): FormData {
  const result = FormDataSchema.safeParse(raw);
  if (result.success) return result.data;
  const merged = { ...INITIAL_STATE, ...(raw as Record<string, unknown>) };
  return merged as FormData;
}

export async function saveCertificateDraft(formData: FormData): Promise<string> {
  const userId = await requireUserId();

  // Use placeholder values for client if applicant info not yet filled
  const clientName = formData.fullName || "Draft";
  const clientPan = formData.passportNumber?.toUpperCase() || `DRAFT_${Date.now()}`;

  const { data: client, error: clientError } = await supabase
    .from("networth_clients")
    .upsert({
      full_name: clientName,
      salutation: formData.salutation || "",
      pan_number: clientPan,
      user_id: userId,
    }, { onConflict: 'user_id,pan_number' })
    .select()
    .single();

  if (clientError) throw clientError;

  const { data: cert, error: certError } = await supabase
    .from("networth_certificates")
    .insert({
      client_id: client.id,
      purpose: formData.purpose || "draft",
      country: formData.country || null,
      cert_date: formData.certDate || null,
      udin: formData.udin || null,
      nickname: formData.nickname || formData.purpose || "Untitled",
      status: "draft",
      form_data: formData as unknown as Record<string, unknown>,
      user_id: userId,
    })
    .select()
    .single();

  if (certError) throw certError;

  logAudit(userId, "create", "certificate", cert.id, null, formData as unknown as Record<string, unknown>);

  return cert.id;
}

export async function updateCertificateDraft(id: string, formData: FormData): Promise<boolean> {
  const userId = await requireUserId();

  // First verify the certificate exists
  const { data: oldCert } = await supabase
    .from("networth_certificates")
    .select("form_data, client_id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  // Certificate doesn't exist — signal caller to create a new one
  if (!oldCert) return false;

  snapshotVersion(userId, id, oldCert.form_data as Record<string, unknown>);

  // Update client record if applicant info is now available
  if (formData.fullName && formData.passportNumber && oldCert.client_id) {
    await supabase
      .from("networth_clients")
      .update({
        full_name: formData.fullName,
        salutation: formData.salutation || "",
        pan_number: formData.passportNumber.toUpperCase(),
      })
      .eq("id", oldCert.client_id)
      .eq("user_id", userId);
  }

  // Build nickname: "Purpose - Name" when both are available
  const purposeLabel = formData.purpose
    ? formData.purpose.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "";
  const nickname = formData.fullName
    ? `${purposeLabel} - ${formData.fullName}`.trim()
    : formData.nickname || purposeLabel;

  const { error } = await supabase
    .from("networth_certificates")
    .update({
      form_data: formData as unknown as Record<string, unknown>,
      nickname,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;

  logAudit(
    userId,
    "update",
    "certificate",
    id,
    oldCert?.form_data as Record<string, unknown> ?? null,
    formData as unknown as Record<string, unknown>
  );

  return true;
}

export async function getCertificate(id: string): Promise<FormData> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("networth_certificates")
    .select("form_data")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return parseFormData(data.form_data);
}

export async function getAllCertificates(): Promise<CertificateRecord[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("networth_certificates")
    .select(`
      id,
      purpose,
      nickname,
      cert_date,
      status,
      created_at,
      networth_clients (
        full_name
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((item: Record<string, unknown>) => ({
    id: item.id as string,
    clientName: (item.networth_clients as Record<string, unknown> | null)?.full_name as string || "Unknown",
    nickname: item.nickname as string | undefined,
    purpose: item.purpose as string,
    certDate: item.cert_date as string,
    status: item.status as "draft" | "completed",
    createdAt: item.created_at as string,
  }));
}

export async function renameCertificate(id: string, newName: string): Promise<void> {
  const userId = await requireUserId();
  const { data: cert, error: fetchError } = await supabase
    .from("networth_certificates")
    .select("form_data")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError) throw fetchError;

  const oldFormData = cert.form_data as Record<string, unknown>;
  snapshotVersion(userId, id, oldFormData);

  const updatedFormData = { ...oldFormData, nickname: newName };

  const { error: updateError } = await supabase
    .from("networth_certificates")
    .update({
      nickname: newName,
      form_data: updatedFormData,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (updateError) throw updateError;

  logAudit(userId, "rename", "certificate", id, oldFormData, updatedFormData);
}

const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export async function uploadDocument(
  certificateId: string,
  annexureType: string,
  category: string,
  file: File
): Promise<{ path: string; documentId: string }> {
  const userId = await requireUserId();

  if (file.size > UPLOAD_MAX_BYTES) {
    throw new Error("File too large (max 5 MB).");
  }
  if (!UPLOAD_ALLOWED_TYPES.has(file.type)) {
    throw new Error("Invalid file type. Accepted: PDF, JPEG, PNG, WebP.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const filePath = `${userId}/${certificateId}/${annexureType}/${category}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("networth-documents")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: row, error: dbError } = await supabase.from("networth_documents").insert({
    certificate_id: certificateId,
    annexure_type: annexureType,
    category: category,
    file_url: filePath,
    file_name: file.name,
    file_type: file.type,
    user_id: userId,
  }).select("id").single();

  if (dbError) {
    await supabase.storage.from("networth-documents").remove([filePath]).catch(() => {});
    throw dbError;
  }

  return { path: filePath, documentId: row.id };
}

export async function deleteDocument(documentId: string): Promise<void> {
  const userId = await requireUserId();

  const { data: doc, error: lookupError } = await supabase
    .from("networth_documents")
    .select("file_url")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();

  if (lookupError || !doc) {
    throw new Error("Document not found or access denied.");
  }

  const { error: dbError } = await supabase
    .from("networth_documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", userId);

  if (dbError) throw dbError;

  const { error: storageError } = await supabase.storage
    .from("networth-documents")
    .remove([doc.file_url]);

  if (storageError) {
    console.error("Failed to delete storage file (orphaned):", storageError);
  }
}

export async function getDocuments(certificateId: string): Promise<DocumentRecord[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("networth_documents")
    .select("*")
    .eq("certificate_id", certificateId)
    .eq("user_id", userId);

  if (error) throw error;

  const paths = data.map((doc) => doc.file_url);
  let signedUrlMap: Record<string, string> = {};

  if (paths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("networth-documents")
      .createSignedUrls(paths, 300);

    if (signedUrls) {
      for (const item of signedUrls) {
        if (item.signedUrl && item.path) {
          signedUrlMap[item.path] = item.signedUrl;
        }
      }
    }
  }

  return data.map((doc: Record<string, unknown>) => ({
    id: doc.id as string,
    certificateId: doc.certificate_id as string,
    annexureType: doc.annexure_type as string,
    category: doc.category as string,
    fileUrl: signedUrlMap[doc.file_url as string] || "",
    fileName: doc.file_name as string,
    fileType: doc.file_type as string,
    uploadedAt: doc.uploaded_at as string,
  }));
}

export async function deleteCertificate(id: string): Promise<void> {
  const userId = await requireUserId();

  const { data: docs } = await supabase
    .from("networth_documents")
    .select("file_url")
    .eq("certificate_id", id)
    .eq("user_id", userId);

  const { data: cert } = await supabase
    .from("networth_certificates")
    .select("form_data")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  const { error } = await supabase
    .from("networth_certificates")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;

  logAudit(
    userId,
    "delete",
    "certificate",
    id,
    cert?.form_data as Record<string, unknown> ?? null,
    null
  );

  if (docs && docs.length > 0) {
    const paths = docs.map(d => d.file_url);
    const { error: storageErr } = await supabase.storage.from("networth-documents").remove(paths);
    if (storageErr) {
      console.error("Storage cleanup failed (orphaned files are harmless):", storageErr);
    }
  }
}
