import "./AppointmentTable.css";
import { ArrowRightCircle, BriefcaseBusiness, Lock, Trash2, Unlock } from "lucide-react";
import type { AppointmentRecord } from "../appointmentTypes";

type Props = {
  appointments: AppointmentRecord[];
  canEdit: boolean;
  canDelete?: boolean;
  onView: (appointmentId: string) => void;
  onEdit: (appointmentId: string) => void;
  onProgress: (appointmentId: string) => void;
  onLock: (appointmentId: string) => void;
  onUnlock: (appointmentId: string) => void;
  onEscalate: (appointmentId: string) => void;
  onDelete?: (appointmentId: string) => void;
};

function formatStatusClass(status: AppointmentRecord["status"]) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

export default function AppointmentTable({
  appointments,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onProgress,
  onLock,
  onUnlock,
  onEscalate,
  onDelete,
}: Props) {
  return (
    <div className="ms-appointments-table__wrap">
      <table className="ms-appointments-table">
        <thead>
          <tr>
            <th>Appointment ID</th>
            <th>Customer</th>
            <th>Device</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => {
            const isLocked = Boolean(appointment.isLocked);

            return (
              <tr key={appointment.id} className={isLocked ? "is-locked" : ""}>
                <td>{appointment.id}</td>
                <td>{appointment.customer}</td>
                <td>{appointment.device}</td>
                <td>{appointment.date}</td>
                <td>{appointment.time}</td>
                <td>
                  <div className="ms-appointments-table__status-wrap">
                    <span
                      className={`ms-appointments-table__status ms-appointments-table__status--${formatStatusClass(
                        appointment.status
                      )}`}
                    >
                      {appointment.status}
                    </span>

                    {isLocked ? (
                      <span className="ms-appointments-table__lock-badge" title={appointment.lockReason || "Locked appointment"}>
                        <Lock size={12} />
                        <span>Locked</span>
                      </span>
                    ) : null}
                  </div>
                </td>
                <td>
                  <div className="ms-appointments-table__actions">
                    <button
                      type="button"
                      className="ms-appointments-table__action-button"
                      onClick={() => onView(appointment.id)}
                    >
                      View
                    </button>

                    <button
                      type="button"
                      className="ms-appointments-table__action-button"
                      onClick={() => onEdit(appointment.id)}
                      disabled={!canEdit || isLocked}
                      title={isLocked ? "Appointment is locked" : "Edit appointment"}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="ms-appointments-table__icon-button"
                      onClick={() => onProgress(appointment.id)}
                      disabled={!canEdit || isLocked}
                      title={isLocked ? "Appointment is locked" : "Progress appointment"}
                      aria-label={isLocked ? "Appointment is locked" : "Progress appointment"}
                    >
                      <ArrowRightCircle size={16} />
                    </button>

                    {isLocked ? (
                      <button
                        type="button"
                        className="ms-appointments-table__icon-button ms-appointments-table__icon-button--unlock"
                        onClick={() => onUnlock(appointment.id)}
                        disabled={!canEdit}
                        title="Unlock appointment"
                        aria-label="Unlock appointment"
                      >
                        <Unlock size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ms-appointments-table__icon-button ms-appointments-table__icon-button--lock"
                        onClick={() => onLock(appointment.id)}
                        disabled={!canEdit}
                        title="Lock appointment"
                        aria-label="Lock appointment"
                      >
                        <Lock size={16} />
                      </button>
                    )}

                    {appointment.escalatedToJobId ? (
                      <span
                        className="ms-appointments-table__escalated-badge"
                        title={`Job ${appointment.escalatedToJobId} created`}
                      >
                        <BriefcaseBusiness size={14} />
                        <span>{appointment.escalatedToJobId}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="ms-appointments-table__icon-button ms-appointments-table__icon-button--escalate"
                        onClick={() => onEscalate(appointment.id)}
                        disabled={!canEdit}
                        title="Escalate to Job"
                        aria-label="Escalate to Job"
                      >
                        <BriefcaseBusiness size={16} />
                      </button>
                    )}

                    {canDelete && onDelete ? (
                      <button
                        type="button"
                        className="ms-appointments-table__icon-button ms-appointments-table__icon-button--delete"
                        onClick={() => onDelete(appointment.id)}
                        title="Delete appointment"
                        aria-label="Delete appointment"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}

          {appointments.length === 0 ? (
            <tr>
              <td colSpan={7} className="ms-appointments-table__empty">
                No appointments match the current filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
