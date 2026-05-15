// ── useAutoSave Hook ─────────────────────────────────────────────────────────

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useWizardStore } from './useWizardStore';
import { dbSaveDeed } from '../lib/db';

const SAVE_DEBOUNCE_MS = 800;

interface UseAutoSaveOptions {
  onSaved?: (deedId: string) => void;
}

export function useAutoSave(options?: UseAutoSaveOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const debouncedSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const state = useWizardStore.getState();
      if (!state._dirty || savingRef.current) return;

      const payload = state.getPayload();
      const hasName = payload.businessName && payload.businessName !== 'Untitled';
      const hasPartnerNames = payload.partners?.some((p) => p.name.trim());
      if (!hasName && !hasPartnerNames && !state.currentDeedId) return;

      savingRef.current = true;
      setSaving(true);
      try {
        const saved = await dbSaveDeed({
          id: state.currentDeedId,
          business_name: payload.businessName || 'Untitled',
          partner1_name: payload.partners?.[0]?.name || '',
          partner2_name: payload.partners?.[1]?.name || '',
          payload,
        });

        if (!state.currentDeedId && saved.id) {
          useWizardStore.getState().setCurrentDeedId(saved.id);
        }

        useWizardStore.getState().markClean();
        options?.onSaved?.(saved.id);
      } catch (err) {
        console.warn('[AutoSave] Server save failed:', err);
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    }, SAVE_DEBOUNCE_MS);
  }, [options]);

  useEffect(() => {
    let prevDirty = useWizardStore.getState()._dirty;
    const unsub = useWizardStore.subscribe((state) => {
      if (state._dirty && !prevDirty) {
        debouncedSave();
      }
      prevDirty = state._dirty;
    });
    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [debouncedSave]);

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const state = useWizardStore.getState();
    const payload = state.getPayload();

    try {
      const saved = await dbSaveDeed({
        id: state.currentDeedId,
        business_name: payload.businessName || 'Untitled',
        partner1_name: payload.partners?.[0]?.name || '',
        partner2_name: payload.partners?.[1]?.name || '',
        payload,
      });

      if (!state.currentDeedId && saved.id) {
        useWizardStore.getState().setCurrentDeedId(saved.id);
      }
      useWizardStore.getState().markClean();
      return saved;
    } catch (err) {
      console.warn('[AutoSave] Immediate save failed:', err);
      throw err;
    }
  }, []);

  return { saveNow, saving };
}
