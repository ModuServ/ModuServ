import "./RepairDetailsPanel.css";
import { ClipboardCheck, UserRound, Wrench } from "lucide-react";
import type { WorkflowRecord, WorkflowStatus, WorkflowTriggerSettings } from "../workflowTypes";

type Props = {
  job: AppointmentRecord;
  draftStatus: WorkflowStatus;
  draftNotes: string;
  draftPostRepair: string;
  triggerSettings: WorkflowTriggerSettings;
  canEditWorkflowStatus: boolean;
  canEditTechnicianNotes: boolean;
  canEditPostRepairChecks: boolean;
  message: string;
  onStatusChange: (status: WorkflowStatus) => void;
  onNotesChange: (value: string) => void;
  onPostRepairChange: (value: string) => void;
  onTriggerChange: (key: keyof WorkflowTriggerSettings, value: boolean) => void;
};

export default function RepairDetailsPanel({
  job,
  draftStatus,
  draftNotes,
  draftPostRepair,
  triggerSettings,
  canEditWorkflowStatus,
  canEditTechnicianNotes,
  canEditPostRepairChecks,
  message,
  onStatusChange,
  onNotesChange,
  onPostRepairChange,
  onTriggerChange,
}: Props) {
  return (
    <div className="ms-repair-details-panel">
      <div className="ms-repair-details-panel__scroll">
        <div className="ms-repair-details-panel__grid">
          <section className="ms-repair-details-panel__card">
            <div className="ms-repair-details-panel__head">
              <UserRound size={16} />
              <h3>Customer Details</h3>
            </div>

            <div className="ms-repair-details-panel__kv">
              <span>Customer Name</span>
              <strong>{job.customer}</strong>
            </div>

            <div className="ms-repair-details-panel__kv">
              <span>Customer ID</span>
              <strong>{job.customerId || "Not Assigned"}</strong>
            </div>

            <div className="ms-repair-details-panel__kv">
              <span>Assigned Technician</span>
              <strong>{job.technician || "Unassigned"}</strong>
            </div>
          </section>

          <section className="ms-repair-details-panel__card">
            <div className="ms-repair-details-panel__head">
              <Wrench size={16} />
              <h3>Device & Repair</h3>
            </div>

            <div className="ms-repair-details-panel__kv">
              <span>Device</span>
              <strong>{job.deviceModel || job.device}</strong>
            </div>

            <div className="ms-repair-details-panel__kv">
              <span>Repair Type</span>
              <strong>{job.repairType || "General Repair"}</strong>
            </div>

            <div className="ms-repair-details-panel__kv">
              <span>Current Status</span>
              <strong>{job.status}</strong>
            </div>
          </section>

          <section className="ms-repair-details-panel__card ms-repair-details-panel__card--full">
            <div className="ms-repair-details-panel__head">
              <ClipboardCheck size={16} />
              <h3>Check In Condition</h3>
            </div>

            <p className="ms-repair-details-panel__paragraph">{job.checkInCondition}</p>
          </section>

          <section className="ms-repair-details-panel__card ms-repair-details-panel__card--full">
            <div className="ms-repair-details-panel__head">
              <ClipboardCheck size={16} />
              <h3>Repair Workflow</h3>
            </div>

            <div className="ms-repair-details-panel__field">
              <label>Status</label>
                            <select
                value={draftStatus}
                onChange={(e) => onStatusChange(e.target.value as WorkflowStatus)}
                disabled={!canEditWorkflowStatus}
              >
                <option value="Awaiting Diagnosis">Awaiting Diagnosis</option>
                <option value="Awaiting Repair">Awaiting Repair</option>
                <option value="In Progress">In Progress</option>
                <option value="Post Repair Check">Post Repair Check</option>
                <option value="Ready For Collection">Ready For Collection</option>
                <option value="Ready For Collection (Unsuccessful)">Ready For Collection (Unsuccessful)</option>
                <option value="Awaiting Parts">Awaiting Parts</option>
                <option value="Awaiting Customer Reply">Awaiting Customer Reply</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="ms-repair-details-panel__trigger-block">
              <div className="ms-repair-details-panel__trigger-title">
                Status Change Triggers
              </div>

              <div className="ms-repair-details-panel__trigger-grid">
                <label className="ms-repair-details-panel__toggle">
                  <span>Activity Log</span>
                  <input
                    type="checkbox"
                    checked={triggerSettings.activity}
                    onChange={(e) => onTriggerChange("activity", e.target.checked)}
                  />
                </label>

                <label className="ms-repair-details-panel__toggle">
                  <span>Email</span>
                  <input
                    type="checkbox"
                    checked={triggerSettings.email}
                    onChange={(e) => onTriggerChange("email", e.target.checked)}
                  />
                </label>

                <label className="ms-repair-details-panel__toggle">
                  <span>SMS</span>
                  <input
                    type="checkbox"
                    checked={triggerSettings.sms}
                    onChange={(e) => onTriggerChange("sms", e.target.checked)}
                  />
                </label>
              </div>
            </div>

            <div className="ms-repair-details-panel__field">
              <label>Technician Notes</label>
              <textarea
                value={draftNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Add or update technician notes..."
                disabled={!canEditTechnicianNotes}
              />
            </div>

            <div className="ms-repair-details-panel__field">
              <label>Post Repair Device Check Notes</label>
              <textarea
                value={draftPostRepair}
                onChange={(e) => onPostRepairChange(e.target.value)}
                placeholder="Add post-repair device check notes..."
                disabled={!canEditPostRepairChecks}
              />
            </div>

            {message ? (
              <div className="ms-repair-details-panel__message">
                {message}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

