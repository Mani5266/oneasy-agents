// ── useDeedActions Hook ──────────────────────────────────────────────────────

'use client';

import { useCallback } from 'react';
import { useWizardStore } from './useWizardStore';
import { dbSaveDeed, dbDeleteDeed, dbGetDeedById } from '../lib/db';
import { supabase } from '../lib/supabase';

interface UseDeedActionsOptions {
  onRefresh?: () => void;
}

export function useDeedActions(options?: UseDeedActionsOptions) {
  const refresh = options?.onRefresh;

  const editDeed = useCallback(
    async (id: string) => {
      try {
        const deed = await dbGetDeedById(id);
        if (!deed) throw new Error('Deed not found');

        useWizardStore.getState().restoreFromDeed({
          id: deed.id,
          payload: deed.payload,
          business_name: deed.business_name,
        });
      } catch (err) {
        console.error('[DeedActions] Edit failed:', err);
        throw err;
      }
    },
    []
  );

  const duplicateDeed = useCallback(
    async (id: string) => {
      try {
        const deed = await dbGetDeedById(id);
        if (!deed) throw new Error('Deed not found');

        const copiedPayload = { ...deed.payload };
        copiedPayload.businessName = `${deed.payload.businessName || deed.business_name} (Copy)`;

        const saved = await dbSaveDeed({
          id: null,
          business_name: copiedPayload.businessName,
          partner1_name: copiedPayload.partners?.[0]?.name || deed.partner1_name || '',
          partner2_name: copiedPayload.partners?.[1]?.name || deed.partner2_name || '',
          payload: copiedPayload,
        });

        useWizardStore.getState().restoreFromDeed({
          id: saved.id,
          payload: copiedPayload,
          business_name: copiedPayload.businessName,
        });

        refresh?.();
        return saved;
      } catch (err) {
        console.error('[DeedActions] Duplicate failed:', err);
        throw err;
      }
    },
    [refresh]
  );

  const deleteDeed = useCallback(
    async (id: string) => {
      try {
        await dbDeleteDeed(id);

        const { currentDeedId, resetForm } = useWizardStore.getState();
        if (currentDeedId === id) {
          resetForm();
        }

        refresh?.();
      } catch (err) {
        console.error('[DeedActions] Delete failed:', err);
        throw err;
      }
    },
    [refresh]
  );

  const regenerateDeed = useCallback(
    async (id: string) => {
      try {
        const deed = await dbGetDeedById(id);
        if (!deed) throw new Error('Deed not found');

        useWizardStore.getState().restoreFromDeed({
          id: deed.id,
          payload: deed.payload,
          business_name: deed.business_name,
        });
        useWizardStore.getState().goToStep(3);
      } catch (err) {
        console.error('[DeedActions] Regenerate failed:', err);
        throw err;
      }
    },
    []
  );

  const downloadDocument = useCallback(
    async (storagePath: string, fileName?: string) => {
      try {
        const { data, error } = await supabase.storage
          .from('partnership-docs')
          .download(storagePath);

        if (error) throw error;
        if (!data) throw new Error('No data returned');

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || storagePath.split('/').pop() || 'document.docx';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          URL.revokeObjectURL(url);
          a.remove();
        }, 150);
      } catch (err) {
        console.error('[DeedActions] Download failed:', err);
        throw err;
      }
    },
    []
  );

  const resetForm = useCallback(() => {
    useWizardStore.getState().resetForm();
    refresh?.();
  }, [refresh]);

  return {
    editDeed,
    duplicateDeed,
    deleteDeed,
    regenerateDeed,
    downloadDocument,
    resetForm,
  };
}
