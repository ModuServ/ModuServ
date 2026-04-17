import "./AppointmentModal.css";
import { useAppointments } from "../../../context/AppointmentContext";
import type { AppointmentRecord, AppointmentStatus } from "../appointmentTypes";
import { appointmentSmsTemplateOptions, appointmentTemplateOptions } from "../data/appointmentData";
import AppointmentDetailsPanel from "./AppointmentDetailsPanel";
import AppointmentMessagePane from "./AppointmentMessagePane";
import CustomerInfoCard from "../../../components/cards/CustomerInfoCard";
import DeviceInfoCard from "../../../components/cards/DeviceInfoCard";
import PaymentInfoCard from "../../../components/cards/PaymentInfoCard";

type Props = {
  appointment: AppointmentRecord;
  mode: "view" | "edit";
  draftStatus: AppointmentStatus;
  draftAdditionalInformation: string;
  draftCheckInCondition: string;
  draftTechnicianNotes: string;
  draftPostRepairCheckNotes: string;
  draftEmail: string;
  selectedTemplate: string;
  draftSms: string;
  selectedSmsTemplate: string;
  showAdditionalInformation: boolean;
  canEdit: boolean;
  canEditCheckInCondition: boolean;
  canEditTechnicianNotes: boolean;
  canEditPostRepairChecks: boolean;
  canDelete?: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onStatusChange: (status: AppointmentStatus) => void;
  onAdditionalInformationChange: (value: string) => void;
  onCheckInConditionChange: (value: string) => void;
  onTechnicianNotesChange: (value: string) => void;
  onPostRepairCheckNotesChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onTemplateChange: (value: string) => void;
  onSmsChange: (value: string) => void;
  onSmsTemplateChange: (value: string) => void;
  onSendEmail: () => void;
  onSendSms: () => void;
  onSave: () => void;
};

export default function AppointmentModal({
  appointment,
  mode,
  draftStatus,
  draftAdditionalInformation,
  draftCheckInCondition,
  draftTechnicianNotes,
  draftPostRepairCheckNotes,
  draftEmail,
  selectedTemplate,
  draftSms,
  selectedSmsTemplate,
  showAdditionalInformation,
  canEdit,
  canEditCheckInCondition,
  canEditTechnicianNotes,
  canEditPostRepairChecks,
  canDelete,
  onClose,
  onDelete,
  onStatusChange,
  onAdditionalInformationChange,
  onCheckInConditionChange,
  onTechnicianNotesChange,
  onPostRepairCheckNotesChange,
  onEmailChange,
  onTemplateChange,
  onSmsChange,
  onSmsTemplateChange,
  onSendEmail,
  onSendSms,
  onSave,
}: Props) {
  const { updateAppointment } = useAppointments();
  const isLocked = Boolean(appointment.isLocked);

  const customerInfo = appointment.customerInfo || {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    county: "",
    postcode: "",
  };

  const deviceInfo = appointment.deviceInfo || {
    brand: appointment.brand || "",
    deviceType: appointment.deviceType || "",
    deviceModel: appointment.deviceModel || "",
    colour: "",
    imei: "",
    serialNumber: "",
    checkInCondition: appointment.checkInCondition || "",
    waterDamage: appointment.waterDamage || "No",
    backGlassCracked: appointment.backGlassCracked || "No",
  };

  const paymentInfo = appointment.paymentInfo || {
    amount: "",
    paymentType: "",
    paymentStatus: "",
  };

  return (
    <div className="ms-appointment-modal__backdrop" onClick={onClose}>
      <div
        className="ms-appointment-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-modal-title"
      >
        <div className="ms-appointment-modal__header">
          <div>
            <div className="ms-appointment-modal__eyebrow">Appointment</div>
            <h2 id="appointment-modal-title">{appointment.id}</h2>
            <p>
              {appointment.customer} &bull; {appointment.device}
            </p>
          </div>

          <button
            type="button"
            className="ms-appointment-modal__close"
            onClick={onClose}
            aria-label="Close appointment modal"
          >
            &times;
          </button>
        </div>

        {isLocked ? (
          <div className="ms-appointment-modal__lock-banner">
            <strong>This appointment is locked.</strong>
            <span>
              {appointment.lockReason || "Locked by administrator"}
              {appointment.lockedBy ? ` \u00b7 ${appointment.lockedBy}` : ""}
              {appointment.lockedAt ? ` \u00b7 ${appointment.lockedAt}` : ""}
            </span>
          </div>
        ) : null}

        <div className="ms-appointment-modal__body">
          <div className="ms-appointment-modal__content">
            <div className="ms-appointment-modal__main">
              <div className="ms-appointment-modal__top-grid">
                <CustomerInfoCard
                  value={customerInfo}
                  editable={canEdit && !isLocked}
                  onChange={(field, value) =>
                    updateAppointment(appointment.id, {
                      customerInfo: {
                        ...customerInfo,
                        [field]: value,
                      },
                    })
                  }
                />

                <DeviceInfoCard
                  value={deviceInfo}
                  editable={canEdit && !isLocked}
                  onChange={(field, value) =>
                    updateAppointment(appointment.id, {
                      deviceInfo: {
                        ...deviceInfo,
                        [field]: value,
                      },
                      checkInCondition:
                        field === "checkInCondition"
                          ? String(value)
                          : appointment.checkInCondition,
                      waterDamage:
                        field === "waterDamage"
                          ? (value as "Yes" | "No")
                          : appointment.waterDamage,
                      backGlassCracked:
                        field === "backGlassCracked"
                          ? (value as "Yes" | "No")
                          : appointment.backGlassCracked,
                      brand: field === "brand" ? String(value) : appointment.brand,
                      deviceType:
                        field === "deviceType"
                          ? String(value)
                          : appointment.deviceType,
                      deviceModel:
                        field === "deviceModel"
                          ? String(value)
                          : appointment.deviceModel,
                      device:
                        field === "brand" || field === "deviceModel"
                          ? `${field === "brand" ? String(value) : deviceInfo.brand} ${field === "deviceModel" ? String(value) : deviceInfo.deviceModel}`.trim()
                          : appointment.device,
                    })
                  }
                />
              </div>

              <div className="ms-appointment-modal__stack">
                <section className="ms-appointment-modal__schedule-card">
                  <div className="ms-appointment-modal__schedule-header">
                    <h3>Appointment Schedule</h3>
                    <p>Update the scheduled appointment date and time.</p>
                  </div>

                  <div className="ms-appointment-modal__schedule-grid">
                    <div className="ms-appointment-modal__schedule-field">
                      <label>Appointment Date</label>
                      <input
                        type="date"
                        value={appointment.date || ""}
                        onChange={(event) =>
                          updateAppointment(appointment.id, {
                            date: event.target.value,
                          })
                        }
                        disabled={mode !== "edit" || !canEdit || isLocked}
                      />
                    </div>

                    <div className="ms-appointment-modal__schedule-field">
                      <label>Appointment Time</label>
                      <input
                        type="time"
                        value={appointment.time || ""}
                        onChange={(event) =>
                          updateAppointment(appointment.id, {
                            time: event.target.value,
                          })
                        }
                        disabled={mode !== "edit" || !canEdit || isLocked}
                      />
                    </div>
                  </div>
                </section>

                <AppointmentDetailsPanel
                  appointment={appointment}
                  mode={mode}
                  draftStatus={draftStatus}
                  draftAdditionalInformation={draftAdditionalInformation}
                  draftCheckInCondition={draftCheckInCondition}
                  draftTechnicianNotes={draftTechnicianNotes}
                  draftPostRepairCheckNotes={draftPostRepairCheckNotes}
                  showAdditionalInformation={showAdditionalInformation}
                  canEdit={canEdit && !isLocked}
                  canEditCheckInCondition={canEditCheckInCondition && !isLocked}
                  canEditTechnicianNotes={canEditTechnicianNotes && !isLocked}
                  canEditPostRepairChecks={canEditPostRepairChecks && !isLocked}
                  onStatusChange={onStatusChange}
                  onAdditionalInformationChange={onAdditionalInformationChange}
                  onCheckInConditionChange={onCheckInConditionChange}
                  onTechnicianNotesChange={onTechnicianNotesChange}
                  onPostRepairCheckNotesChange={onPostRepairCheckNotesChange}
                />

                <PaymentInfoCard
                  value={paymentInfo}
                  editable={canEdit && !isLocked}
                  onChange={(field, value) =>
                    updateAppointment(appointment.id, {
                      paymentInfo: {
                        ...paymentInfo,
                        [field]: value,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="ms-appointment-modal__side">
              <AppointmentMessagePane
                selectedTemplate={selectedTemplate}
                templateOptions={appointmentTemplateOptions}
                draftEmail={draftEmail}
                selectedSmsTemplate={selectedSmsTemplate}
                smsTemplateOptions={appointmentSmsTemplateOptions}
                draftSms={draftSms}
                callAttempts={appointment.callAttempts}
                activityLog={appointment.activityLog}
                onTemplateChange={onTemplateChange}
                onEmailChange={onEmailChange}
                onSendEmail={onSendEmail}
                onSmsTemplateChange={onSmsTemplateChange}
                onSmsChange={onSmsChange}
                onSendSms={onSendSms}
                isReadOnly={isLocked || mode === "view"}
              />
            </div>
          </div>
        </div>

        <div className="ms-appointment-modal__footer">
          {canDelete && onDelete ? (
            <button
              type="button"
              className="ms-appointment-modal__danger"
              onClick={onDelete}
            >
              Delete
            </button>
          ) : null}

          <div className="ms-appointment-modal__footer-right">
            <button
              type="button"
              className="ms-appointment-modal__secondary"
              onClick={onClose}
            >
              Close
            </button>

            {mode === "edit" ? (
              <button
                type="button"
                className="ms-appointment-modal__primary"
                onClick={onSave}
                disabled={!canEdit || isLocked}
              >
                Save Changes
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}





