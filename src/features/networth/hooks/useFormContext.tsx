"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import type { FormData, UploadedDoc, AuditEntry } from "../types";
import type { CurrencyInfo } from "../constants";
import { DEFAULT_CURRENCY } from "../constants";
import { useFormData as useFormDataHook } from "./useFormData";
import { useExchangeRate } from "./useExchangeRate";
import { useAuditTrail } from "./useAuditTrail";
import { isForeignPurpose, getCurrencyInfo } from "../lib/utils";

// ─── Context Shape ───────────────────────────────────────────────────────────

export interface FormDataContextValue {
  data: FormData;
  setData: React.Dispatch<React.SetStateAction<FormData>>;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  toggleArrayItem: (
    field: "incomeTypes" | "immovableTypes" | "movableTypes" | "savingsTypes" | "supportingDocs"
  ) => (item: string) => void;
  updateLabel: (
    field: "incomeLabels" | "immovableLabels" | "movableLabels" | "savingsLabels"
  ) => (type: string, value: string) => void;
  updateAnnexureRow: (
    field: "incomeRows" | "immovableRows" | "movableRows"
  ) => (index: number, value: string) => void;
  updateForeignRow: (
    field: "incomeFR" | "immovableFR" | "movableFR" | "savingsFR"
  ) => (index: number, value: string) => void;
  resetStep: (stepIndex: number) => void;
  addIncomeDocs: (type: string, files: File[], certificateId?: string) => void;
  removeIncomeDoc: (type: string, index: number) => void;
  addImmovableDocs: (type: string, files: File[], certificateId?: string) => void;
  removeImmovableDoc: (type: string, index: number) => void;
  addMovableDocs: (type: string, files: File[], certificateId?: string) => void;
  removeMovableDoc: (type: string, index: number) => void;
  addSavingsDocs: (type: string, files: File[], certificateId?: string) => void;
  removeSavingsDoc: (type: string, index: number) => void;
  isForeign: boolean;
  foreignRate: number | null;
  liveExchangeRate: number | null;
  exchangeRateLoading: boolean;
  currencyInfo: CurrencyInfo;
  usdRate: number | null;
  auditEntries: AuditEntry[];
  clearAudit: () => void;
}

const FormDataContext = createContext<FormDataContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

interface FormDataProviderProps {
  children: React.ReactNode;
}

export function FormDataProvider({ children }: FormDataProviderProps) {
  const form = useFormDataHook();
  const { auditEntries, recordChanges, clearAudit, setBaseline } = useAuditTrail();

  const isForeign = isForeignPurpose(form.data.purpose);
  const currencyInfo = form.data.country ? getCurrencyInfo(form.data.country) : DEFAULT_CURRENCY;

  const { rate: liveRate, loading: rateLoading } = useExchangeRate(currencyInfo);

  const overrideRate = form.data.exchangeRate ? parseFloat(form.data.exchangeRate) : null;
  const foreignRate = overrideRate && overrideRate > 0 ? overrideRate : liveRate;

  const stepRef = useRef(0);

  useEffect(() => {
    recordChanges(form.data, stepRef.current);
  }, [form.data, recordChanges]);

  const originalSetData = form.setData;
  const wrappedSetData: React.Dispatch<React.SetStateAction<FormData>> = useMemo(
    () => (action) => {
      originalSetData((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        const isFullReplace =
          prev.purpose !== next.purpose &&
          prev.fullName !== next.fullName &&
          prev.passportNumber !== next.passportNumber;
        if (isFullReplace) {
          setBaseline(next);
        }
        return next;
      });
    },
    [originalSetData, setBaseline]
  );

  const value = useMemo<FormDataContextValue>(
    () => ({
      ...form,
      setData: wrappedSetData,
      isForeign,
      foreignRate,
      liveExchangeRate: liveRate,
      exchangeRateLoading: rateLoading,
      currencyInfo,
      usdRate: foreignRate,
      auditEntries,
      clearAudit,
    }),
    [form, wrappedSetData, isForeign, foreignRate, liveRate, rateLoading, currencyInfo, auditEntries, clearAudit]
  );

  return (
    <FormDataContext.Provider value={value}>
      {children}
    </FormDataContext.Provider>
  );
}

// ─── Consumer Hook ───────────────────────────────────────────────────────────

export function useFormContext(): FormDataContextValue {
  const ctx = useContext(FormDataContext);
  if (!ctx) {
    throw new Error("useFormContext must be used within a <FormDataProvider>");
  }
  return ctx;
}
