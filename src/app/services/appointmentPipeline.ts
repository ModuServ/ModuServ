import type { AppointmentRecord, AppointmentStatus, AppointmentActivityEntry } from "../pages/appointments/appointmentTypes";

type CreateAppointmentInput = {
  customer: string;
  customerId?: string;
  brand: string;
  deviceType: string;
  deviceModel: string;
  date: string;
  time: string;
  checkInCondition: string;
  additionalInformation?: string;
  waterDamage?: "Yes" | "No";
  backGlassCracked?: "Yes" | "No";
  status?: AppointmentStatus;
  repairType?: string;
  siteId?: string;
};

function getNextAppointmentId(existingAppointments: AppointmentRecord[]) {
  const max = existingAppointments.reduce((highest, item) => {
    const match = item.id.match(/APT-(\d+)/i);
    if (!match) return highest;
    const value = Number(match[1]);
    return value > highest ? value : highest;
  }, 0);

  return `APT-${String(max + 1).padStart(3, "0")}`;
}

export function createAppointmentPipeline({
  input,
  existingAppointments,
  selectedRole,
}: {
  input: CreateAppointmentInput;
  existingAppointments: AppointmentRecord[];
  selectedRole: string;
}) {
  const nextId = getNextAppointmentId(existingAppointments);
  const nowIso = new Date().toISOString();
  const timestamp = new Date().toLocaleString();

  const activityLog: AppointmentActivityEntry[] = [
    {
      type: "SYSTEM",
      message: `Appointment created with status ${input.status || "Awaiting Diagnosis"}. Brand: ${input.brand}. Device Type: ${input.deviceType}. Device Model: ${input.deviceModel}. Water Damage: ${input.waterDamage || "No"}. Back Glass Cracked: ${input.backGlassCracked || "No"}.`,
      user: "admin",
      role: selectedRole,
      timestamp,
    },
  ];

  const appointment: AppointmentRecord = {
    id: nextId,
    customer: input.customer,
    customerId: input.customerId ?? "",
    brand: input.brand,
    deviceType: input.deviceType,
    deviceModel: input.deviceModel,
    device: `${input.brand} ${input.deviceModel}`.trim(),
    repairType: input.repairType || "General Repair",
    date: input.date,
    time: input.time,
    status: input.status || "Awaiting Diagnosis",
    additionalInformation: input.additionalInformation || "",
    checkInCondition: input.checkInCondition,
    waterDamage: input.waterDamage || "No",
    backGlassCracked: input.backGlassCracked || "No",
    technicianNotes: "",
    postRepairCheckNotes: "",
    technician: "Unassigned",
    draftEmail: `Hello ${input.customer}, your appointment has been created for ${input.date} at ${input.time}.`,
    selectedTemplate: "Appointment confirmation",
    selectedSmsTemplate: "Your appointment is confirmed.",
    draftSms: `Your appointment is booked for ${input.date} at ${input.time}.`,
    callAttempts: [],
    siteId: input.siteId,
    archived: false,
    activityLog,
    createdAt: nowIso,
    updatedAt: nowIso,
    isLocked: false,
  };

  return appointment;
}