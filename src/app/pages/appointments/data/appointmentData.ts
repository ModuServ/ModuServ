import type { AppointmentRecord } from "../appointmentTypes";

export const demoAppointments: AppointmentRecord[] = [];

export const appointmentTemplateOptions = [
  "Appointment confirmation",
  "Appointment reminder",
  "Running late update",
  "Booking follow-up",
];

export const appointmentSmsTemplateOptions = [
  "Your appointment is confirmed.",
  "Reminder: your appointment is scheduled.",
  "We are running slightly behind schedule.",
  "Please contact us regarding your booking.",
];
