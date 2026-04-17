import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SyncQueueItem } from "../data/sync";
import { API_BASE, authFetch } from "../lib/api";

type SyncContextType = {
  queue: SyncQueueItem[];
  addToQueue: (
    entityType: "job" | "appointment" | "customer",
    entityId: string,
    operation: "create" | "update",
    payload: unknown
  ) => void;
  runSync: () => Promise<void>;
  retryItem: (id: string) => void;
  pendingCount: number;
  failedCount: number;
  resetSyncQueue: () => void;
  isSyncing: boolean;
};

const SyncContext = createContext<SyncContextType | undefined>(undefined);

const STORAGE_KEY = "moduserv.syncQueue";

function loadQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SyncQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<SyncQueueItem[]>(() => loadQueue());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  const addToQueue = (
    entityType: "job" | "appointment" | "customer",
    entityId: string,
    operation: "create" | "update",
    payload: unknown
  ) => {
    const item: SyncQueueItem = {
      id: `sync-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      entityType,
      entityId,
      operation,
      payload: JSON.stringify(payload),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setQueue((prev) => [item, ...prev]);
  };

  const runSync = async () => {
    // Auto-reset failed items to pending so a single "Sync Now" handles everything
    setQueue((prev) =>
      prev.map((item) => item.status === "failed" ? { ...item, status: "pending" } : item)
    );

    const pendingItems = queue.filter(
      (item) => item.status === "pending" || item.status === "failed"
    );
    if (pendingItems.length === 0) return;

    setIsSyncing(true);

    try {
      for (const item of pendingItems) {
        let response: Response;

        try {
          const parsed = JSON.parse(item.payload) as Record<string, unknown>;

          if (item.entityType === "job") {
            response = await authFetch(`${API_BASE}/sync/jobs`, {
              method: "POST",
              body: JSON.stringify({ operation: item.operation, payload: parsed }),
            });
          } else if (item.entityType === "appointment") {
            if (item.operation === "create") {
              response = await authFetch(`${API_BASE}/appointments`, {
                method: "POST",
                body: JSON.stringify(parsed),
              });
            } else {
              response = await authFetch(`${API_BASE}/appointments/${item.entityId}`, {
                method: "PUT",
                body: JSON.stringify(parsed),
              });
            }
          } else if (item.entityType === "customer") {
            response = await authFetch(`${API_BASE}/customers`, {
              method: "POST",
              body: JSON.stringify(parsed),
            });
          } else {
            continue;
          }
        } catch {
          setQueue((prev) =>
            prev.map((q) => q.id === item.id ? { ...q, status: "failed" } : q)
          );
          continue;
        }

        if (!response.ok) {
          setQueue((prev) =>
            prev.map((q) => q.id === item.id ? { ...q, status: "failed" } : q)
          );
          continue;
        }

        const syncedAt = new Date().toISOString();
        setQueue((prev) =>
          prev.map((q) => q.id === item.id ? { ...q, status: "synced", syncedAt } : q)
        );
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const retryItem = (id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id && item.status === "failed"
          ? { ...item, status: "pending" }
          : item
      )
    );
  };

  const pendingCount = queue.filter((item) => item.status === "pending").length;
  const failedCount = queue.filter((item) => item.status === "failed").length;

  const resetSyncQueue = () => {
    setQueue([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  };

  const value = useMemo(
    () => ({
      queue,
      addToQueue,
      runSync,
      retryItem,
      pendingCount,
      failedCount,
      resetSyncQueue,
      isSyncing,
    }),
    [queue, pendingCount, failedCount, isSyncing]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = useContext(SyncContext);

  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }

  return context;
}

