import "./AppointmentManagement.css";
import { useEffect, useMemo, useState } from "react";
import { useAppointments } from "../../context/AppointmentContext";
import { useAudit } from "../../../context/AuditContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import {
  canEditRecord,
  getWorkflowModeForRecord,
  getLockBannerText,
  isLockedByAnotherUser,
} from "../../services/workflowRules";
import type {
  AppointmentRecord,
  AppointmentStatus,
  AppointmentActivityEntry,
} from "./appointmentTypes";
import { createAppointmentPipeline } from "../../services/appointmentPipeline";
import { useJobs } from "../../../context/JobsContext";
import { useSite } from "../../../context/SiteContext";
import { useCustomers } from "../../context/CustomerContext";
import { useLocation } from "react-router-dom";
import AppointmentHeader from "./components/AppointmentHeader";
import AppointmentStats from "./components/AppointmentStats";
import AppointmentToolbar from "./components/AppointmentToolbar";
import AppointmentTable from "./components/AppointmentTable";
import AppointmentModal from "./components/AppointmentModal";

function isTechnicianRole(role: string) {
  return role.toLowerCase().includes("technician");
}

const allAppointmentStatuses: AppointmentStatus[] = [
  "Awaiting Diagnosis",
  "Awaiting Repair",
  "In Progress",
  "Post Repair Check",
  "Ready For Collection",
  "Awaiting Parts",
  "Completed",
  "Cancelled",
];

const emailTemplateBodies: Record<string, string> = {
  "Appointment confirmation": "Your appointment has been confirmed. Thank you for choosing us.",
  "Appointment reminder": "This is a reminder about your upcoming appointment with us.",
  "Running late update": "We wanted to let you know we are running slightly behind schedule.",
  "Booking follow-up": "Thank you for your recent visit. We hope everything went well.",
};

const smsTemplateBodies: Record<string, string> = {
  "Your appointment is confirmed.": "Your appointment is confirmed.",
  "Reminder: your appointment is scheduled.": "Reminder: your appointment is scheduled.",
  "We are running slightly behind schedule.": "We are running slightly behind schedule.",
  "Please contact us regarding your booking.": "Please contact us regarding your booking.",
};

export default function AppointmentManagement() {
  const { appointments, addAppointment, updateAppointment: updateAppointmentInContext, deleteAppointment } = useAppointments();
  const { logEvent } = useAudit();
  const { createJob } = useJobs();
  const { selectedSiteId } = useSite();
  const { customers } = useCustomers();
  const location = useLocation();
  const incomingId = (location.state as { openId?: string } | null)?.openId ?? null;

  const {
    canCreateAppointments,
    canDeleteRecords,
    canEditRepairStatus,
    canEditTechnicianNotes,
    canEditPostRepairChecks,
    canEditCheckInCondition = true,
    selectedRole,
  } = useRolePermissions();

  const hasWorkflowEditPermission =
    canCreateAppointments ||
    canEditRepairStatus ||
    canEditTechnicianNotes ||
    canEditPostRepairChecks ||
    canEditCheckInCondition;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "All">("All");
  const [dateFilter, setDateFilter] = useState("");

  const [activeId, setActiveId] = useState<string | null>(null);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [pendingEscalateId, setPendingEscalateId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [draftStatus, setDraftStatus] = useState<AppointmentStatus>("Awaiting Diagnosis");
  const [draftAdditionalInformation, setDraftAdditionalInformation] = useState("");
  const [draftCheckInCondition, setDraftCheckInCondition] = useState("");
  const [draftTechnicianNotes, setDraftTechnicianNotes] = useState("");
  const [draftPostRepairCheckNotes, setDraftPostRepairCheckNotes] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("Appointment confirmation");
  const [draftSms, setDraftSms] = useState("");
  const [selectedSmsTemplate, setSelectedSmsTemplate] = useState("Your appointment is confirmed.");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [formError, setFormError] = useState("");

  const [newCustomer, setNewCustomer] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newDeviceType, setNewDeviceType] = useState("");
  const [newDeviceModel, setNewDeviceModel] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("10:00");
  const [newStatus, setNewStatus] = useState<AppointmentStatus>("Awaiting Diagnosis");
  const [newAdditionalInformation, setNewAdditionalInformation] = useState("");
  const [newCheckInCondition, setNewCheckInCondition] = useState("");
  const [newWaterDamage, setNewWaterDamage] = useState<"Yes" | "No">("No");
  const [newBackGlassCracked, setNewBackGlassCracked] = useState<"Yes" | "No">("No");

  const showAdditionalInformation = !isTechnicianRole(selectedRole);

  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = window.setTimeout(() => setFeedbackMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [feedbackMessage]);

  // Deep-link: open a specific appointment when navigated here from Customer Search
  useEffect(() => {
    if (incomingId) {
      setActiveId(incomingId);
      setModalMode("view");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingId]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Site isolation — only show records belonging to the active site (or legacy records with no siteId)
      if (apt.siteId && apt.siteId !== selectedSiteId) return false;
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        (apt.customer ?? "").toLowerCase().includes(searchLower) ||
        (apt.device ?? "").toLowerCase().includes(searchLower) ||
        (apt.id ?? "").toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === "All" || apt.status === statusFilter;
      const matchesDate = !dateFilter || apt.date === dateFilter;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, search, statusFilter, dateFilter, selectedSiteId]);

  const summary = useMemo(() => ({
    total: filteredAppointments.length,
    scheduled: filteredAppointments.filter(
      (a) => a.status === "Awaiting Diagnosis" || a.status === "Awaiting Repair"
    ).length,
    inProgress: filteredAppointments.filter((a) => a.status === "In Progress").length,
    completed: filteredAppointments.filter((a) => a.status === "Completed").length,
  }), [filteredAppointments]);

  const statusCounts = useMemo(() => {
    const counts: Record<AppointmentStatus, number> = {
      "Awaiting Diagnosis": 0,
      "Awaiting Repair": 0,
      "In Progress": 0,
      "Post Repair Check": 0,
      "Ready For Collection": 0,
      "Ready For Collection (Unsuccessful)": 0,
      "Awaiting Parts": 0,
      "Awaiting Customer Reply": 0,
      "Completed": 0,
      "Cancelled": 0,
      "Closed": 0,
    };
    filteredAppointments.forEach((apt) => {
      if (apt.status in counts) counts[apt.status] += 1;
    });
    return counts;
  }, [filteredAppointments]);

  const activeAppointment = useMemo(
    () => appointments.find((a) => a.id === activeId) ?? null,
    [appointments, activeId]
  );

  const progressAppointment = useMemo(
    () => appointments.find((a) => a.id === progressId) ?? null,
    [appointments, progressId]
  );

  function openModal(id: string, mode: "view" | "edit") {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return;

    const actor = selectedRole;
    const resolvedMode =
      mode === "edit"
        ? getWorkflowModeForRecord(apt, actor, hasWorkflowEditPermission)
        : "view";

    if (resolvedMode === "edit" && !apt.isLocked) {
      updateAppointmentInContext(id, {
        isLocked: true,
        lockedAt: new Date().toLocaleString(),
        lockedBy: actor,
        lockReason: "Locked for editing",
      });
    }

    setActiveId(id);
    setModalMode(resolvedMode);
    setDraftStatus(apt.status);
    setDraftAdditionalInformation(apt.additionalInformation ?? "");
    setDraftCheckInCondition(apt.checkInCondition ?? "");
    setDraftTechnicianNotes(apt.technicianNotes ?? "");
    setDraftPostRepairCheckNotes(apt.postRepairCheckNotes ?? "");
    setDraftEmail(emailTemplateBodies[selectedTemplate] ?? "");
    setFeedbackMessage(
      resolvedMode === "view" && isLockedByAnotherUser(apt, actor)
        ? getLockBannerText(apt, actor)
        : ""
    );
  }

  function closeModal() {
    if (activeId && activeAppointment?.isLocked && activeAppointment.lockedBy === selectedRole) {
      updateAppointmentInContext(activeId, {
        isLocked: false,
        lockedAt: undefined,
        lockedBy: undefined,
        lockReason: undefined,
      });
    }
    setActiveId(null);
    setFeedbackMessage("");
  }

  function openCreateModal() {
    setShowCreateModal(true);
    setFormError("");
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    setFormError("");
    setNewCustomer("");
    setNewBrand("");
    setNewDeviceType("");
    setNewDeviceModel("");
    setNewDate("");
    setNewTime("10:00");
    setNewStatus("Awaiting Diagnosis");
    setNewAdditionalInformation("");
    setNewCheckInCondition("");
    setNewWaterDamage("No");
    setNewBackGlassCracked("No");
  }

  function openProgressModal(id: string) {
    setProgressId(id);
  }

  function closeProgressModal() {
    setProgressId(null);
  }

  function handleLockAppointment(id: string) {
    updateAppointmentInContext(id, {
      isLocked: true,
      lockedAt: new Date().toLocaleString(),
      lockedBy: selectedRole,
      lockReason: "Manually locked",
    });
    setFeedbackMessage(`Record ${id} locked.`);
  }

  function handleUnlockAppointment(id: string) {
    updateAppointmentInContext(id, {
      isLocked: false,
      lockedAt: undefined,
      lockedBy: undefined,
      lockReason: undefined,
    });
    setFeedbackMessage(`Record ${id} unlocked.`);
  }

  function handleEscalate(id: string) {
    const apt = appointments.find((a) => a.id === id);
    if (!apt || apt.escalatedToJobId) return;
    setPendingEscalateId(id);
  }

  function confirmEscalate() {
    const id = pendingEscalateId;
    setPendingEscalateId(null);
    if (!id) return;
    const apt = appointments.find((a) => a.id === id);
    if (!apt || apt.escalatedToJobId) return;

    const nameParts = (apt.customer ?? "").trim().split(/\s+/);
    const customerFirstName = nameParts[0] ?? "";
    const customerLastName = nameParts.slice(1).join(" ") || "";

    const newJob = createJob({
      customerId: apt.customerId ?? "",
      appointmentId: id,
      customerFirstName: apt.customerInfo?.firstName ?? customerFirstName,
      customerLastName: apt.customerInfo?.lastName ?? customerLastName,
      customerEmail: apt.customerInfo?.email ?? "",
      customerPhone: apt.customerInfo?.phoneNumber ?? "",
      addressLine1: apt.customerInfo?.addressLine1 ?? "",
      addressLine2: apt.customerInfo?.addressLine2 ?? "",
      county: apt.customerInfo?.county ?? "",
      postcode: apt.customerInfo?.postcode ?? "",

      brand: apt.deviceInfo?.brand ?? apt.brand ?? "",
      deviceType: apt.deviceInfo?.deviceType ?? apt.deviceType ?? "",
      deviceModel: apt.deviceInfo?.deviceModel ?? apt.deviceModel ?? "",
      colour: apt.deviceInfo?.colour ?? "",
      imei: apt.deviceInfo?.imei ?? "",
      serialNumber: apt.deviceInfo?.serialNumber ?? "",
      checkInCondition: apt.deviceInfo?.checkInCondition ?? apt.checkInCondition ?? "",

      paymentAmount: apt.paymentInfo?.amount ?? "",
      paymentType: apt.paymentInfo?.paymentType ?? "",
      paymentStatus: apt.paymentInfo?.paymentStatus ?? "",

      status: "New",
      priority: "Medium",
      suggestedPriority: "Medium",
      category: "General",
      priorityWasOverridden: false,
      ber: false,
      qcStatus: "",
      backglass: apt.deviceInfo?.backGlassCracked ?? apt.backGlassCracked ?? "No",
      partRequired: "",
      partAllocated: "",
      partName: "",
      partType: "",
      partSupplier: "",
      partStatus: "",
      repairStartTime: "",
      repairEndTime: "",
      repairDurationMinutes: "",
      isDeleted: false,
      deletedAt: "",
      deletedBy: "",
      restoredAt: "",
      restoredBy: "",
    });

    updateAppointmentInContext(id, { escalatedToJobId: newJob.id });
    logEvent(id, "APPOINTMENT_ESCALATED", `Appointment ${id} escalated to Job ${newJob.id} by ${selectedRole}.`, { entityType: "appointment", createdBy: selectedRole });
    setFeedbackMessage(`Appointment ${id} escalated to Job ${newJob.id}.`);
  }

  async function handleDeleteAppointment(id: string) {
    const confirmed = window.confirm(`Delete appointment ${id}? This cannot be undone.`);
    if (!confirmed) return;
    await deleteAppointment(id);
    logEvent(id, "APPOINTMENT_DELETED", `Appointment ${id} deleted by ${selectedRole}.`, { entityType: "appointment", createdBy: selectedRole });
    closeModal();
    setFeedbackMessage(`Appointment ${id} deleted.`);
  }

  function handleCreateAppointment() {
    if (
      !newCustomer.trim() ||
      !newBrand.trim() ||
      !newDeviceType.trim() ||
      !newDeviceModel.trim() ||
      !newDate.trim()
    ) {
      setFormError("Customer, brand, device type, device model, and date are required.");
      return;
    }

    // Try to match an existing customer by full name so the link is preserved
    const nameTrimmed = newCustomer.trim().toLowerCase();
    const matchedCustomer = customers.find(
      (c) => `${c.firstName} ${c.lastName}`.toLowerCase() === nameTrimmed
    );

    const newRecord = createAppointmentPipeline({
      input: {
        customer: newCustomer.trim(),
        customerId: matchedCustomer?.id ?? "",
        brand: newBrand.trim(),
        deviceType: newDeviceType.trim(),
        deviceModel: newDeviceModel.trim(),
        date: newDate,
        time: newTime,
        status: newStatus,
        additionalInformation: newAdditionalInformation,
        checkInCondition: newCheckInCondition,
        waterDamage: newWaterDamage,
        backGlassCracked: newBackGlassCracked,
        siteId: selectedSiteId,
      },
      existingAppointments: appointments,
      selectedRole,
    });

    addAppointment(newRecord);
    logEvent(newRecord.id, "APPOINTMENT_CREATED", `Appointment ${newRecord.id} created for ${newRecord.customer} (${newRecord.device}) by ${selectedRole}.`, { entityType: "appointment", createdBy: selectedRole });
    setFeedbackMessage(`Appointment ${newRecord.id} created.`);
    closeCreateModal();
  }

  function handleQuickProgress(nextStatus: AppointmentStatus) {
    if (!progressId || !canEditRepairStatus) return;

    const apt = appointments.find((a) => a.id === progressId);
    const activityEntry: AppointmentActivityEntry = {
      type: "STATUS",
      message: `Status updated to ${nextStatus}`,
      user: selectedRole,
      role: selectedRole,
      timestamp: new Date().toLocaleString(),
    };

    updateAppointmentInContext(progressId, {
      status: nextStatus,
      activityLog: [activityEntry, ...(apt?.activityLog ?? [])],
    });

    setFeedbackMessage(`${progressId} progressed to ${nextStatus}.`);
    closeProgressModal();
  }

  function handleSave() {
    if (!activeId) return;

    const apt = appointments.find((a) => a.id === activeId);
    const activityEntry: AppointmentActivityEntry = {
      type: "STATUS",
      message: `Record updated by ${selectedRole}`,
      user: selectedRole,
      role: selectedRole,
      timestamp: new Date().toLocaleString(),
    };

    updateAppointmentInContext(activeId, {
      status: draftStatus,
      additionalInformation: draftAdditionalInformation,
      checkInCondition: draftCheckInCondition,
      technicianNotes: draftTechnicianNotes,
      postRepairCheckNotes: draftPostRepairCheckNotes,
      isLocked: false,
      lockedAt: undefined,
      lockedBy: undefined,
      lockReason: undefined,
      activityLog: [activityEntry, ...(apt?.activityLog ?? [])],
      updatedAt: new Date().toISOString(),
    });

    logEvent(activeId, "APPOINTMENT_UPDATED", `Appointment ${activeId} updated by ${selectedRole}. Status: ${draftStatus}.`, { entityType: "appointment", createdBy: selectedRole });
    setFeedbackMessage("Changes saved.");
    setActiveId(null);
  }

  function handleSendEmail() {
    if (!activeId) return;
    const apt = appointments.find((a) => a.id === activeId);
    const activityEntry: AppointmentActivityEntry = {
      type: "EMAIL",
      message: `Email sent using template: ${selectedTemplate}`,
      user: selectedRole,
      role: selectedRole,
      timestamp: new Date().toLocaleString(),
    };
    updateAppointmentInContext(activeId, {
      activityLog: [activityEntry, ...(apt?.activityLog ?? [])],
    });
    setFeedbackMessage("Email logged.");
  }

  function handleSendSms() {
    if (!activeId) return;
    const apt = appointments.find((a) => a.id === activeId);
    const activityEntry: AppointmentActivityEntry = {
      type: "SMS",
      message: `SMS sent: ${selectedSmsTemplate}`,
      user: selectedRole,
      role: selectedRole,
      timestamp: new Date().toLocaleString(),
    };
    updateAppointmentInContext(activeId, {
      activityLog: [activityEntry, ...(apt?.activityLog ?? [])],
    });
    setFeedbackMessage("SMS logged.");
  }

  function handleTemplateChange(template: string) {
    setSelectedTemplate(template);
    setDraftEmail(emailTemplateBodies[template] ?? "");
  }

  function handleSmsTemplateChange(template: string) {
    setSelectedSmsTemplate(template);
    setDraftSms(smsTemplateBodies[template] ?? template);
  }

  return (
    <section className="ms-appointments-page">
      <AppointmentHeader
        selectedRole={selectedRole}
        canCreateAppointments={canCreateAppointments}
        onNewAppointment={openCreateModal}
      />

      <AppointmentStats
        total={summary.total}
        scheduled={summary.scheduled}
        inProgress={summary.inProgress}
        completed={summary.completed}
      />

      <div className="ms-appointments-page__panel ms-appointments-page__status-summary">
        <div className="ms-appointments-page__status-items">
          <span className="ms-appointments-page__status-pill is-awaiting-diagnosis">
            Awaiting Diagnosis: {statusCounts["Awaiting Diagnosis"]}
          </span>
          <span className="ms-appointments-page__status-pill is-awaiting-repair">
            Awaiting Repair: {statusCounts["Awaiting Repair"]}
          </span>
          <span className="ms-appointments-page__status-pill is-in-progress">
            In Progress: {statusCounts["In Progress"]}
          </span>
          <span className="ms-appointments-page__status-pill is-post-repair-check">
            Post Repair Check: {statusCounts["Post Repair Check"]}
          </span>
          <span className="ms-appointments-page__status-pill is-ready-for-collection">
            Ready For Collection: {statusCounts["Ready For Collection"]}
          </span>
          <span className="ms-appointments-page__status-pill is-awaiting-parts">
            Awaiting Parts: {statusCounts["Awaiting Parts"]}
          </span>
          <span className="ms-appointments-page__status-pill is-completed">
            Completed: {statusCounts["Completed"]}
          </span>
          <span className="ms-appointments-page__status-pill is-cancelled">
            Cancelled: {statusCounts["Cancelled"]}
          </span>
        </div>
      </div>

      <div className="ms-appointments-page__panel">
        <AppointmentToolbar
          search={search}
          statusFilter={statusFilter}
          dateFilter={dateFilter}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
          onDateChange={setDateFilter}
        />

        {feedbackMessage ? (
          <div className="ms-appointments-page__feedback">{feedbackMessage}</div>
        ) : null}

        <AppointmentTable
          appointments={filteredAppointments}
          canEdit={hasWorkflowEditPermission}
          canDelete={canDeleteRecords}
          onView={(id) => openModal(id, "view")}
          onEdit={(id) => openModal(id, "edit")}
          onProgress={openProgressModal}
          onLock={handleLockAppointment}
          onUnlock={handleUnlockAppointment}
          onEscalate={handleEscalate}
          onDelete={(id) => void handleDeleteAppointment(id)}
        />
      </div>

      {showCreateModal ? (
        <div className="ms-appointments-create-modal__backdrop" onClick={closeCreateModal}>
          <div
            className="ms-appointments-create-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="ms-appointments-create-modal__header">
              <div>
                <h3>New Appointment</h3>
                <p>Create a new appointment record.</p>
              </div>
              <button
                type="button"
                className="ms-appointments-create-modal__close"
                onClick={closeCreateModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="ms-appointments-create-modal__body">
              <div className="ms-appointments-create-modal__grid">
                <div className="ms-appointments-create-modal__field">
                  <label>Customer</label>
                  <input value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)} />
                </div>

                <div className="ms-appointments-create-modal__field">
                  <label>Brand</label>
                  <input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} />
                </div>

                <div className="ms-appointments-create-modal__field">
                  <label>Device Type</label>
                  <input value={newDeviceType} onChange={(e) => setNewDeviceType(e.target.value)} />
                </div>

                <div className="ms-appointments-create-modal__field">
                  <label>Device Model</label>
                  <input value={newDeviceModel} onChange={(e) => setNewDeviceModel(e.target.value)} />
                </div>

                <div className="ms-appointments-create-modal__field">
                  <label>Date</label>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </div>

                <div className="ms-appointments-create-modal__field">
                  <label>Time</label>
                  <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                </div>

                <div className="ms-appointments-create-modal__field">
                  <label>Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as AppointmentStatus)}
                  >
                    {allAppointmentStatuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="ms-appointments-create-modal__field">
                  <label>Water Damage</label>
                  <select
                    value={newWaterDamage}
                    onChange={(e) => setNewWaterDamage(e.target.value as "Yes" | "No")}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div className="ms-appointments-create-modal__field">
                  <label>Back Glass Cracked</label>
                  <select
                    value={newBackGlassCracked}
                    onChange={(e) => setNewBackGlassCracked(e.target.value as "Yes" | "No")}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div className="ms-appointments-create-modal__field ms-appointments-create-modal__field--full">
                  <label>Check In Condition</label>
                  <textarea
                    value={newCheckInCondition}
                    onChange={(e) => setNewCheckInCondition(e.target.value)}
                  />
                </div>

                {showAdditionalInformation ? (
                  <div className="ms-appointments-create-modal__field ms-appointments-create-modal__field--full">
                    <label>Additional Information</label>
                    <textarea
                      value={newAdditionalInformation}
                      onChange={(e) => setNewAdditionalInformation(e.target.value)}
                    />
                  </div>
                ) : null}
              </div>

              {formError ? (
                <div className="ms-appointments-create-modal__error">{formError}</div>
              ) : null}
            </div>

            <div className="ms-appointments-create-modal__footer">
              <button
                type="button"
                className="ms-appointments-create-modal__secondary"
                onClick={closeCreateModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ms-appointments-create-modal__primary"
                onClick={handleCreateAppointment}
              >
                Create Appointment
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {progressAppointment ? (
        <div
          className="ms-appointments-progress-modal__backdrop"
          onClick={closeProgressModal}
        >
          <div
            className="ms-appointments-progress-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Progress Appointment</h3>
            <p>
              {progressAppointment.id} · {progressAppointment.customer}
            </p>
            <div className="ms-appointments-progress-modal__options">
              {allAppointmentStatuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleQuickProgress(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {pendingEscalateId ? (() => {
        const apt = appointments.find((a) => a.id === pendingEscalateId);
        return (
          <div className="ms-appointments-confirm-modal__backdrop" onClick={() => setPendingEscalateId(null)}>
            <div
              className="ms-appointments-confirm-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <h3 className="ms-appointments-confirm-modal__title">Escalate to Job?</h3>
              <p className="ms-appointments-confirm-modal__body">
                This will create a new repair job for <strong>{apt?.customer ?? pendingEscalateId}</strong>
                {apt?.device ? <> · <em>{apt.device}</em></> : null}.
                <br />
                This action cannot be undone — the appointment will be linked to the job permanently.
              </p>
              <div className="ms-appointments-confirm-modal__actions">
                <button
                  type="button"
                  className="ms-appointments-confirm-modal__cancel"
                  onClick={() => setPendingEscalateId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ms-appointments-confirm-modal__confirm"
                  onClick={confirmEscalate}
                >
                  Create Job
                </button>
              </div>
            </div>
          </div>
        );
      })() : null}

      {activeAppointment ? (
        <AppointmentModal
          appointment={activeAppointment}
          mode={modalMode}
          draftStatus={draftStatus}
          draftAdditionalInformation={draftAdditionalInformation}
          draftCheckInCondition={draftCheckInCondition}
          draftTechnicianNotes={draftTechnicianNotes}
          draftPostRepairCheckNotes={draftPostRepairCheckNotes}
          draftEmail={draftEmail}
          selectedTemplate={selectedTemplate}
          draftSms={draftSms}
          selectedSmsTemplate={selectedSmsTemplate}
          showAdditionalInformation={showAdditionalInformation}
          canEdit={canEditRecord(activeAppointment, selectedRole, hasWorkflowEditPermission)}
          canDelete={canDeleteRecords}
          onClose={closeModal}
          onDelete={() => void handleDeleteAppointment(activeAppointment.id)}
          onStatusChange={setDraftStatus}
          onAdditionalInformationChange={setDraftAdditionalInformation}
          onCheckInConditionChange={setDraftCheckInCondition}
          onTechnicianNotesChange={setDraftTechnicianNotes}
          onPostRepairCheckNotesChange={setDraftPostRepairCheckNotes}
          onEmailChange={setDraftEmail}
          onTemplateChange={handleTemplateChange}
          onSmsChange={setDraftSms}
          onSmsTemplateChange={handleSmsTemplateChange}
          onSendEmail={handleSendEmail}
          onSendSms={handleSendSms}
          onSave={handleSave}
        />
      ) : null}
    </section>
  );
}
