import type { AppointmentRecord } from "../pages/appointments/appointmentTypes";

export const APPOINTMENTS_STORAGE_KEY = "moduserv:appointments";
export const APPOINTMENTS_UPDATED_EVENT = "moduserv:appointments-updated";

export function loadAppointments(fallback: AppointmentRecord[] = []): AppointmentRecord[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as AppointmentRecord[];
  } catch {
    return fallback;
  }
}

export function saveAppointments(appointments: AppointmentRecord[]): void {
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
  } catch {
    // ignore storage failure for now
  }
}

export function appendAppointment(appointment: AppointmentRecord): void {
  const existing = loadAppointments([]);
  localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify([appointment, ...existing]));
  window.dispatchEvent(new Event(APPOINTMENTS_UPDATED_EVENT));
}

export function clearAppointments(): void {
  try {
    localStorage.removeItem(APPOINTMENTS_STORAGE_KEY);
    window.dispatchEvent(new Event(APPOINTMENTS_UPDATED_EVENT));
  } catch {
    // ignore storage failure for now
  }
}
