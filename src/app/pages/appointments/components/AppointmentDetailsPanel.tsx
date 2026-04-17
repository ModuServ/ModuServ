import "./AppointmentDetailsPanel.css";
import type { AppointmentRecord, AppointmentStatus } from "../appointmentTypes";

type Props = {
  appointment: AppointmentRecord;
  mode: "view" | "edit";
  draftStatus: AppointmentStatus;
  draftAdditionalInformation: string;
  draftCheckInCondition: string;
  draftTechnicianNotes: string;
  draftPostRepairCheckNotes: string;
  showAdditionalInformation: boolean;
  canEdit: boolean;
  canEditCheckInCondition: boolean;
  canEditTechnicianNotes: boolean;
  canEditPostRepairChecks: boolean;
  onStatusChange: (status: AppointmentStatus) => void;
  onAdditionalInformationChange: (value: string) => void;
  onCheckInConditionChange: (value: string) => void;
  onTechnicianNotesChange: (value: string) => void;
  onPostRepairCheckNotesChange: (value: string) => void;
};

export default function AppointmentDetailsPanel({
  appointment,
  mode,
  draftStatus,
  draftAdditionalInformation,
  draftCheckInCondition,
  draftTechnicianNotes,
  draftPostRepairCheckNotes,
  showAdditionalInformation,
  canEdit,
  canEditCheckInCondition,
  canEditTechnicianNotes,
  canEditPostRepairChecks,
  onStatusChange,
  onAdditionalInformationChange,
  onCheckInConditionChange,
  onTechnicianNotesChange,
  onPostRepairCheckNotesChange,
}: Props) {
  const readOnly = mode === "view" || !canEdit;
  const checkInReadOnly = readOnly || !canEditCheckInCondition;
  const technicianNotesReadOnly = readOnly || !canEditTechnicianNotes;
  const postRepairReadOnly = readOnly || !canEditPostRepairChecks;

  return (
    <div className="ms-appointment-details-panel">
      <div className="ms-appointment-details-panel__scroll">
        <div className="ms-appointment-details-panel__grid">
          <section className="ms-appointment-details-panel__card">
            <h3>Appointment Details</h3>

            <div className="ms-appointment-details-panel__kv">
              <span>Customer</span>
              <strong>{appointment.customer}</strong>
            </div>

            <div className="ms-appointment-details-panel__kv">
              <span>Device</span>
              <strong>{appointment.device}</strong>
            </div>

            <div className="ms-appointment-details-panel__kv">
              <span>Date</span>
              <strong>{appointment.date}</strong>
            </div>

            <div className="ms-appointment-details-panel__kv">
              <span>Time</span>
              <strong>{appointment.time}</strong>
            </div>
          </section>

          <section className="ms-appointment-details-panel__card">
            <h3>Workflow</h3>

            <div className="ms-appointment-details-panel__field">
              <label>Status</label>
              <select
                value={draftStatus}
                onChange={(e) => onStatusChange(e.target.value as AppointmentStatus)}
                disabled={readOnly}
              >
                <option value="Awaiting Diagnosis">Awaiting Diagnosis</option>
                <option value="Awaiting Repair">Awaiting Repair</option>
                <option value="In Progress">In Progress</option>
                <option value="Post Repair Check">Post Repair Check</option>
                <option value="Ready For Collection">Ready For Collection</option>
                <option value="Awaiting Parts">Awaiting Parts</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {showAdditionalInformation ? (
              <div className="ms-appointment-details-panel__field">
                <label>Additional Information</label>
                <textarea
                  value={draftAdditionalInformation}
                  onChange={(e) => onAdditionalInformationChange(e.target.value)}
                  placeholder="Internal non-technician notes..."
                  disabled={readOnly}
                />
              </div>
            ) : null}
          </section>

          <section className="ms-appointment-details-panel__card ms-appointment-details-panel__card--full">
            <h3>Check In Condition</h3>
            <textarea
              value={draftCheckInCondition}
              className="ms-appointment-details-panel__readonly-textarea"
              onChange={(e) => onCheckInConditionChange(e.target.value)}
              readOnly={checkInReadOnly}
            />
          </section>

          <section className="ms-appointment-details-panel__card">
            <h3>Technician Notes</h3>
            <textarea
              value={draftTechnicianNotes}
              className="ms-appointment-details-panel__readonly-textarea"
              onChange={(e) => onTechnicianNotesChange(e.target.value)}
              readOnly={technicianNotesReadOnly}
            />
          </section>

          <section className="ms-appointment-details-panel__card">
            <h3>Post Repair Device Check</h3>
            <textarea
              value={draftPostRepairCheckNotes}
              className="ms-appointment-details-panel__readonly-textarea"
              onChange={(e) => onPostRepairCheckNotesChange(e.target.value)}
              readOnly={postRepairReadOnly}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

