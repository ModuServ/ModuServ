import "./RepairTracking.css";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAppointments } from "../../context/AppointmentContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { useAudit } from "../../../context/AuditContext";
import { useSite } from "../../../context/SiteContext";
import {
  canEditRecord,
  getLockBannerText,
  getWorkflowModeForRecord,
  isLockedByAnotherUser
} from "../../services/workflowRules";
import { safeText } from "../../utils/sanitiser";
import type { AppointmentRecord, AppointmentStatus } from "../appointments/appointmentTypes";
import type {
  WorkflowCommunicationState,
  WorkflowSnapshot,
  WorkflowActivityEntry,
  WorkflowTriggerSettings,
} from "./workflowTypes";
import { initialWorkflowCommunicationState } from "./data/repairData";
import {
  buildWorkflowSummary,
  createWorkflowSnapshot,
  filterWorkflowRecords,
  getWorkflowEmailTemplateBody,
} from "./utils/workflowUtils";
import RepairHeader from "./components/RepairHeader";
import RepairStats from "./components/RepairStats";
import RepairToolbar from "./components/RepairToolbar";
import RepairTable from "./components/RepairTable";
import RepairModal from "./components/RepairModal";
import "./components/RepairLayoutFix.css";

const originalSnapshots = new Map<string, WorkflowSnapshot>();

const defaultTriggerSettings: WorkflowTriggerSettings = {
  activity: true,
  email: false,
  sms: false,
};

const resetSnapshot: WorkflowSnapshot = {
  status: "Awaiting Diagnosis",
  technicianNotes: "",
  postRepairCheckNotes: "",
};

const allWorkflowStatuses: AppointmentStatus[] = [
  "Awaiting Diagnosis",
  "Awaiting Repair",
  "In Progress",
  "Post Repair Check",
  "Ready For Collection",
  "Ready For Collection (Unsuccessful)",
  "Awaiting Parts",
  "Awaiting Customer Reply",
  "Completed",
  "Cancelled",
  "Closed",
];

export default function RepairTracking() {
  const { appointments, updateAppointment, deleteAppointment } = useAppointments();
  const { selectedSiteId } = useSite();
  const location = useLocation();
  const incomingId = (location.state as { openId?: string } | null)?.openId ?? null;
  const {
    canEditWorkflowStatus,
    canEditTechnicianNotes,
    canEditPostRepairChecks,
    canDeleteRecords,
    selectedRole,
  } = useRolePermissions();
  const { logEvent } = useAudit();

  const hasWorkflowEditPermission =
    canEditWorkflowStatus || canEditTechnicianNotes || canEditPostRepairChecks;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "All">("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [activeId, setActiveId] = useState<string | null>(null);

  // Deep-link: open a specific record when navigated here from Customer Search
  useEffect(() => {
    if (incomingId) {
      setActiveId(incomingId);
      setModalMode('view');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingId]);

  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [progressRecordId, setProgressAppointmentId] = useState<string | null>(null);

  const [draftStatus, setDraftStatus] = useState<AppointmentStatus>("Awaiting Diagnosis");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftPostRepair, setDraftPostRepair] = useState("");

  const [triggerSettings, setTriggerSettings] = useState<WorkflowTriggerSettings>(defaultTriggerSettings);
  const [message, setMessage] = useState("");

  const [communication, setCommunication] =
    useState<WorkflowCommunicationState>(initialWorkflowCommunicationState);

  function logActivity(type: WorkflowActivityEntry["type"], messageText: string) {
    const timestamp = new Date().toLocaleString();

    const entry: WorkflowActivityEntry = {
      type,
      message: messageText,
      user: "admin",
      role: selectedRole || "Unknown",
      timestamp,
    };

    setCommunication((prev) => ({
      ...prev,
      activityLog: [entry, ...prev.activityLog],
    }));
  }

  const safeAppointments = useMemo(
    () => (appointments ?? []).filter((a) => !a.siteId || a.siteId === selectedSiteId),
    [appointments, selectedSiteId]
  );

  const filtered = useMemo(() => {
    const base = filterWorkflowRecords(safeAppointments as AppointmentRecord[], search, statusFilter);

    return base.filter((job) => {
      if (!job.createdAt) return true;

      const createdDate = new Date(job.createdAt);
      const createdDay = new Date(
        createdDate.getFullYear(),
        createdDate.getMonth(),
        createdDate.getDate()
      );

      if (dateFrom) {
        const from = new Date(dateFrom);
        if (createdDay < from) return false;
      }

      if (dateTo) {
        const to = new Date(dateTo);
        if (createdDay > to) return false;
      }

      return true;
    });
  }, [safeAppointments, search, statusFilter, dateFrom, dateTo]);

  const summary = useMemo(() => {
    return buildWorkflowSummary(filtered as AppointmentRecord[]);
  }, [filtered]);

    const stageCounts = useMemo(() => {
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

    filtered.forEach((job) => {
      counts[job.status] += 1;
    });

    return counts;
  }, [filtered]);

  const activeJob = useMemo(
    () => safeAppointments.find((appointment) => appointment.id === activeId) ?? null,
    [safeAppointments, activeId]
  );

  const activeLockBanner = useMemo(() => {
    return getLockBannerText(activeJob, selectedRole || "Unknown");
  }, [activeJob, selectedRole]);

  const progressRecord = useMemo(
    () => safeAppointments.find((appointment) => appointment.id === progressRecordId) ?? null,
    [safeAppointments, progressRecordId]
  );

  function primeModal(appointmentId: string, mode: "view" | "edit") {
    const appointment = safeAppointments.find((item) => item.id === appointmentId);
    if (!appointment) return;

    originalSnapshots.set(appointment.id, createWorkflowSnapshot(appointment as AppointmentRecord));

    setModalMode(mode);
    setActiveId(appointment.id);
    setDraftStatus(appointment.status as AppointmentStatus);
    setDraftNotes(appointment.technicianNotes || "");
    setDraftPostRepair(appointment.postRepairCheckNotes || "");
    setTriggerSettings(defaultTriggerSettings);
    setCommunication({
      ...initialWorkflowCommunicationState,
      draftEmail: getWorkflowEmailTemplateBody(initialWorkflowCommunicationState.selectedTemplate),
    });
    setMessage("");
  }

  function openViewModal(appointmentId: string) {
    primeModal(appointmentId, "view");
    setMessage("");
  }

  function openEditModal(appointmentId: string) {
    const appointment = safeAppointments.find((item) => item.id === appointmentId);
    if (!appointment) return;

    const actor = selectedRole || "Unknown";
    const mode = getWorkflowModeForRecord(appointment, actor, hasWorkflowEditPermission);

    if (mode === "edit" && !appointment.isLocked) {
      updateAppointment(appointmentId, {
        isLocked: true,
        lockedAt: new Date().toLocaleString(),
        lockedBy: actor,
        lockReason: "Locked by workflow dashboard",
      });
    }

    primeModal(appointmentId, mode);

    if (mode === "view" && isLockedByAnotherUser(appointment, actor)) {
      setMessage(getLockBannerText(appointment, actor));
    }
  }

  function closeModal() {
    setActiveId(null);
    setMessage("");
  }

  async function handleDeleteRecord(id: string) {
    const confirmed = window.confirm(`Delete repair record ${id}? This cannot be undone.`);
    if (!confirmed) return;
    await deleteAppointment(id);
    logEvent(id, "APPOINTMENT_DELETED", `Repair record ${id} deleted by ${selectedRole}.`, { entityType: "appointment", createdBy: selectedRole });
    closeModal();
  }

  function openProgressModal(appointmentId: string) {
    const appointment = safeAppointments.find((item) => item.id === appointmentId);
    if (!appointment) return;
    setProgressAppointmentId(appointment.id);
  }

  function closeProgressModal() {
    setProgressAppointmentId(null);
  }

  function handleTriggerChange(key: keyof WorkflowTriggerSettings, value: boolean) {
    setTriggerSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    if (!activeId) return;

    const original = originalSnapshots.get(activeId);
    if (!original) return;

    setDraftStatus(original.status);
    setDraftNotes(original.technicianNotes);
    setDraftPostRepair(original.postRepairCheckNotes);
    setTriggerSettings(defaultTriggerSettings);
    setMessage("Changes reset to original values.");
    logActivity("SYSTEM", `Reset unsaved changes for ${activeId}`);
  }

  function handleTableReset(appointmentId: string) {
    const appointment = filtered.find((item) => item.id === appointmentId);
    if (!appointment) return;

    updateAppointment(appointmentId, {
      status: resetSnapshot.status,
      technicianNotes: resetSnapshot.technicianNotes,
      postRepairCheckNotes: resetSnapshot.postRepairCheckNotes,
    });

    if (activeId === appointmentId) {
      setDraftStatus(resetSnapshot.status);
      setDraftNotes(resetSnapshot.technicianNotes);
      setDraftPostRepair(resetSnapshot.postRepairCheckNotes);
    }

    setMessage(`${appointment.id} reset to original baseline.`);
  }

  
  function handleLockRecord(appointmentId: string) {
    updateAppointment(appointmentId, {
      isLocked: true,
      lockedAt: new Date().toLocaleString(),
      lockedBy: selectedRole || "Unknown",
      lockReason: "Locked by workflow dashboard",
    });

    setMessage(`Record ${appointmentId} locked.`);
  }

  function handleUnlockRecord(appointmentId: string) {
    updateAppointment(appointmentId, {
      isLocked: false,
      lockedAt: undefined,
      lockedBy: undefined,
      lockReason: undefined,
    });

    setMessage(`Record ${appointmentId} unlocked.`);
  }
function handleQuickProgress(nextStatus: AppointmentStatus) {
    if (!progressRecord || !canEditWorkflowStatus) return;
    if (progressRecord.status === nextStatus) return;

    updateAppointment(progressRecord.id, { status: nextStatus });
    setMessage(`${progressRecord.id} moved to ${nextStatus}.`);
    closeProgressModal();
  }

  function handleTemplateChange(value: string) {
    setCommunication((prev) => ({
      ...prev,
      selectedTemplate: value,
      draftEmail: getWorkflowEmailTemplateBody(value),
    }));
  }

  function handleEmailChange(value: string) {
    setCommunication((prev) => ({
      ...prev,
      draftEmail: value,
    }));
  }

  function handleSendEmail() {
    if (!activeJob) return;

    logActivity("EMAIL", `Email sent for ${activeJob.id}: ${communication.selectedTemplate}`);
    setMessage("Email logged successfully.");
  }

  function handleSmsTemplateChange(value: string) {
    setCommunication((prev) => ({
      ...prev,
      selectedSmsTemplate: value,
      draftSms: value,
    }));
  }

  function handleSmsChange(value: string) {
    setCommunication((prev) => ({
      ...prev,
      draftSms: value,
    }));
  }

  function handleSendSms() {
    if (!activeJob) return;

    logActivity("SMS", `SMS sent for ${activeJob.id}: ${communication.draftSms}`);
    setMessage("SMS logged successfully.");
  }

  function handleCallLogChange(value: string) {
    setCommunication((prev) => ({
      ...prev,
      callLog: value,
    }));
  }

  function handleAddCallLog() {
    const trimmed = communication.callLog.trim();
    if (!trimmed) return;

    const timestamp = new Date().toLocaleString();

    setCommunication((prev) => ({
      ...prev,
      callAttempts: [`${timestamp} - ${trimmed}`, ...prev.callAttempts],
      callLog: "",
    }));

    logActivity("CALL", `Call log added: ${trimmed}`);
    setMessage("Call log added successfully.");
  }

  function saveChanges() {
    if (!activeId) return;

    const original = originalSnapshots.get(activeId);
    const payload: Partial<AppointmentRecord> = {};
    let changed = false;

    if (canEditWorkflowStatus && original?.status !== draftStatus) {
      payload.status = draftStatus;
      changed = true;

      if (triggerSettings.activity) {
        logActivity("STATUS", `Status changed to ${draftStatus}`);
      }
      if (triggerSettings.email) {
        logActivity("EMAIL", `Email trigger fired for status ${draftStatus}`);
      }
      if (triggerSettings.sms) {
        logActivity("SMS", `SMS trigger fired for status ${draftStatus}`);
      }
    }

    if (canEditTechnicianNotes && original?.technicianNotes !== draftNotes) {
      payload.technicianNotes = draftNotes;
      changed = true;
      logActivity(
        "NOTE",
        `Technician notes updated: "${original?.technicianNotes || ""}" ? "${draftNotes || ""}"`
      );
    }

    if (canEditPostRepairChecks && original?.postRepairCheckNotes !== draftPostRepair) {
      payload.postRepairCheckNotes = draftPostRepair;
      changed = true;
      logActivity(
        "POST_REPAIR",
        `Post-repair notes updated: "${original?.postRepairCheckNotes || ""}" ? "${draftPostRepair || ""}"`
      );
    }

    if (!changed) {
      setMessage("No changes to save.");
      return;
    }

    updateAppointment(activeId, payload);

    originalSnapshots.set(activeId, {
      status: draftStatus,
      technicianNotes: draftNotes,
      postRepairCheckNotes: draftPostRepair,
    });

    setMessage("Saved successfully.");
  }

  return (
    <section className="ms-repair-page">
      <RepairHeader selectedRole={selectedRole} />

      <RepairStats
        total={summary.total}
        inProgress={summary.inProgress}
        postRepair={summary.postRepair}
        ready={summary.ready}
      />

      <div className="ms-repair-page__panel ms-repair-stage-summary">
        <div className="ms-repair-stage-summary__items">
          <span className="ms-repair-stage-summary__pill is-awaiting-diagnosis">
            Awaiting Diagnosis: {stageCounts["Awaiting Diagnosis"]}
          </span>
          <span className="ms-repair-stage-summary__pill is-awaiting-repair">
            Awaiting Repair: {stageCounts["Awaiting Repair"]}
          </span>
          <span className="ms-repair-stage-summary__pill is-in-progress">
            In Progress: {stageCounts["In Progress"]}
          </span>
          <span className="ms-repair-stage-summary__pill is-post-repair">
            Post Repair Check: {stageCounts["Post Repair Check"]}
          </span>
          <span className="ms-repair-stage-summary__pill is-ready">
            Ready For Collection: {stageCounts["Ready For Collection"]}
          </span>
          <span className="ms-repair-stage-summary__pill is-awaiting-parts">
            Awaiting Parts: {stageCounts["Awaiting Parts"]}
          </span>
          <span className="ms-repair-stage-summary__pill is-completed">
            Completed: {stageCounts["Completed"]}
          </span>
          <span className="ms-repair-stage-summary__pill is-cancelled">
            Cancelled: {stageCounts["Cancelled"]}
          </span>
        </div>
      </div>

      <RepairToolbar
        search={search}
        statusFilter={statusFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      {message ? <div className="ms-repair-page__message">{message}</div> : null}

      <RepairTable
        jobs={filtered as AppointmentRecord[]}
        canEdit={hasWorkflowEditPermission}
        canDelete={canDeleteRecords}
        onView={openViewModal}
        onEdit={openEditModal}
        onProgress={openProgressModal}
        onLock={handleLockRecord}
        onUnlock={handleUnlockRecord}
        onDelete={(id) => void handleDeleteRecord(id)}
      />

      {progressRecord ? (
        <div className="ms-repair-progress-modal__backdrop" onClick={closeProgressModal}>
          <div
            className="ms-repair-progress-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="ms-repair-progress-modal__header">
              <div>
                <h3>Progress Appointment</h3>
                <p>
                  {progressRecord.id} • {safeText(progressRecord.customer, "Unknown Customer")} • Current status:{" "}
                  <strong>{progressRecord.status}</strong>
                </p>
              </div>

              <button
                type="button"
                className="ms-repair-progress-modal__close"
                onClick={closeProgressModal}
                aria-label="Close progress modal"
              >
                ×
              </button>
            </div>

            <div className="ms-repair-progress-modal__body">
              <div className="ms-repair-progress-modal__actions-grid">
                {allWorkflowStatuses.map((statusOption) => (
                  <button
                    key={statusOption}
                    type="button"
                    className={`ms-repair-progress-modal__status-button ${progressRecord.status === statusOption ? "is-current" : ""}`}
                    onClick={() => handleQuickProgress(statusOption)}
                    disabled={progressRecord.status === statusOption}
                  >
                    {progressRecord.status === statusOption ? `Current: ${statusOption}` : `Move to ${statusOption}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="ms-repair-progress-modal__footer">
              <button
                type="button"
                className="ms-repair-progress-modal__secondary"
                onClick={closeProgressModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeJob ? (
        <RepairModal modalMode={modalMode}
          job={activeJob}
          draftStatus={draftStatus}
          draftNotes={draftNotes}
          draftPostRepair={draftPostRepair}
          triggerSettings={triggerSettings}
          message={message}
          canEditWorkflowStatus={modalMode === "edit" && canEditRecord(activeJob, selectedRole || "Unknown", canEditWorkflowStatus)}
          canEditTechnicianNotes={modalMode === "edit" && canEditRecord(activeJob, selectedRole || "Unknown", canEditTechnicianNotes)}
          canEditPostRepairChecks={modalMode === "edit" && canEditRecord(activeJob, selectedRole || "Unknown", canEditPostRepairChecks)}
          communication={communication}
          canDelete={canDeleteRecords}
          onDelete={() => void handleDeleteRecord(activeJob.id)}
          onClose={closeModal}
          onStatusChange={setDraftStatus}
          onNotesChange={setDraftNotes}
          onPostRepairChange={setDraftPostRepair}
          onTriggerChange={handleTriggerChange}
          onReset={modalMode === "edit" ? handleReset : undefined}
          onSave={modalMode === "edit" ? saveChanges : undefined}
          onTemplateChange={handleTemplateChange}
          onEmailChange={handleEmailChange}
          onSendEmail={handleSendEmail}
          onSmsTemplateChange={handleSmsTemplateChange}
          onSmsChange={handleSmsChange}
          onSendSms={handleSendSms}
          onCallLogChange={handleCallLogChange}
          onAddCallLog={handleAddCallLog}
        />
      ) : null}
    </section>
  );
}
