import { createClient } from '@/lib/supabase/client';

// Cache signed URLs for the session (bucket:path → { url, expiresAt })
const urlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Get a signed download URL — returns cached version if still valid.
 */
export async function getSignedDownloadUrl(
  bucket: string,
  storagePath: string,
  downloadFilename?: string
): Promise<string> {
  const cacheKey = `${bucket}:${storagePath}`;
  const cached = urlCache.get(cacheKey);
  // Use cache if it has >10s remaining
  if (cached && cached.expiresAt > Date.now() + 10_000) {
    return cached.url;
  }

  const supabase = createClient();
  const filename = downloadFilename || storagePath.split('/').pop() || 'download';
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 300, { download: filename });

  if (error || !data?.signedUrl) {
    throw error || new Error('Failed to create download URL');
  }

  urlCache.set(cacheKey, { url: data.signedUrl, expiresAt: Date.now() + 300_000 });
  return data.signedUrl;
}

/**
 * Pre-warm the cache for a storage path (call on history load).
 */
export function prefetchDownloadUrl(
  bucket: string,
  storagePath: string,
  downloadFilename?: string
): void {
  getSignedDownloadUrl(bucket, storagePath, downloadFilename).catch(() => {});
}

/**
 * Instant download — uses cached signed URL if available.
 */
export async function downloadFromStorage(
  bucket: string,
  storagePath: string,
  downloadFilename?: string
): Promise<void> {
  const url = await getSignedDownloadUrl(bucket, storagePath, downloadFilename);
  window.open(url, '_blank');
}
