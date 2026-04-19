import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FormRecord, FormResponse, FormField, FormLocation } from "../pages/forms/formTypes";
import { useSite } from "../../context/SiteContext";
import { useAuth } from "../../context/AuthContext";
import { API_BASE, authFetch } from "../../lib/api";

const FORMS_CACHE = "moduserv:forms";
const RESPONSES_CACHE = "moduserv:form-responses";

type FormsContextType = {
  forms: FormRecord[];
  responses: FormResponse[];
  createForm: (name: string, description?: string, location?: FormLocation) => FormRecord;
  updateForm: (id: string, updates: Partial<Pick<FormRecord, "name" | "description" | "status" | "location" | "fields">>) => void;
  deleteForm: (id: string) => void;
  duplicateForm: (id: string) => FormRecord | null;
  getFormById: (id: string) => FormRecord | undefined;
  addResponse: (formId: string, values: FormResponse["values"], submittedBy: string) => void;
  deleteResponse: (id: string) => void;
  getResponsesForForm: (formId: string) => FormResponse[];
};

const FormsContext = createContext<FormsContextType | null>(null);

function loadCache<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch { return []; }
}

function getNextFormId(forms: FormRecord[]): string {
  const max = forms.reduce((h, f) => {
    const m = f.id.match(/FRM-(\d+)/i);
    if (!m) return h;
    const n = Number(m[1]);
    return n > h ? n : h;
  }, 0);
  return `FRM-${String(max + 1).padStart(3, "0")}`;
}

function getNextResponseId(responses: FormResponse[]): string {
  const max = responses.reduce((h, r) => {
    const m = r.id.match(/RES-(\d+)/i);
    if (!m) return h;
    const n = Number(m[1]);
    return n > h ? n : h;
  }, 0);
  return `RES-${String(max + 1).padStart(3, "0")}`;
}

export function FormsProvider({ children }: { children: React.ReactNode }) {
  const { selectedSiteId } = useSite();
  const { user } = useAuth();
  const [allForms, setAllForms] = useState<FormRecord[]>(() => {
    const forms = loadCache<FormRecord>(FORMS_CACHE);
    // Migrate legacy forms missing location
    return forms.map((f) => f.location ? f : { ...f, location: "system" as FormLocation });
  });
  const [allResponses, setAllResponses] = useState<FormResponse[]>(() =>
    loadCache<FormResponse>(RESPONSES_CACHE)
  );

  useEffect(() => {
    localStorage.setItem(FORMS_CACHE, JSON.stringify(allForms));
  }, [allForms]);

  useEffect(() => {
    localStorage.setItem(RESPONSES_CACHE, JSON.stringify(allResponses));
  }, [allResponses]);

  // Fetch from backend when logged in; poll every 30s to stay in sync
  useEffect(() => {
    if (!user) return;
    async function fetchFromAPI() {
      try {
        const formsRes = await authFetch(`${API_BASE}/forms?site_id=${selectedSiteId}`);
        if (formsRes.ok) {
          const remoteForms = await formsRes.json() as FormRecord[];
          if (Array.isArray(remoteForms)) {
            setAllForms(remoteForms.map((f) => f.location ? f : { ...f, location: "system" as FormLocation }));
          }
        }
      } catch { /* backend offline */ }
    }
    fetchFromAPI();
    const poll = setInterval(fetchFromAPI, 2_000);
    return () => clearInterval(poll);
  }, [user, selectedSiteId]);

  // Site-filtered view
  const forms = useMemo(
    () => allForms.filter((f) => f.siteId === selectedSiteId),
    [allForms, selectedSiteId]
  );

  function createForm(name: string, description?: string, location: FormLocation = "system"): FormRecord {
    const now = new Date().toISOString();
    const newForm: FormRecord = {
      id: getNextFormId(allForms),
      name: name.trim(),
      description: description?.trim(),
      status: "Draft",
      location,
      fields: [],
      siteId: selectedSiteId,
      createdAt: now,
      updatedAt: now,
    };
    setAllForms((prev) => [...prev, newForm]);

    // Persist to backend
    authFetch(`${API_BASE}/forms`, {
      method: "POST",
      body: JSON.stringify(newForm),
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json() as { form: FormRecord };
        setAllForms((prev) => prev.map((f) => f.id === newForm.id ? data.form : f));
      }
    }).catch(() => {});

    return newForm;
  }

  function updateForm(id: string, updates: Partial<Pick<FormRecord, "name" | "description" | "status" | "location" | "fields">>) {
    const now = new Date().toISOString();
    setAllForms((prev) =>
      prev.map((f) => f.id === id ? { ...f, ...updates, updatedAt: now } : f)
    );

    authFetch(`${API_BASE}/forms/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...updates, updatedAt: now }),
    }).catch(() => {});
  }

  function deleteForm(id: string) {
    setAllForms((prev) => prev.filter((f) => f.id !== id));
    setAllResponses((prev) => prev.filter((r) => r.formId !== id));

    authFetch(`${API_BASE}/forms/${id}`, { method: "DELETE" }).catch(() => {});
  }

  function duplicateForm(id: string): FormRecord | null {
    const source = allForms.find((f) => f.id === id);
    if (!source) return null;
    const now = new Date().toISOString();
    const copy: FormRecord = {
      ...source,
      id: getNextFormId(allForms),
      name: `Copy of ${source.name}`,
      status: "Draft",
      fields: source.fields.map((field) => ({ ...field, id: crypto.randomUUID() })),
      createdAt: now,
      updatedAt: now,
    };
    setAllForms((prev) => [...prev, copy]);

    authFetch(`${API_BASE}/forms`, {
      method: "POST",
      body: JSON.stringify(copy),
    }).catch(() => {});

    return copy;
  }

  function getFormById(id: string): FormRecord | undefined {
    return allForms.find((f) => f.id === id);
  }

  function addResponse(formId: string, values: FormResponse["values"], submittedBy: string) {
    const newResponse: FormResponse = {
      id: getNextResponseId(allResponses),
      formId,
      submittedBy,
      submittedAt: new Date().toLocaleString(),
      values,
    };
    setAllResponses((prev) => [...prev, newResponse]);

    authFetch(`${API_BASE}/forms/${formId}/responses`, {
      method: "POST",
      body: JSON.stringify(newResponse),
    }).catch(() => {});
  }

  function deleteResponse(id: string) {
    setAllResponses((prev) => prev.filter((r) => r.id !== id));
    authFetch(`${API_BASE}/form-responses/${id}`, { method: "DELETE" }).catch(() => {});
  }

  function getResponsesForForm(formId: string): FormResponse[] {
    return allResponses.filter((r) => r.formId === formId);
  }

  const value = useMemo(
    () => ({
      forms,
      responses: allResponses,
      createForm,
      updateForm,
      deleteForm,
      duplicateForm,
      getFormById,
      addResponse,
      deleteResponse,
      getResponsesForForm,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [forms, allResponses]
  );

  return <FormsContext.Provider value={value}>{children}</FormsContext.Provider>;
}

export function useForms() {
  const ctx = useContext(FormsContext);
  if (!ctx) throw new Error("useForms must be used inside FormsProvider");
  return ctx;
}

export function buildBlankField(type: FormField["type"]): FormField {
  return {
    id: crypto.randomUUID(),
    type,
    label: `New ${type} field`,
    placeholder: "",
    required: false,
    options: type === "dropdown" || type === "checkbox" ? ["Option 1", "Option 2"] : undefined,
    buttonLabel: type === "button" ? "Submit" : undefined,
    buttonAction: type === "button" ? "submit" : undefined,
  };
}
