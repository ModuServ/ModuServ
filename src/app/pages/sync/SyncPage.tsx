import { useSync } from "../../../context/SyncContext";

export default function SyncPage() {
  const { queue, pendingCount, runSync, resetSyncQueue, isSyncing } = useSync();

  return (
    <section>
      <div className="page-row">
        <h1>Sync Queue</h1>
        <div className="page-actions">
          <button
            type="button"
            className="button-link button-link--button"
            onClick={() => void runSync()}
            disabled={isSyncing}
          >
            {isSyncing ? "Syncing..." : "Sync Now"}
          </button>
          <button
            type="button"
            className="button-link button-link--button button-link--secondary"
            onClick={resetSyncQueue}
          >
            Clear Queue
          </button>
        </div>
      </div>

      <div className="card">
        <p><strong>Pending Items:</strong> {pendingCount}</p>

        {queue.length === 0 ? (
          <p>No sync activity yet.</p>
        ) : (
          <ul className="audit-list">
            {queue.map((item) => (
              <li key={item.id} className="audit-list__item">
                <strong>{item.operation.toUpperCase()} {item.entityType}</strong>
                <p><strong>Entity ID:</strong> {item.entityId}</p>
                <p><strong>Status:</strong> {item.status}</p>
                <p><strong>Created:</strong> {new Date(item.createdAt).toLocaleString()}</p>
                {item.syncedAt ? (
                  <p><strong>Synced:</strong> {new Date(item.syncedAt).toLocaleString()}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}


