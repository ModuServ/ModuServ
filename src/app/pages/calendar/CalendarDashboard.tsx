import "./CalendarDashboard.css";
import { CalendarDays, Clock3, Lock, Plus, Calendar as CalendarIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppointments } from "../../context/AppointmentContext";
import { useSite } from "../../../context/SiteContext";
import PermissionGate from "../../components/auth/PermissionGate";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import {
  canEditRecord,
  getWorkflowModeForRecord,
  getLockBannerText,
  isLockedByAnotherUser
} from "../../services/workflowRules";
import { createAppointmentPipeline } from "../../services/appointmentPipeline";
import type { BlockedSlot, CalendarAppointment, CalendarView } from "./calendarTypes";
import {
  initialBlockedSlots,
  timeSlots,
} from "./data/calendarData";
import { addDays, formatDateKey, startOfWeek, normalizeTimeKey } from "./utils/calendarUtils";
import CalendarToolbar from "./components/CalendarToolbar";
import CalendarDayView from "./components/CalendarDayView";
import CalendarWeekView from "./components/CalendarWeekView";
import CalendarMonthView from "./components/CalendarMonthView";
import CalendarAppointmentModal from "./components/CalendarAppointmentModal";
import AppointmentModal from "../appointments/components/AppointmentModal";
import type { AppointmentRecord, AppointmentStatus } from "../appointments/appointmentTypes";

const brandOptions = ["Apple", "Samsung", "Google", "Huawei", "Xiaomi"];
const deviceTypeOptions = ["Phone", "Tablet", "Laptop", "Smartwatch", "Console"];

function normalizeCalendarTime(time: string) {
  const raw = String(time || "").trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw);

  if (!match) return "00:00";

  let hours = Number(match[1]);
  let minutes = Number(match[2]);

  let roundedMinutes = Math.round(minutes / 15) * 15;

  if (roundedMinutes === 60) {
    hours += 1;
    roundedMinutes = 0;
  }

  hours = ((hours % 24) + 24) % 24;

  return `${String(hours).padStart(2, "0")}:${String(roundedMinutes).padStart(2, "0")}`;
}

function addOneHourToTime(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time || "");
  if (!match) return "01:00";

  const base = new Date(2000, 0, 1, Number(match[1]), Number(match[2]), 0, 0);
  base.setMinutes(base.getMinutes() + 60);

  const hours = base.getHours();
  const minutes = base.getMinutes();

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function parseLocalDate(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey || "");
  if (!match) return new Date();

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);

  return new Date(year, month, day, 9, 0, 0, 0);
}

function mapSharedAppointmentsToCalendar(sharedAppointments: AppointmentRecord[]): CalendarAppointment[] {
  return sharedAppointments.map((item) => ({
    id: item.id,
    customer: item.customer,
    device: item.device,
    repairType: "General Repair",
    date: item.date,
    start: normalizeCalendarTime(item.time),
    end: addOneHourToTime(normalizeCalendarTime(item.time)),
    isLocked: item.isLocked,
    lockedAt: item.lockedAt,
    lockedBy: item.lockedBy,
    lockReason: item.lockReason,
  }));
}

const deviceModelOptions = [
  "iPhone 13",
  "iPhone 14 Pro",
  "Galaxy S24",
  "Galaxy Tab S9",
  "Pixel 8",
  "Pixel Tablet",
  "MacBook Air",
  "Apple Watch Series 9",
  "Nintendo Switch",
];

export default function CalendarDashboard() {
  const {
    canAccessCalendar,
    canCreateAppointments,
    canEditRepairStatus = true,
    selectedRole,
    canEditCheckInCondition = true,
    canEditTechnicianNotes = true,
    canEditPostRepairChecks = true,
    canBlockCalendarSlots = true,
    canUnblockCalendarSlots = true,
  } = useRolePermissions();

  const hasWorkflowEditPermission =
    canCreateAppointments ||
    canEditRepairStatus ||
    canEditCheckInCondition;

  const [view, setView] = useState<CalendarView>("weekly");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const { appointments: allAppointments, addAppointment, updateAppointment } = useAppointments();
  const { selectedSiteId } = useSite();
  // Filter to current site — records without a siteId are treated as global (legacy)
  const sharedAppointments = useMemo(
    () => allAppointments.filter((a) => !a.siteId || a.siteId === selectedSiteId),
    [allAppointments, selectedSiteId]
  );

  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(initialBlockedSlots);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);

  const [showDayAppointmentsModal, setShowDayAppointmentsModal] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");

  const [appointmentForm, setAppointmentForm] = useState({
    customer: "",
    brand: "",
    deviceType: "",
    deviceModel: "",
    repairType: "",
    checkInCondition: "",
    additionalInformation: "",
    initialStatus: "Awaiting Diagnosis",
    date: "2026-04-04",
    start: "09:00",
    end: "10:00",
  });

  const appointments = useMemo<CalendarAppointment[]>(
    () => mapSharedAppointmentsToCalendar(sharedAppointments),
    [sharedAppointments]
  );

  useEffect(() => {
    if (appointments.length === 0) return;

    const sorted = [...appointments]
      .filter((item) => item.date)
      .sort((a, b) => a.date.localeCompare(b.date));

    const latestAppointment = sorted[sorted.length - 1];
    if (latestAppointment?.date) {
      setAnchorDate(parseLocalDate(latestAppointment.date));
    }
  }, [appointments]);

  const weekStart = useMemo(() => startOfWeek(anchorDate), [anchorDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  }, [weekStart]);

  const monthDays = useMemo(() => {
    const first = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 35 }, (_, index) => addDays(gridStart, index));
  }, [anchorDate]);

  const currentDateKey = formatDateKey(anchorDate);

  const weekAppointments = useMemo(() => {
    const validDates = new Set(weekDays.map((day) => formatDateKey(day)));
    return appointments.filter((item) => validDates.has(item.date));
  }, [weekDays, appointments]);

  const weekBlocks = useMemo(() => {
    const validDates = new Set(weekDays.map((day) => formatDateKey(day)));
    return blockedSlots.filter((item) => validDates.has(item.date));
  }, [weekDays, blockedSlots]);

  const dayAppointments = useMemo(() => {
    return appointments.filter((item) => item.date === currentDateKey);
  }, [appointments, currentDateKey]);

  const dayBlocks = useMemo(() => {
    return blockedSlots.filter((item) => item.date === currentDateKey);
  }, [blockedSlots, currentDateKey]);

  const summary = useMemo(() => {
    return {
      total: appointments.length,
      thisWeek: weekAppointments.length,
      blocked: weekBlocks.length,
    };
  }, [appointments, weekAppointments, weekBlocks]);

  const selectedDayAppointments = useMemo(() => {
    return [...sharedAppointments]
      .filter((item) => item.date === selectedDayKey)
      .sort((a, b) => normalizeTimeKey(a.time).localeCompare(normalizeTimeKey(b.time)));
  }, [sharedAppointments, selectedDayKey]);

  const selectedAppointment = useMemo((): AppointmentRecord | null => {
    return sharedAppointments.find((item) => item.id === selectedAppointmentId) ?? null;
  }, [sharedAppointments, selectedAppointmentId]);

  const activeLockBanner = useMemo(() => {
    return getLockBannerText(selectedAppointment, selectedRole || "Unknown");
  }, [selectedAppointment, selectedRole]);
function goPrevious() {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      if (view === "daily") next.setDate(next.getDate() - 1);
      if (view === "weekly") next.setDate(next.getDate() - 7);
      if (view === "monthly") next.setMonth(next.getMonth() - 1);
      return next;
    });
  }

  function goNext() {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      if (view === "daily") next.setDate(next.getDate() + 1);
      if (view === "weekly") next.setDate(next.getDate() + 7);
      if (view === "monthly") next.setMonth(next.getMonth() + 1);
      return next;
    });
  }

  function blockSlot(date: string, start: string) {
    if (!canBlockCalendarSlots) return;
    const exists = blockedSlots.some((slot) => slot.date === date && slot.start === start);
    if (exists) return;

    setBlockedSlots((prev) => [
      ...prev,
      {
        id: `BLK-${String(prev.length + 1).padStart(3, "0")}`,
        date,
        start,
        end: start,
        label: "Blocked",
      },
    ]);
  }

  function unblockSlot(date: string, start: string) {
    if (!canUnblockCalendarSlots) return;
    setBlockedSlots((prev) => prev.filter((slot) => !(slot.date === date && slot.start === start)));
  }

  function openNewAppointmentModal() {
    if (!canCreateAppointments) return;
    setShowNewAppointmentModal(true);
  }

  function closeNewAppointmentModal() {
    setShowNewAppointmentModal(false);
  }

  function updateAppointmentForm<K extends keyof typeof appointmentForm>(
    key: K,
    value: (typeof appointmentForm)[K]
  ) {
    setAppointmentForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleDayPicked(value: string) {
    if (!value) return;
    setAnchorDate(parseLocalDate(value));
    setSelectedDayKey(value);
    setShowDayAppointmentsModal(true);
  }

  function closeDayAppointmentsModal() {
    setShowDayAppointmentsModal(false);
  }

  function openAppointmentFromDayList(appointmentId: string, mode: "view" | "edit" = "view") {
    setModalMode(mode);
    setSelectedAppointmentId(appointmentId);
    setShowDayAppointmentsModal(false);
  }

  function closeSelectedAppointmentModal() {
    setSelectedAppointmentId(null);
    setModalMode("view");
  }

  function createAppointment(event: React.FormEvent) {
    event.preventDefault();

    if (
      !appointmentForm.customer.trim() ||
      !appointmentForm.brand.trim() ||
      !appointmentForm.deviceType.trim() ||
      !appointmentForm.deviceModel.trim() ||
      !appointmentForm.checkInCondition.trim()
    ) {
      return;
    }

    const createdAppointment = createAppointmentPipeline({
      input: {
        customer: appointmentForm.customer.trim(),
        brand: appointmentForm.brand.trim(),
        deviceType: appointmentForm.deviceType.trim(),
        deviceModel: appointmentForm.deviceModel.trim(),
        date: appointmentForm.date,
        time: normalizeCalendarTime(appointmentForm.start),
        checkInCondition: appointmentForm.checkInCondition.trim(),
        additionalInformation: appointmentForm.additionalInformation.trim(),
        status: appointmentForm.initialStatus as AppointmentStatus,
        repairType: appointmentForm.repairType.trim(),
        siteId: selectedSiteId,
      },
      existingAppointments: sharedAppointments,
      selectedRole,
    });

    addAppointment(createdAppointment);

    setShowNewAppointmentModal(false);

    setAppointmentForm({
      customer: "",
      brand: "",
      deviceType: "",
      deviceModel: "",
      repairType: "",
      checkInCondition: "",
      additionalInformation: "",
      initialStatus: "Awaiting Diagnosis",
      date: appointmentForm.date,
      start: "09:00",
      end: "10:00",
    });
  }

  if (!canAccessCalendar) {
    return (
      <section className="ms-calendar">
        <div className="ms-calendar__empty-state">
          <h1>Calendar</h1>
          <p>You do not have access to the calendar.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ms-calendar">
      <div className="ms-calendar__header">
        <div>
          <h1>Calendar</h1>
          <p>Manage appointments, switch views, and block out unavailable time.</p>
          <span className="ms-calendar__role">
            Current active role: <strong>{selectedRole}</strong>
          </span>
        </div>

        <PermissionGate
          allow={canCreateAppointments}
          fallback={
            <button type="button" className="ms-calendar__primary" disabled>
              <Plus size={16} />
              <span>New Appointment</span>
            </button>
          }
        >
          <button type="button" className="ms-calendar__primary" onClick={openNewAppointmentModal}>
            <Plus size={16} />
            <span>New Appointment</span>
          </button>
        </PermissionGate>
      </div>

      <div className="ms-calendar__summary">
        <article className="ms-calendar__summary-card">
          <div className="ms-calendar__summary-icon">
            <CalendarDays size={18} />
          </div>
          <div>
            <span>Total Appointments</span>
            <strong>{summary.total}</strong>
          </div>
        </article>

        <article className="ms-calendar__summary-card">
          <div className="ms-calendar__summary-icon">
            <Clock3 size={18} />
          </div>
          <div>
            <span>This Week</span>
            <strong>{summary.thisWeek}</strong>
          </div>
        </article>

        <article className="ms-calendar__summary-card">
          <div className="ms-calendar__summary-icon">
            <Lock size={18} />
          </div>
          <div>
            <span>Blocked Slots</span>
            <strong>{summary.blocked}</strong>
          </div>
        </article>
      </div>

      <div className="ms-calendar__panel">
        <CalendarToolbar
          view={view}
          setView={setView}
          anchorDate={anchorDate}
          weekDays={weekDays}
          goPrevious={goPrevious}
          goNext={goNext}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px", gap: "8px" }}>
          <label
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid #d6d9e4",
              borderRadius: "10px",
              padding: "10px 14px",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              color: "#374151",
              userSelect: "none",
            }}
          >
            <CalendarIcon size={16} />
            <span>Calendar</span>
            <input
              type="date"
              value={selectedDayKey}
              onChange={(e) => handleDayPicked(e.target.value)}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                width: "100%",
                height: "100%",
                cursor: "pointer",
              }}
            />
          </label>
        </div>

        {view === "daily" ? (
          <CalendarDayView
            anchorDate={anchorDate}
            appointments={dayAppointments}
            blockedSlots={dayBlocks}
            timeSlots={timeSlots}
            onBlock={blockSlot}
            onUnblock={unblockSlot}
          />
        ) : null}

        {view === "weekly" ? (
          <CalendarWeekView
            weekDays={weekDays}
            appointments={weekAppointments}
            blockedSlots={weekBlocks}
            timeSlots={timeSlots}
            onBlock={blockSlot}
            onUnblock={unblockSlot}
          />
        ) : null}

        {view === "monthly" ? (
          <CalendarMonthView
            monthDays={monthDays}
            anchorDate={anchorDate}
            appointments={appointments}
            blockedSlots={blockedSlots}
          />
        ) : null}
      </div>

      {showNewAppointmentModal ? (
        <CalendarAppointmentModal
          form={appointmentForm}
          brandOptions={brandOptions}
          deviceTypeOptions={deviceTypeOptions}
          deviceModelOptions={deviceModelOptions}
          timeSlots={timeSlots}
          canEditCheckInCondition={canEditCheckInCondition}
          canEditTechnicianNotes={canEditTechnicianNotes}
          canEditPostRepairChecks={canEditPostRepairChecks}
          onChange={updateAppointmentForm}
          onClose={closeNewAppointmentModal}
          onSubmit={createAppointment}
        />
      ) : null}

      {showDayAppointmentsModal ? (
        <div
          onClick={closeDayAppointmentsModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(720px, 100%)",
              maxHeight: "80vh",
              overflow: "auto",
              background: "#fff",
              borderRadius: "18px",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 20px",
                borderBottom: "1px solid #edf0f5",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>Appointments for {selectedDayKey}</h3>
                <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                  Double-click an appointment to open its read-only view, or use the arrow to edit.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDayAppointmentsModal}
                style={{
                  border: "1px solid #d6d9e4",
                  background: "#fff",
                  borderRadius: "10px",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
              &times;
              </button>
            </div>

            <div style={{ padding: "16px 20px 20px" }}>
              {selectedDayAppointments.length === 0 ? (
                <div
                  style={{
                    padding: "18px",
                    border: "1px dashed #d6d9e4",
                    borderRadius: "12px",
                    color: "#6b7280",
                  }}
                >
                  No appointments found for this date.
                </div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {selectedDayAppointments.map((item) => (
                    <div
                      key={item.id}
                      onDoubleClick={() => openAppointmentFromDayList(item.id, "view")}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "14px 16px",
                        cursor: "pointer",
                        background: "#fff",
                      }}
                      title="Double-click to open appointment view"
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                            <strong>{item.id}</strong>
                            <span>{normalizeTimeKey(item.time)}</span>
                          </div>

                          <div style={{ marginTop: "6px", fontWeight: 600 }}>{item.customer}</div>
                          <div style={{ marginTop: "4px", color: "#6b7280" }}>{item.device}</div>
                          <div style={{ marginTop: "4px", color: "#6b7280" }}>{item.status}</div>
                        </div>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openAppointmentFromDayList(item.id, "edit");
                          }}
                          style={{
                            border: "1px solid #d6d9e4",
                            background: "#fff",
                            borderRadius: "10px",
                            minWidth: "42px",
                            height: "42px",
                            cursor: "pointer",
                            fontSize: "20px",
                            fontWeight: 700,
                            lineHeight: 1,
                          }}
                          title="Open editable appointment view"
                          aria-label={`Open editable view for ${item.id}`}
                        >
                →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {activeLockBanner ? (
        <div className="ms-calendar-feedback">{activeLockBanner}</div>
      ) : null}

      {selectedAppointment ? (
        <AppointmentModal
          appointment={selectedAppointment}
          mode={modalMode}
          draftStatus={selectedAppointment.status || "Awaiting Diagnosis"}
          draftAdditionalInformation={selectedAppointment.additionalInformation || ""}
          draftCheckInCondition={selectedAppointment.checkInCondition || ""}
          draftTechnicianNotes={selectedAppointment.technicianNotes || ""}
          draftPostRepairCheckNotes={selectedAppointment.postRepairCheckNotes || ""}
          draftEmail={selectedAppointment.draftEmail || ""}
          selectedTemplate={selectedAppointment.selectedTemplate || "Appointment confirmation"}
          draftSms={selectedAppointment.draftSms || ""}
          selectedSmsTemplate={selectedAppointment.selectedSmsTemplate || "Your appointment is confirmed."}
          showAdditionalInformation={true}
          canEdit={modalMode === "edit" && canEditRecord(selectedAppointment, selectedRole || "Unknown", hasWorkflowEditPermission)}
          canEditCheckInCondition={modalMode === "edit" && canEditRecord(selectedAppointment, selectedRole || "Unknown", canEditCheckInCondition)}
          canEditTechnicianNotes={modalMode === "edit" && canEditRecord(selectedAppointment, selectedRole || "Unknown", false)}
          canEditPostRepairChecks={modalMode === "edit" && canEditRecord(selectedAppointment, selectedRole || "Unknown", false)}
          onClose={closeSelectedAppointmentModal}
          onStatusChange={(status) => { if (modalMode === "edit" && canEditRecord(selectedAppointment, selectedRole || "Unknown", canEditRepairStatus)) updateAppointment(selectedAppointment.id, { status }); }}
          onAdditionalInformationChange={(value) => { if (modalMode === "edit" && canEditRecord(selectedAppointment, selectedRole || "Unknown", hasWorkflowEditPermission)) updateAppointment(selectedAppointment.id, { additionalInformation: value }); }}
          onCheckInConditionChange={(value) => { if (modalMode === "edit" && canEditRecord(selectedAppointment, selectedRole || "Unknown", canEditCheckInCondition)) updateAppointment(selectedAppointment.id, { checkInCondition: value }); }}
          onTechnicianNotesChange={(value) => { if (modalMode === "edit" && canEditRecord(selectedAppointment, selectedRole || "Unknown", canEditTechnicianNotes)) updateAppointment(selectedAppointment.id, { technicianNotes: value }); }}
          onPostRepairCheckNotesChange={(value) => { if (modalMode === "edit" && canEditRecord(selectedAppointment, selectedRole || "Unknown", canEditPostRepairChecks)) updateAppointment(selectedAppointment.id, { postRepairCheckNotes: value }); }}
          onEmailChange={(value) => updateAppointment(selectedAppointment.id, { draftEmail: value })}
          onTemplateChange={(value) => updateAppointment(selectedAppointment.id, { selectedTemplate: value })}
          onSmsChange={(value) => updateAppointment(selectedAppointment.id, { draftSms: value })}
          onSmsTemplateChange={(value) => updateAppointment(selectedAppointment.id, { selectedSmsTemplate: value })}
          onSendEmail={() => {}}
          onSendSms={() => {}}
          onSave={() => {}}
        />
      ) : null}
    </section>
  );
}

