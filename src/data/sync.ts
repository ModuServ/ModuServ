export type SyncStatus = "pending" | "synced" | "failed";

export type SyncQueueItem = {
  id: string;
  entityType: "job" | "appointment" | "customer";
  entityId: string;
  operation: "create" | "update";
  payload: string;
  status: SyncStatus;
  createdAt: string;
  syncedAt?: string;
};

