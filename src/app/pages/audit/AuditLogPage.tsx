import "./AuditLogPage.css";
import { useMemo, useState } from "react";

import { useAudit } from "../../../context/AuditContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import type { AuditAction } from "../../../data/audit";

const ALL_ACTIONS: AuditAction[] = [
  "JOB_CREATED",
  "JOB_UPDATED",
  "PRIORITY_OVERRIDDEN",
  "JOB_ARCHIVED",
  "JOB_RESTORED",
  "STATUS_CHANGED",
  "REPAIR_TIMER_STARTED",
  "REPAIR_TIMER_STOPPED",
  "APPOINTMENT_CREATED",
  "APPOINTMENT_UPDATED",
  "APPOINTMENT_DELETED",
  "APPOINTMENT_ESCALATED",
  "CUSTOMER_CREATED",
  "CUSTOMER_UPDATED",
];

const ACTION_GROUPS: Record<string, string> = {
  JOB_CREATED: "job",
  JOB_UPDATED: "job",
  PRIORITY_OVERRIDDEN: "job",
  JOB_ARCHIVED: "job",
  JOB_RESTORED: "job",
  STATUS_CHANGED: "job",
  REPAIR_TIMER_STARTED: "job",
  REPAIR_TIMER_STOPPED: "job",
  APPOINTMENT_CREATED: "appointment",
  APPOINTMENT_UPDATED: "appointment",
  APPOINTMENT_DELETED: "appointment",
  APPOINTMENT_ESCALATED: "appointment",
  CUSTOMER_CREATED: "customer",
  CUSTOMER_UPDATED: "customer",
};

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AuditLogPage() {
  const { entries, resetAudit } = useAudit();
  const { canExportAuditLog, canClearAuditLog } = useRolePermissions();

  const [filterAction, setFilterAction] = useState<AuditAction | "">("");
  const [filterJobId, setFilterJobId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (filterAction && entry.action !== filterAction) return false;
      if (filterJobId && !entry.jobId.toLowerCase().includes(filterJobId.toLowerCase())) return false;
      if (filterDateFrom) {
        const entryDate = new Date(entry.createdAt);
        const from = new Date(filterDateFrom);
        if (entryDate < from) return false;
      }
      if (filterDateTo) {
        const entryDate = new Date(entry.createdAt);
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (entryDate > to) return false;
      }
      return true;
    });
  }, [entries, filterAction, filterJobId, filterDateFrom, filterDateTo]);

  function handleExportCsv() {
    const header = ["ID", "Action", "Job ID", "Message", "Created At"];
    const rows = filtered.map((entry) => [
      entry.id,
      entry.action,
      entry.jobId,
      entry.message,
      new Date(entry.createdAt).toLocaleString(),
    ]);
    downloadCsv([header, ...rows], `audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <section className="ms-page-shell">
      <div className="ms-audit__header">
        <div>
          <h1 className="ms-page-shell__title">Audit Log</h1>
          <p className="ms-page-shell__subtitle">
            System event history — {filtered.length} of {entries.length} entries shown.
          </p>
        </div>
        <div className="ms-audit__header-actions">
          {canExportAuditLog && (
            <button
              type="button"
              className="ms-audit__btn ms-audit__btn--secondary"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
            >
              Export CSV
            </button>
          )}
          {canClearAuditLog && (
            <button
              type="button"
              className="ms-audit__btn ms-audit__btn--danger"
              onClick={resetAudit}
              disabled={entries.length === 0}
            >
              Clear Log
            </button>
          )}
        </div>
      </div>

      <div className="ms-page-shell__card ms-audit__filters">
        <div className="ms-audit__filter-field">
          <label>Action</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value as AuditAction | "")}
          >
            <option value="">All actions</option>
            {ALL_ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="ms-audit__filter-field">
          <label>Record ID</label>
          <input
            type="text"
            value={filterJobId}
            onChange={(e) => setFilterJobId(e.target.value)}
            placeholder="e.g. JOB-001, APT-001, CUS-001"
          />
        </div>
        <div className="ms-audit__filter-field">
          <label>From</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
        </div>
        <div className="ms-audit__filter-field">
          <label>To</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />
        </div>
        {(filterAction || filterJobId || filterDateFrom || filterDateTo) ? (
          <button
            type="button"
            className="ms-audit__btn ms-audit__btn--secondary ms-audit__clear-filters"
            onClick={() => {
              setFilterAction("");
              setFilterJobId("");
              setFilterDateFrom("");
              setFilterDateTo("");
            }}
          >
            Clear Filters
          </button>
        ) : null}
      </div>

      <div className="ms-page-shell__card">
        {filtered.length === 0 ? (
          <p className="ms-audit__empty">
            {entries.length === 0
              ? "No audit activity recorded yet."
              : "No entries match the current filters."}
          </p>
        ) : (
          <table className="ms-audit__table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Record ID</th>
                <th>Message</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <span className={`ms-audit__action-badge ms-audit__action-badge--${ACTION_GROUPS[entry.action] ?? "job"}`}>
                      {entry.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="ms-audit__job-id">{entry.jobId}</td>
                  <td>{entry.message}</td>
                  <td className="ms-audit__timestamp">
                    {new Date(entry.createdAt).toLocaleString()}
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
