import "./RepairTable.css";
import { ArrowRightCircle, Lock, Trash2, Unlock } from "lucide-react";
import { workflowStatusClassName } from "../utils/workflowUtils";
import type { WorkflowRecord } from "../workflowTypes";

type Props = {
  jobs: WorkflowRecord[];
  canEdit: boolean;
  canDelete?: boolean;
  onView: (appointmentId: string) => void;
  onEdit: (appointmentId: string) => void;
  onProgress: (appointmentId: string) => void;
  onLock: (appointmentId: string) => void;
  onUnlock: (appointmentId: string) => void;
  onDelete?: (id: string) => void;
};

function getCustomerName(record: WorkflowRecord) {
  if (record.customer && record.customer.trim() !== "") {
    return record.customer.trim();
  }

  const firstName = record.customerInfo?.firstName?.trim() || "";
  const lastName = record.customerInfo?.lastName?.trim() || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return fullName || "Unknown Customer";
}

function getDeviceLabel(record: WorkflowRecord) {
  if (record.device && record.device.trim() !== "") {
    return record.device.trim();
  }

  const brand = record.brand?.trim() || record.deviceInfo?.brand?.trim() || "";
  const model = record.deviceModel?.trim() || record.deviceInfo?.deviceModel?.trim() || "";
  const label = [brand, model].filter(Boolean).join(" ").trim();

  return label || "Unknown Device";
}

export default function RepairTable({
  jobs,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onProgress,
  onLock,
  onUnlock,
  onDelete,
}: Props) {
  const safeJobs = jobs ?? [];

  return (
    <div className="ms-repair-table__wrap">
      <table className="ms-repair-table">
        <thead>
          <tr>
            <th>Appointment ID</th>
            <th>Customer</th>
            <th>Device</th>
            <th>Repair Type</th>
            <th>Status</th>
            <th>Technician</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {safeJobs.map((record) => {
            const isLocked = Boolean(record.isLocked);

            return (
              <tr key={record.id} className={isLocked ? "is-locked" : ""}>
                <td>{record.id}</td>
                <td>{getCustomerName(record)}</td>
                <td>{getDeviceLabel(record)}</td>
                <td>{record.repairType || "General Repair"}</td>
                <td>
                  <div className="ms-repair-table__status-wrap">
                    <span
                      className={`ms-repair-table__status ms-repair-table__status--${workflowStatusClassName(
                        record.status
                      )}`}
                    >
                      {record.status}
                    </span>

                    {isLocked ? (
                      <span className="ms-repair-table__lock-badge" title={record.lockReason || "Locked record"}>
                        <Lock size={12} />
                        <span>Locked</span>
                      </span>
                    ) : null}
                  </div>
                </td>
                <td>{record.technician || "Unassigned"}</td>
                <td>
                  <div className="ms-repair-table__actions">
                    <button
                      type="button"
                      className="ms-repair-table__action-button"
                      onClick={() => onView(record.id)}
                    >
                      View
                    </button>

                    <button
                      type="button"
                      className="ms-repair-table__action-button"
                      onClick={() => onEdit(record.id)}
                      disabled={!canEdit || isLocked}
                      title={isLocked ? "Record is locked" : "Edit workflow record"}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="ms-repair-table__icon-button"
                      onClick={() => onProgress(record.id)}
                      disabled={!canEdit || isLocked}
                      title={isLocked ? "Record is locked" : "Progress workflow"}
                      aria-label={isLocked ? "Record is locked" : "Progress workflow"}
                    >
                      <ArrowRightCircle size={16} />
                    </button>

                    {isLocked ? (
                      <button
                        type="button"
                        className="ms-repair-table__icon-button ms-repair-table__icon-button--unlock"
                        onClick={() => onUnlock(record.id)}
                        disabled={!canEdit}
                        title="Unlock record"
                        aria-label="Unlock record"
                      >
                        <Unlock size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ms-repair-table__icon-button ms-repair-table__icon-button--lock"
                        onClick={() => onLock(record.id)}
                        disabled={!canEdit}
                        title="Lock record"
                        aria-label="Lock record"
                      >
                        <Lock size={16} />
                      </button>
                    )}

                    {canDelete && onDelete ? (
                      <button
                        type="button"
                        className="ms-repair-table__icon-button ms-repair-table__icon-button--delete"
                        onClick={() => onDelete(record.id)}
                        title="Delete record"
                        aria-label="Delete record"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}

          {safeJobs.length === 0 ? (
            <tr>
              <td colSpan={7} className="ms-repair-table__empty">
                No workflow records found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}