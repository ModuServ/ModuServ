import { useAppointments } from "../../../context/AppointmentContext";
import "./RepairModal.css";
import PermissionGate from "../../../components/auth/PermissionGate";
import type {
  WorkflowCommunicationState,
  AppointmentRecord,
  WorkflowStatus,
  WorkflowTriggerSettings,
} from "../workflowTypes";
import { repairSmsTemplateOptions, repairTemplateOptions } from "../data/repairData";
import RepairDetailsPanel from "./RepairDetailsPanel";
import RepairMessagePane from "./RepairMessagePane";
import CustomerInfoCard from "../../../components/cards/CustomerInfoCard";
import DeviceInfoCard from "../../../components/cards/DeviceInfoCard";
import PaymentInfoCard from "../../../components/cards/PaymentInfoCard";

type Props = {
  modalMode: "view" | "edit";
  job: AppointmentRecord;
  draftStatus: WorkflowStatus;
  draftNotes: string;
  draftPostRepair: string;
  triggerSettings: WorkflowTriggerSettings;
  message: string;
  canEditWorkflowStatus: boolean;
  canEditTechnicianNotes: boolean;
  canEditPostRepairChecks: boolean;
  communication: WorkflowCommunicationState;
  onClose: () => void;
  onStatusChange: (status: WorkflowStatus) => void;
  onNotesChange: (value: string) => void;
  onPostRepairChange: (value: string) => void;
  onTriggerChange: (key: keyof WorkflowTriggerSettings, value: boolean) => void;
  canDelete?: boolean;
  onDelete?: () => void;
  onReset: () => void;
  onSave: () => void;
  onTemplateChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSendEmail: () => void;
  onSmsTemplateChange: (value: string) => void;
  onSmsChange: (value: string) => void;
  onSendSms: () => void;
  onCallLogChange: (value: string) => void;
  onAddCallLog: () => void;
};

export default function RepairModal({ modalMode,
  job,
  draftStatus,
  draftNotes,
  draftPostRepair,
  triggerSettings,
  message,
  canEditWorkflowStatus,
  canEditTechnicianNotes,
  canEditPostRepairChecks,
  communication,
  onClose,
  onStatusChange,
  onNotesChange,
  onPostRepairChange,
  onTriggerChange,
  canDelete,
  onDelete,
  onReset,
  onSave,
  onTemplateChange,
  onEmailChange,
  onSendEmail,
  onSmsTemplateChange,
  onSmsChange,
  onSendSms,
  onCallLogChange,
  onAddCallLog,
}: Props) {
  const { appointments, updateAppointment } = useAppointments();

  const linkedAppointment = appointments.find((item) => item.id === job.id) ?? job;

  const customerInfo = linkedAppointment?.customerInfo || {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    county: "",
    postcode: "",
  };

  const deviceInfo = linkedAppointment?.deviceInfo || {
    brand: "",
    deviceType: "",
    deviceModel: job.deviceModel || job.device || "",
    colour: "",
    imei: "",
    serialNumber: "",
    checkInCondition: job.checkInCondition || "",
    waterDamage: "No",
    backGlassCracked: "No",
  };

  const paymentInfo = linkedAppointment?.paymentInfo || {
    amount: "",
    paymentType: "",
    paymentStatus: "",
  };

  const canEditAny =
    canEditWorkflowStatus || canEditTechnicianNotes || canEditPostRepairChecks;

  return (
    <div className="ms-repair-modal__backdrop" onClick={onClose}>
      <div
        className="ms-repair-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="repair-modal-title"
      >
        <div className="ms-repair-modal__header">
          <div className="ms-repair-modal__header-copy">
            <div className="ms-repair-modal__eyebrow">Appointment / Repair Record</div>
            <h2 id="repair-modal-title">{job.id.replace(/^JOB-/, "APT-")} {modalMode === "view" ? "(Read Only)" : "(Editing)"}</h2>
            <p>
              {job.customer} &bull; {job.deviceModel} &bull; {job.repairType || "General Repair"}
            </p>
          </div>

          <button
            type="button"
            className="ms-repair-modal__close"
            onClick={onClose}
            aria-label="Close repair modal"
          >
            &times;
          </button>
        </div>

        <div className="ms-repair-modal__body">
          <div className="ms-repair-modal__content">
            <div className="ms-repair-modal__main">
              <div className="ms-repair-modal__top-grid">
                {linkedAppointment ? (
                  <CustomerInfoCard
                    value={customerInfo}
                    editable={canEditAny && !linkedAppointment.isLocked}
                    onChange={(field, value) =>
                      updateAppointment(linkedAppointment.id, {
                        customerInfo: {
                          ...customerInfo,
                          [field]: value,
                        },
                      })
                    }
                  />
                ) : null}

                {linkedAppointment ? (
                  <DeviceInfoCard
                    value={deviceInfo}
                    editable={canEditAny && !linkedAppointment.isLocked}
                    onChange={(field, value) =>
                      updateAppointment(linkedAppointment.id, {
                        deviceInfo: {
                          ...deviceInfo,
                          [field]: value,
                        },
                        checkInCondition:
                          field === "checkInCondition"
                            ? String(value)
                            : linkedAppointment.checkInCondition,
                        waterDamage:
                          field === "waterDamage"
                            ? (value as "Yes" | "No")
                            : linkedAppointment.waterDamage,
                        backGlassCracked:
                          field === "backGlassCracked"
                            ? (value as "Yes" | "No")
                            : linkedAppointment.backGlassCracked,
                        brand:
                          field === "brand"
                            ? String(value)
                            : linkedAppointment.brand,
                        deviceType:
                          field === "deviceType"
                            ? String(value)
                            : linkedAppointment.deviceType,
                        deviceModel:
                          field === "deviceModel"
                            ? String(value)
                            : linkedAppointment.deviceModel,
                        device:
                          field === "brand" || field === "deviceModel"
                            ? `${field === "brand" ? String(value) : deviceInfo.brand} ${field === "deviceModel" ? String(value) : deviceInfo.deviceModel}`.trim()
                            : linkedAppointment.device,
                      })
                    }
                  />
                ) : null}
              </div>

              <div className="ms-repair-modal__stack">
                {linkedAppointment ? (
                  <section className="ms-repair-modal__schedule-card">
                    <div className="ms-repair-modal__schedule-header">
                      <h3>Appointment Schedule</h3>
                      <p>Update the linked appointment date and time.</p>
                    </div>

                    <div className="ms-repair-modal__schedule-grid">
                      <div className="ms-repair-modal__schedule-field">
                        <label>Appointment Date</label>
                        <input
                          type="date"
                          value={linkedAppointment.date || ""}
                          onChange={(event) =>
                            updateAppointment(linkedAppointment.id, {
                              date: event.target.value,
                            })
                          }
                          disabled={!canEditAny || linkedAppointment.isLocked}
                        />
                      </div>

                      <div className="ms-repair-modal__schedule-field">
                        <label>Appointment Time</label>
                        <input
                          type="time"
                          value={linkedAppointment.time || ""}
                          onChange={(event) =>
                            updateAppointment(linkedAppointment.id, {
                              time: event.target.value,
                            })
                          }
                          disabled={!canEditAny || linkedAppointment.isLocked}
                        />
                      </div>
                    </div>
                  </section>
                ) : null}

                <RepairDetailsPanel
                  job={job}
                  draftStatus={draftStatus}
                  draftNotes={draftNotes}
                  draftPostRepair={draftPostRepair}
                  triggerSettings={triggerSettings}
                  canEditWorkflowStatus={canEditWorkflowStatus}
                  canEditTechnicianNotes={canEditTechnicianNotes}
                  canEditPostRepairChecks={canEditPostRepairChecks}
                  message={message}
                  onStatusChange={onStatusChange}
                  onNotesChange={onNotesChange}
                  onPostRepairChange={onPostRepairChange}
                  onTriggerChange={onTriggerChange}
                />
{linkedAppointment ? (
                  <PaymentInfoCard
                    value={paymentInfo}
                    editable={canEditAny && !linkedAppointment.isLocked}
                    onChange={(field, value) =>
                      updateAppointment(linkedAppointment.id, {
                        paymentInfo: {
                          ...paymentInfo,
                          [field]: value,
                        },
                      })
                    }
                  />
                ) : null}
              </div>
            </div>

            <div className="ms-repair-modal__side">
              <RepairMessagePane
                selectedTemplate={communication.selectedTemplate}
                templateOptions={repairTemplateOptions}
                draftEmail={communication.draftEmail}
                selectedSmsTemplate={communication.selectedSmsTemplate}
                smsTemplateOptions={repairSmsTemplateOptions}
                draftSms={communication.draftSms}
                callLog={communication.callLog}
                callAttempts={communication.callAttempts}
                activityLog={communication.activityLog}
                onTemplateChange={onTemplateChange}
                onEmailChange={onEmailChange}
                onSendEmail={onSendEmail}
                onSmsTemplateChange={onSmsTemplateChange}
                onSmsChange={onSmsChange}
                onSendSms={onSendSms}
                onCallLogChange={onCallLogChange}
                onAddCallLog={onAddCallLog}
              />
            </div>
          </div>
        </div>

        <div className="ms-repair-modal__footer">
          {canDelete && onDelete ? (
            <button type="button" className="ms-repair-modal__danger" onClick={onDelete}>
              Delete
            </button>
          ) : null}

          <div className="ms-repair-modal__footer-right">
            <PermissionGate
              allow={canEditAny}
              fallback={
                <button type="button" className="ms-repair-modal__secondary" disabled>
                  Reset To Original
                </button>
              }
            >
              <button type="button" className="ms-repair-modal__secondary" onClick={onReset}>
                Reset To Original
              </button>
            </PermissionGate>

            <PermissionGate
              allow={canEditAny}
              fallback={
                <button type="button" className="ms-repair-modal__primary" disabled>
                  Save Changes
                </button>
              }
            >
              <button type="button" className="ms-repair-modal__primary" onClick={onSave}>
                Save Changes
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>
    </div>
  );
}







