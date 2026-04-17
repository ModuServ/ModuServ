import "./SyncQueuePage.css";
import { RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useSync } from "../../../context/SyncContext";

function formatTs(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  synced:  "Synced",
  failed:  "Failed",
};

export default function SyncQueuePage() {
  const { queue, runSync, retryItem, resetSyncQueue, pendingCount, failedCount, isSyncing } = useSync();

  const isEmpty = queue.length === 0;

  return (
    <section className="ms-sync">
      <div className="ms-sync__header">
        <div>
          <h1 className="ms-sync__title">Sync Queue</h1>
          <p className="ms-sync__subtitle">
            Offline changes queued for upload to the server.
          </p>
        </div>

        <div className="ms-sync__header-actions">
          <button
            type="button"
            className="ms-sync__action-btn ms-sync__action-btn--primary"
            onClick={() => void runSync()}
            disabled={isSyncing || (pendingCount === 0 && failedCount === 0)}
          >
            <RefreshCw size={15} className={isSyncing ? "ms-sync__spin" : ""} />
            {isSyncing ? "Syncing…" : `Sync Now${pendingCount + failedCount > 0 ? ` (${pendingCount + failedCount})` : ""}`}
          </button>

          {queue.length > 0 && (
            <button
              type="button"
              className="ms-sync__action-btn ms-sync__action-btn--ghost"
              onClick={resetSyncQueue}
              title="Clear all entries"
            >
              <Trash2 size={15} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Summary badges */}
      {!isEmpty && (
        <div className="ms-sync__summary">
          <span className="ms-sync__badge ms-sync__badge--pending">
            {pendingCount} pending
          </span>
          <span className="ms-sync__badge ms-sync__badge--synced">
            {queue.filter((i) => i.status === "synced").length} synced
          </span>
          {failedCount > 0 && (
            <span className="ms-sync__badge ms-sync__badge--failed">
              {failedCount} failed
            </span>
          )}
        </div>
      )}

      <div className="ms-sync__panel">
        {isEmpty ? (
          <div className="ms-sync__empty">
            <RefreshCw size={32} strokeWidth={1.5} />
            <p>The sync queue is empty.</p>
            <span>Changes you make while offline will appear here.</span>
          </div>
        ) : (
          <table className="ms-sync__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Entity</th>
                <th>Operation</th>
                <th>Status</th>
                <th>Queued At</th>
                <th>Synced At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.id} className={`ms-sync__row ms-sync__row--${item.status}`}>
                  <td className="ms-sync__id">{item.id}</td>
                  <td className="ms-sync__entity">{item.entityType} · {item.entityId}</td>
                  <td className="ms-sync__op">{item.operation}</td>
                  <td>
                    <span className={`ms-sync__status-pill ms-sync__status-pill--${item.status}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="ms-sync__ts">{formatTs(item.createdAt)}</td>
                  <td className="ms-sync__ts">{item.syncedAt ? formatTs(item.syncedAt) : "—"}</td>
                  <td>
                    {item.status === "failed" && (
                      <button
                        type="button"
                        className="ms-sync__retry-btn"
                        onClick={() => retryItem(item.id)}
                        title="Retry this item"
                      >
                        <RotateCcw size={14} />
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
