"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { defaultData, type LLPData } from "@/features/llp/types";

const STORAGE_KEY = "llp_form_data";

interface FormContextValue {
  data: LLPData;
  setData: React.Dispatch<React.SetStateAction<LLPData>>;
  updateField: <K extends keyof LLPData>(key: K, value: LLPData[K]) => void;
  resetForm: () => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export function LLPFormProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LLPData>(() => {
    if (typeof window === "undefined") return defaultData();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaultData(), ...JSON.parse(raw) } : defaultData();
    } catch {
      return defaultData();
    }
  });

  // Persist to localStorage
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, [data]);

  const updateField = useCallback(<K extends keyof LLPData>(key: K, value: LLPData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setData(defaultData());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <FormContext.Provider value={{ data, setData, updateField, resetForm }}>
      {children}
    </FormContext.Provider>
  );
}

export function useLLPForm() {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error("useLLPForm must be used within LLPFormProvider");
  return ctx;
}
