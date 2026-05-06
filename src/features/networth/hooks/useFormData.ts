import { useState, useCallback, useEffect, useRef } from "react";
import type { FormData, AnnexureRow, UploadedDoc } from "../types";
import { uploadDocument, deleteDocument } from "../lib/db";

const FORM_STORAGE_KEY = "networth_form_data";
const FIRM_STORAGE_KEY = "networth_firm_details";

const FIRM_FIELDS = ["firmName", "firmFRN", "signatoryName", "signatoryTitle", "membershipNo", "signPlace"] as const;
type FirmField = typeof FIRM_FIELDS[number];

export const INITIAL_STATE: FormData = {
  purpose: "",
  country: "",
  certDate: new Date().toISOString().split("T")[0] ?? "",
  exchangeRate: "",
  salutation: "Mr.",
  fullName: "",
  passportNumber: "",
  udin: "",
  assessmentYear: "",
  incomeTypes: [],
  incomeLabels: {},
  incomeRows: [],
  incomeFR: [],
  incomeDocs: {},
  immovableDocs: {},
  movableDocs: {},
  savingsDocs: {},
  immovableTypes: [],
  immovableLabels: {},
  immovableProperties: {},
  immovableRows: [],
  immovableFR: [],
  propertyAddress: "",
  movableTypes: [],
  movableLabels: {},
  movableAssets: {},
  movableRows: [],
  movableFR: [],
  goldGrams: "",
  goldKarat: "22K",
  goldPriceOverride: "",
  savingsTypes: [],
  savingsLabels: {},
  savingsEntries: {},
  savingsRows: null,
  savingsFR: [],
  bankDetails: "",
  policies: [""],
  supportingDocs: [],
  otherSupportingDocs: [],
  firmName: "",
  firmType: "",
  firmFRN: "",
  signatoryName: "",
  signatoryTitle: "",
  membershipNo: "",
  signPlace: "",
};

export const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  0: ["purpose", "country", "certDate", "exchangeRate"],
  1: ["salutation", "fullName", "passportNumber", "udin"],
  2: ["assessmentYear", "incomeTypes", "incomeLabels", "incomeRows", "incomeFR", "incomeDocs"],
  3: ["immovableTypes", "immovableLabels", "immovableProperties", "immovableRows", "immovableFR", "immovableDocs", "propertyAddress"],
  4: ["movableTypes", "movableLabels", "movableAssets", "movableRows", "movableFR", "movableDocs", "goldGrams", "goldKarat", "goldPriceOverride"],
  5: ["savingsTypes", "savingsLabels", "savingsEntries", "savingsRows", "savingsFR", "savingsDocs", "bankDetails", "policies", "supportingDocs", "otherSupportingDocs"],
  6: ["firmName", "firmType", "firmFRN", "signatoryName", "signatoryTitle", "membershipNo", "signPlace"],
};

export function getStepDefaults(stepIndex: number): Partial<FormData> {
  const fields = STEP_FIELDS[stepIndex];
  if (!fields) return {};
  const defaults: Partial<FormData> = {};
  for (const key of fields) {
    (defaults as Record<string, unknown>)[key] = INITIAL_STATE[key];
  }
  return defaults;
}

function loadFormFromStorage(): FormData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FORM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && "purpose" in parsed) {
      return { ...INITIAL_STATE, ...parsed } as FormData;
    }
  } catch {
    // Corrupted data
  }
  return null;
}

const DOC_FIELDS = ["incomeDocs", "immovableDocs", "movableDocs", "savingsDocs"] as const;

function saveFormToStorage(data: FormData): void {
  try {
    const cleaned = { ...data };
    for (const field of DOC_FIELDS) {
      const docMap = cleaned[field] as Record<string, UploadedDoc[]>;
      const stripped: Record<string, UploadedDoc[]> = {};
      for (const [key, docs] of Object.entries(docMap)) {
        stripped[key] = docs.map(({ name, size, path, documentId }) => ({
          name, size, path: path ?? "", documentId: documentId ?? "",
        }));
      }
      (cleaned as Record<string, unknown>)[field] = stripped;
    }
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    // Storage full
  }
}

function loadFirmProfile(): Partial<Record<FirmField, string>> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FIRM_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveFirmProfile(data: FormData): void {
  try {
    const profile: Partial<Record<FirmField, string>> = {};
    for (const key of FIRM_FIELDS) {
      profile[key] = data[key] as string;
    }
    localStorage.setItem(FIRM_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function useFormData() {
  const [data, setData] = useState<FormData>(INITIAL_STATE);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const saved = loadFormFromStorage();
    const firmProfile = loadFirmProfile();

    let merged = saved ?? INITIAL_STATE;

    if (firmProfile) {
      const updates: Partial<FormData> = {};
      for (const key of FIRM_FIELDS) {
        if (!merged[key] && firmProfile[key]) {
          (updates as Record<string, string>)[key] = firmProfile[key]!;
        }
      }
      if (Object.keys(updates).length > 0) {
        merged = { ...merged, ...updates };
      }
    }

    if (saved || firmProfile) {
      setData(merged);
    }
    isFirstRender.current = false;
  }, []);

  useEffect(() => {
    if (isFirstRender.current) return;
    saveFormToStorage(data);
    saveFirmProfile(data);
  }, [data]);

  const resetStep = useCallback((stepIndex: number) => {
    const defaults = getStepDefaults(stepIndex);

    setData((prev) => {
      const docFieldMap: Record<number, "incomeDocs" | "immovableDocs" | "movableDocs" | "savingsDocs"> = {
        2: "incomeDocs",
        3: "immovableDocs",
        4: "movableDocs",
        5: "savingsDocs",
      };
      const docField = docFieldMap[stepIndex];
      if (docField) {
        const docMap = prev[docField] as Record<string, UploadedDoc[]>;
        for (const docs of Object.values(docMap)) {
          for (const doc of docs) {
            if (doc.documentId && doc.path) {
              deleteDocument(doc.documentId).catch((err) =>
                console.error("Failed to delete document on step reset:", err)
              );
            }
          }
        }
      }

      return { ...prev, ...defaults };
    });
  }, []);

  const updateField = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleArrayItem = useCallback(
    (field: "incomeTypes" | "immovableTypes" | "movableTypes" | "savingsTypes" | "supportingDocs") =>
      (item: string) => {
        setData((prev) => {
          const arr = prev[field] as string[];
          const next = arr.includes(item)
            ? arr.filter((x) => x !== item)
            : [...arr, item];
          return { ...prev, [field]: next };
        });
      },
    []
  );

  const ALL_LABEL_FIELDS = ["incomeLabels", "immovableLabels", "movableLabels", "savingsLabels"] as const;

  const updateLabel = useCallback(
    (_field: "incomeLabels" | "immovableLabels" | "movableLabels" | "savingsLabels") =>
      (type: string, value: string) => {
        setData((prev) => {
          const next = { ...prev };
          for (const lf of ALL_LABEL_FIELDS) {
            next[lf] = { ...(prev[lf] as Record<string, string>), [type]: value };
          }
          return next;
        });
      },
    []
  );

  const updateAnnexureRow = useCallback(
    (field: "incomeRows" | "immovableRows" | "movableRows") =>
      (index: number, value: string) => {
        setData((prev) => {
          const rows = [...prev[field]];
          const existing = rows[index];
          if (existing) {
            rows[index] = { ...existing, inr: value };
          }
          return { ...prev, [field]: rows };
        });
      },
    []
  );

  const updateForeignRow = useCallback(
    (field: "incomeFR" | "immovableFR" | "movableFR" | "savingsFR") =>
      (index: number, value: string) => {
        setData((prev) => {
          const rows = [...prev[field]];
          rows[index] = value;
          return { ...prev, [field]: rows };
        });
      },
    []
  );

  const addDocs = useCallback((field: "incomeDocs" | "immovableDocs" | "movableDocs" | "savingsDocs") => 
    async (type: string, files: File[], certificateId?: string) => {
      if (!certificateId) {
        console.error("Cannot upload document: no certificateId yet");
        return;
      }
      const annexureType = field.replace("Docs", "");
      for (const file of files) {
        try {
          const { path, documentId } = await uploadDocument(certificateId, annexureType, type, file);
          const doc: UploadedDoc = { name: file.name, size: file.size, path, documentId };
          setData((prev) => {
            const existing = (prev[field] as Record<string, UploadedDoc[]>)[type] ?? [];
            return {
              ...prev,
              [field]: {
                ...(prev[field] as Record<string, UploadedDoc[]>),
                [type]: [...existing, doc],
              },
            };
          });
        } catch (err) {
          console.error("Document upload failed:", err);
        }
      }
    }, []);

  const removeDoc = useCallback((field: "incomeDocs" | "immovableDocs" | "movableDocs" | "savingsDocs") => 
    (type: string, index: number) => {
      setData((prev) => {
        const existing = [...((prev[field] as Record<string, UploadedDoc[]>)[type] ?? [])];
        const removed = existing[index];
        existing.splice(index, 1);

        if (removed?.documentId && removed?.path) {
          deleteDocument(removed.documentId).catch((err) =>
            console.error("Failed to delete document from storage:", err)
          );
        }

        return {
          ...prev,
          [field]: { ...(prev[field] as Record<string, UploadedDoc[]>), [type]: existing },
        };
      });
    }, []);

  const addIncomeDocs = addDocs("incomeDocs");
  const removeIncomeDoc = removeDoc("incomeDocs");
  const addImmovableDocs = addDocs("immovableDocs");
  const removeImmovableDoc = removeDoc("immovableDocs");
  const addMovableDocs = addDocs("movableDocs");
  const removeMovableDoc = removeDoc("movableDocs");
  const addSavingsDocs = addDocs("savingsDocs");
  const removeSavingsDoc = removeDoc("savingsDocs");

  return {
    data,
    setData,
    updateField,
    toggleArrayItem,
    updateLabel,
    updateAnnexureRow,
    updateForeignRow,
    resetStep,
    addIncomeDocs,
    removeIncomeDoc,
    addImmovableDocs,
    removeImmovableDoc,
    addMovableDocs,
    removeMovableDoc,
    addSavingsDocs,
    removeSavingsDoc,
  };
}
