import type { BlockedSlot, CalendarAppointment } from "../calendarTypes";

export const calendarAppointments: CalendarAppointment[] = [];

export const initialBlockedSlots: BlockedSlot[] = [];

export function generateTimeSlots(intervalMinutes: number = 15): string[] {
  const slots: string[] = [];

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const h = String(hour).padStart(2, "0");
      const m = String(minute).padStart(2, "0");
      slots.push(`${h}:${m}`);
    }
  }

  return slots;
}

export const timeSlots = generateTimeSlots(15);
