import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuditAction, AuditEntityType, AuditEntry } from "../data/audit";
import { API_BASE, authFetch } from "../lib/api";
import { useAuth } from "./AuthContext";

type LogOptions = { entityType?: AuditEntityType; createdBy?: string };

type AuditContextType = {
  entries: AuditEntry[];
  logEvent: (recordId: string, action: AuditAction, message: string, options?: LogOptions) => void;
  getEntriesForJob: (jobId: string) => AuditEntry[];
  resetAudit: () => void;
};

const AuditContext = createContext<AuditContextType | undefined>(undefined);
const STORAGE_KEY = "moduserv.audit";

function loadAudit(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AuditEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function AuditProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>(() => loadAudit());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  // Fetch from backend when logged in; poll every 30s so entries stay in sync
  useEffect(() => {
    if (!user) return;
    async function fetchFromAPI() {
      try {
        const res = await authFetch(`${API_BASE}/audit`);
        if (!res.ok) return;
        const data = await res.json() as AuditEntry[];
        if (Array.isArray(data) && data.length > 0) {
          setEntries(data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      } catch { /* backend offline */ }
    }
    fetchFromAPI();
    const poll = setInterval(fetchFromAPI, 2_000);
    return () => clearInterval(poll);
  }, [user]);

  const logEvent = (recordId: string, action: AuditAction, message: string, options?: LogOptions) => {
    const entry: AuditEntry = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      jobId: recordId,
      action,
      message,
      createdAt: new Date().toISOString(),
      ...(options?.entityType ? { entityType: options.entityType } : {}),
      ...(options?.createdBy ? { createdBy: options.createdBy } : {}),
    };
    setEntries((prev) => [entry, ...prev]);

    // Persist to backend
    authFetch(`${API_BASE}/audit`, {
      method: "POST",
      body: JSON.stringify(entry),
    }).catch(() => {});
  };

  const getEntriesForJob = (jobId: string) =>
    entries.filter((entry) => entry.jobId === jobId);

  const resetAudit = () => {
    setEntries([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    authFetch(`${API_BASE}/audit`, { method: "DELETE" }).catch(() => {});
  };

  const value = useMemo(
    () => ({ entries, logEvent, getEntriesForJob, resetAudit }),
    [entries]
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

export function useAudit() {
  const context = useContext(AuditContext);
  if (!context) throw new Error("useAudit must be used within an AuditProvider");
  return context;
}
