import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { API_BASE, authFetch } from "../lib/api";

export type SiteOption = {
  id: string;
  name: string;
};

const LOCATIONS_KEY   = "moduserv:locations";
const SELECTED_SITE_KEY = "moduserv:selectedSiteId";

const DEFAULT_SITES: SiteOption[] = [
  { id: "site-1", name: "Downtown Store" },
  { id: "site-2", name: "North Branch" },
  { id: "site-3", name: "East Location" },
];

function loadCached(): SiteOption[] {
  try {
    const raw = localStorage.getItem(LOCATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SiteOption[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_SITES;
}

function cache(sites: SiteOption[]) {
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(sites));
}

type SiteContextType = {
  sites: SiteOption[];
  selectedSiteId: string;
  selectedSite: SiteOption;
  setSelectedSiteId: (siteId: string) => void;
  addSite: (name: string) => Promise<SiteOption>;
  renameSite: (id: string, name: string) => Promise<void>;
  deleteSite: (id: string) => Promise<void>;
};

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<SiteOption[]>(loadCached);

  const [selectedSiteId, setSelectedSiteIdState] = useState<string>(() => {
    return localStorage.getItem(SELECTED_SITE_KEY) || "site-1";
  });

  // Fetch from backend on mount; use cached sites as the immediate value
  useEffect(() => {
    authFetch(`${API_BASE}/locations`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Array<{ id: string; name: string }>) => {
        const loaded: SiteOption[] = data.map((d) => ({ id: d.id, name: d.name }));
        setSites(loaded);
        cache(loaded);
      })
      .catch(() => {
        // backend unavailable — stay on cached sites
      });
  }, []);

  useEffect(() => {
    localStorage.setItem(SELECTED_SITE_KEY, selectedSiteId);
  }, [selectedSiteId]);

  const selectedSite = useMemo(
    () => sites.find((s) => s.id === selectedSiteId) ?? sites[0],
    [sites, selectedSiteId]
  );

  function setSelectedSiteId(siteId: string) {
    setSelectedSiteIdState(siteId);
  }

  async function addSite(name: string): Promise<SiteOption> {
    const tempId = `site-${Date.now()}`;
    const optimistic: SiteOption = { id: tempId, name: name.trim() };
    setSites((prev) => {
      const updated = [...prev, optimistic];
      cache(updated);
      return updated;
    });

    try {
      const res = await authFetch(`${API_BASE}/locations`, {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        const created = await res.json() as { id: string; name: string };
        const server: SiteOption = { id: created.id, name: created.name };
        setSites((prev) => {
          const updated = prev.map((s) => (s.id === tempId ? server : s));
          cache(updated);
          return updated;
        });
        return server;
      }
    } catch { /* offline — keep optimistic */ }

    return optimistic;
  }

  async function renameSite(id: string, name: string): Promise<void> {
    setSites((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, name: name.trim() } : s));
      cache(updated);
      return updated;
    });
    try {
      await authFetch(`${API_BASE}/locations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: name.trim() }),
      });
    } catch { /* offline — optimistic update persisted in localStorage */ }
  }

  async function deleteSite(id: string): Promise<void> {
    setSites((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      cache(updated);
      return updated;
    });
    if (selectedSiteId === id) {
      const fallback = sites.find((s) => s.id !== id);
      setSelectedSiteIdState(fallback?.id ?? "");
    }
    try {
      await authFetch(`${API_BASE}/locations/${id}`, { method: "DELETE" });
    } catch { /* offline — optimistic update persisted in localStorage */ }
  }

  return (
    <SiteContext.Provider
      value={{
        sites,
        selectedSiteId,
        selectedSite,
        setSelectedSiteId,
        addSite,
        renameSite,
        deleteSite,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) throw new Error("useSite must be used inside SiteProvider");
  return context;
}
