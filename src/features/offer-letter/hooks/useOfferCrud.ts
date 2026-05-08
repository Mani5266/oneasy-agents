'use client';

import { useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { OfferRecord, OfferPayload } from '../types';

const TABLE = 'offerletter_offers';

export function useOfferCrud() {
  const supabase = createClient();

  const insertOffer = useCallback(async (params: {
    emp_name: string;
    designation: string;
    annual_ctc: number;
    payload: OfferPayload;
  }): Promise<OfferRecord> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...params, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data as OfferRecord;
  }, [supabase]);

  const updateOffer = useCallback(async (id: string, updates: Partial<OfferRecord>): Promise<OfferRecord> => {
    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as OfferRecord;
  }, [supabase]);

  const getOffers = useCallback(async (): Promise<OfferRecord[]> => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as OfferRecord[];
  }, [supabase]);

  const getOfferById = useCallback(async (id: string): Promise<OfferRecord | null> => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as OfferRecord;
  }, [supabase]);

  const deleteOffer = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }, [supabase]);

  const saveOffer = useCallback(async (params: {
    id?: string | null;
    emp_name: string;
    designation: string;
    annual_ctc: number;
    payload: OfferPayload;
  }): Promise<OfferRecord> => {
    if (params.id) {
      return updateOffer(params.id, {
        emp_name: params.emp_name,
        designation: params.designation,
        annual_ctc: params.annual_ctc,
        payload: params.payload,
      } as Partial<OfferRecord>);
    } else {
      return insertOffer({
        emp_name: params.emp_name,
        designation: params.designation,
        annual_ctc: params.annual_ctc,
        payload: params.payload,
      });
    }
  }, [insertOffer, updateOffer]);

  const downloadDoc = useCallback(async (docUrl: string, empName: string) => {
    const { data: blob, error } = await supabase.storage
      .from('offerletter-docs')
      .download(docUrl);
    if (error) throw error;
    if (!blob) throw new Error('No file returned');
    const filename = docUrl.split('/').pop() || `Offer_${empName}.docx`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  }, [supabase]);

  return { insertOffer, updateOffer, getOffers, getOfferById, deleteOffer, saveOffer, downloadDoc };
}
