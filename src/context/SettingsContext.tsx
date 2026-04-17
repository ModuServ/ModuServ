import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSync } from "./SyncContext";
import { useAuth } from "./AuthContext";
import { API_BASE, authFetch } from "../lib/api";

type Settings = {
  autoSync: boolean;
  aiSuggestions: boolean;
};

type SettingsContextType = Settings & {
  setAutoSync: (value: boolean) => void;
  setAiSuggestions: (value: boolean) => void;
  resetSettings: () => void;
};

const STORAGE_KEY = "moduserv:settings";
const AUTO_SYNC_INTERVAL_MS = 30_000;

const defaults: Settings = {
  autoSync: true,
  aiSuggestions: true,
};

function loadCached(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      autoSync: parsed.autoSync ?? defaults.autoSync,
      aiSuggestions: parsed.aiSuggestions ?? defaults.aiSuggestions,
    };
  } catch {
    return { ...defaults };
  }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { runSync } = useSync();
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(loadCached);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Fetch from backend when user logs in
  useEffect(() => {
    if (!user) return;
    authFetch(`${API_BASE}/settings`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { settings?: Partial<Settings> }) => {
        const remote = data.settings ?? (data as Partial<Settings>);
        const merged: Settings = {
          autoSync: remote.autoSync ?? defaults.autoSync,
          aiSuggestions: remote.aiSuggestions ?? defaults.aiSuggestions,
        };
        setSettings(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      })
      .catch(() => { /* backend unavailable — cached value stands */ });
  }, [user?.id]);

  // Debounced sync to backend — 800ms after last change
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(next: Settings) {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      authFetch(`${API_BASE}/settings`, {
        method: "PUT",
        body: JSON.stringify({ settings: next }),
      }).catch(() => {});
    }, 800);
  }

  const runSyncRef = useRef(runSync);
  useEffect(() => { runSyncRef.current = runSync; }, [runSync]);

  useEffect(() => {
    if (!settings.autoSync) return;
    const id = window.setInterval(() => void runSyncRef.current(), AUTO_SYNC_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [settings.autoSync]);

  const setAutoSync = useCallback((value: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, autoSync: value };
      scheduleSave(next);
      return next;
    });
  }, []);

  const setAiSuggestions = useCallback((value: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, aiSuggestions: value };
      scheduleSave(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...defaults });
    scheduleSave({ ...defaults });
  }, []);

  const value = useMemo(
    () => ({ ...settings, setAutoSync, setAiSuggestions, resetSettings }),
    [settings, setAutoSync, setAiSuggestions, resetSettings]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
