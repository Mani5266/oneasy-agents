// ── useAadhaarOCR Hook ───────────────────────────────────────────────────────

'use client';

import { useState, useCallback } from 'react';
import { useWizardStore } from './useWizardStore';
import { getAccessToken } from '../lib/db';

interface OcrResult {
  name?: string;
  fatherName?: string;
  relation?: string;
  age?: string;
  address?: string;
}

interface OcrStatus {
  scanning: Record<number, boolean>;
  done: Record<number, boolean>;
  bulkProgress: number;
  bulkTotal: number;
  isBulkScanning: boolean;
}

async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function callOcrApi(file: File): Promise<OcrResult> {
  const { base64, mimeType } = await fileToBase64(file);
  const token = await getAccessToken();

  const res = await fetch('/api/partnership/ocr/aadhaar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ image: base64, mimeType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `OCR failed (${res.status})`);
  }

  const result = await res.json();
  return result.data as OcrResult;
}

export function useAadhaarOCR() {
  const [status, setStatus] = useState<OcrStatus>({
    scanning: {},
    done: {},
    bulkProgress: 0,
    bulkTotal: 0,
    isBulkScanning: false,
  });

  const scanSingle = useCallback(
    async (
      file: File,
      partnerIndex: number
    ): Promise<{ extracted: OcrResult; missing: string[] } | null> => {
      setStatus((prev) => ({
        ...prev,
        scanning: { ...prev.scanning, [partnerIndex]: true },
        done: { ...prev.done, [partnerIndex]: false },
      }));

      try {
        const extracted = await callOcrApi(file);

        const updates: Record<string, string | number | boolean> = {};
        const missing: string[] = [];

        if (extracted.name) {
          updates.name = extracted.name;
        } else {
          missing.push('Name');
        }
        if (extracted.fatherName) {
          updates.fatherName = extracted.fatherName;
        } else {
          missing.push("Father's Name");
        }
        if (extracted.relation) {
          updates.relation = extracted.relation;
        }
        if (extracted.age) {
          updates.age = extracted.age;
        } else {
          missing.push('Age');
        }
        if (extracted.address) {
          updates.address = extracted.address;
        } else {
          missing.push('Address');
        }

        useWizardStore.getState().updatePartner(partnerIndex, updates);

        setStatus((prev) => ({
          ...prev,
          scanning: { ...prev.scanning, [partnerIndex]: false },
          done: { ...prev.done, [partnerIndex]: true },
        }));

        return { extracted, missing };
      } catch (err) {
        console.error(`[OCR] Partner ${partnerIndex} scan failed:`, err);
        setStatus((prev) => ({
          ...prev,
          scanning: { ...prev.scanning, [partnerIndex]: false },
        }));
        return null;
      }
    },
    []
  );

  const scanBulk = useCallback(
    async (
      files: File[]
    ): Promise<{
      success: number;
      failed: number;
      results: Array<{ index: number; result: OcrResult | null; missing: string[] }>;
    }> => {
      const { partners, setPartnerCount } = useWizardStore.getState();

      if (files.length > partners.length) {
        setPartnerCount(files.length);
      }

      setStatus((prev) => ({
        ...prev,
        bulkProgress: 0,
        bulkTotal: files.length,
        isBulkScanning: true,
      }));

      let success = 0;
      let failed = 0;
      const results: Array<{
        index: number;
        result: OcrResult | null;
        missing: string[];
      }> = [];

      for (let i = 0; i < files.length; i++) {
        const result = await scanSingle(files[i]!, i);
        if (result) {
          success++;
          results.push({ index: i, result: result.extracted, missing: result.missing });
        } else {
          failed++;
          results.push({ index: i, result: null, missing: [] });
        }
        setStatus((prev) => ({
          ...prev,
          bulkProgress: i + 1,
        }));
      }

      setStatus((prev) => ({
        ...prev,
        isBulkScanning: false,
      }));

      return { success, failed, results };
    },
    [scanSingle]
  );

  const resetPartnerOcr = useCallback((index: number) => {
    setStatus((prev) => ({
      ...prev,
      scanning: { ...prev.scanning, [index]: false },
      done: { ...prev.done, [index]: false },
    }));
  }, []);

  return {
    ...status,
    scanSingle,
    scanBulk,
    resetPartnerOcr,
  };
}
