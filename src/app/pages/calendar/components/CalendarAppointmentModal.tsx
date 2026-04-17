import "./CalendarAppointmentModal.css";
import { ClipboardCheck, Settings2, UserRound } from "lucide-react";

type AppointmentForm = {
  customer: string;
  brand: string;
  deviceType: string;
  deviceModel: string;
  repairType: string;
  checkInCondition: string;
  additionalInformation: string;
  technicianNotes: string;
  postRepairCheckNotes: string;
  initialStatus: string;
  date: string;
  start: string;
  end: string;
};

type Props = {
  form: AppointmentForm;
  brandOptions: string[];
  deviceTypeOptions: string[];
  deviceModelOptions: string[];
  timeSlots: string[];
  canEditCheckInCondition?: boolean;
  canEditTechnicianNotes?: boolean;
  canEditPostRepairChecks?: boolean;
  onChange: <K extends keyof AppointmentForm>(key: K, value: AppointmentForm[K]) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
};

export default function CalendarAppointmentModal({
  form,
  brandOptions,
  deviceTypeOptions,
  deviceModelOptions,
  timeSlots,
  canEditCheckInCondition = true,
  canEditTechnicianNotes = true,
  canEditPostRepairChecks = true,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  return (
    <div className="ms-calendar-create-modal__backdrop" onClick={onClose}>
      <div
        className="ms-calendar-create-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-create-modal-title"
      >
        <div className="ms-calendar-create-modal__header">
          <div className="ms-calendar-create-modal__header-copy">
            <div className="ms-calendar-create-modal__eyebrow">New Appointment</div>
            <h2 id="calendar-create-modal-title">Create Calendar Appointment</h2>
            <p>Aligned scheduling intake for both service intake and repair workflow preparation.</p>
          </div>

          <button
            type="button"
            className="ms-calendar-create-modal__close"
            onClick={onClose}
            aria-label="Close new appointment modal"
          >
            ×
          </button>
        </div>

        <form className="ms-calendar-create-modal__body" onSubmit={onSubmit}>
          <div className="ms-calendar-create-modal__content">
            <section className="ms-calendar-create-modal__panel">
              <div className="ms-calendar-create-modal__panel-head">
                <UserRound size={16} />
                <h3>Customer Intake & Front Desk</h3>
              </div>

              <div className="ms-calendar-create-modal__grid">
                <div className="ms-calendar-create-modal__field">
                  <label>Customer</label>
                  <input
                    type="text"
                    value={form.customer}
                    onChange={(e) => onChange("customer", e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>

                <div className="ms-calendar-create-modal__field">
                  <label>Brand</label>
                  <select value={form.brand} onChange={(e) => onChange("brand", e.target.value)}>
                    <option value="">Select brand</option>
                    {brandOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="ms-calendar-create-modal__field">
                  <label>Device Type</label>
                  <select value={form.deviceType} onChange={(e) => onChange("deviceType", e.target.value)}>
                    <option value="">Select device type</option>
                    {deviceTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="ms-calendar-create-modal__field">
                  <label>Device Model</label>
                  <select value={form.deviceModel} onChange={(e) => onChange("deviceModel", e.target.value)}>
                    <option value="">Select device model</option>
                    {deviceModelOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="ms-calendar-create-modal__field">
                  <label>Repair Type</label>
                  <input
                    type="text"
                    value={form.repairType}
                    onChange={(e) => onChange("repairType", e.target.value)}
                    placeholder="Enter repair type"
                  />
                </div>

                <div className="ms-calendar-create-modal__field">
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={(e) => onChange("date", e.target.value)} />
                </div>

                <div className="ms-calendar-create-modal__field">
                  <label>Start Time</label>
                  <select value={form.start} onChange={(e) => onChange("start", e.target.value)}>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div className="ms-calendar-create-modal__field">
                  <label>End Time</label>
                  <select value={form.end} onChange={(e) => onChange("end", e.target.value)}>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div className="ms-calendar-create-modal__field ms-calendar-create-modal__field--full">
                  <label>Check In Condition</label>
                  <textarea
                    value={form.checkInCondition}
                    onChange={(e) => onChange("checkInCondition", e.target.value)}
                    readOnly={!canEditCheckInCondition}
                    className={!canEditCheckInCondition ? "ms-calendar-create-modal__readonly" : ""}
                    placeholder="Describe the device condition at check in"
                    readOnly={!canEditCheckInCondition}
                    className={!canEditCheckInCondition ? "ms-calendar-create-modal__readonly" : ""}
                  />
                </div>

                <div className="ms-calendar-create-modal__field ms-calendar-create-modal__field--full">
                  <label>Additional Information</label>
                  <textarea
                    value={form.additionalInformation}
                    onChange={(e) => onChange("additionalInformation", e.target.value)}
                    placeholder="Internal intake and handoff notes"
                  />
                </div>
              </div>
            </section>

            <aside className="ms-calendar-create-modal__support">
              <section className="ms-calendar-create-modal__card">
                <div className="ms-calendar-create-modal__panel-head">
                  <Settings2 size={16} />
                  <h3>Repair Workflow Preparation</h3>
                </div>

                <div className="ms-calendar-create-modal__field">
                  <label>Initial Workflow Status</label>
                  <select value={form.initialStatus} onChange={(e) => onChange("initialStatus", e.target.value)}>
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

                <div className="ms-calendar-create-modal__field">
                  <label>Technician Notes</label>
                  <textarea
                    value={form.technicianNotes}
                    onChange={(e) => onChange("technicianNotes", e.target.value)}
                    placeholder="Enter technician notes"
                    readOnly={!canEditTechnicianNotes}
                    className={!canEditTechnicianNotes ? "ms-calendar-create-modal__readonly" : ""}
                  />
                </div>

                <div className="ms-calendar-create-modal__field">
                  <label>Post Repair Device Check</label>
                  <textarea
                    value={form.postRepairCheckNotes}
                    onChange={(e) => onChange("postRepairCheckNotes", e.target.value)}
                    placeholder="Enter post repair device check notes"
                    readOnly={!canEditPostRepairChecks}
                    className={!canEditPostRepairChecks ? "ms-calendar-create-modal__readonly" : ""}
                  />
                </div>
              </section>

              <section className="ms-calendar-create-modal__card">
                <div className="ms-calendar-create-modal__panel-head">
                  <ClipboardCheck size={16} />
                  <h3>Alignment Notes</h3>
                </div>

                <div className="ms-calendar-create-modal__hint-list">
                  <div className="ms-calendar-create-modal__hint-item">
                    Customer intake is captured first, then handed into appointment and repair workflow.
                  </div>
                  <div className="ms-calendar-create-modal__hint-item">
                    The modal structure mirrors Appointment Management and Repair Tracking.
                  </div>
                  <div className="ms-calendar-create-modal__hint-item">
                    Permissions now control all technician note and post-repair note fields consistently.
                  </div>
                </div>
              </section>
            </aside>
          </div>

          <div className="ms-calendar-create-modal__footer">
            <button type="button" className="ms-calendar-create-modal__secondary" onClick={onClose}>
              Close
            </button>

            <button type="submit" className="ms-calendar-create-modal__primary">
              Create Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

