import type { AppointmentRecord, AppointmentStatus } from "../appointments/appointmentTypes";

export type WorkflowStatus =
  | "Awaiting Diagnosis"
  | "Awaiting Repair"
  | "In Progress"
  | "Post Repair Check"
  | "Ready For Collection"
  | "Ready For Collection (Unsuccessful)"
  | "Awaiting Parts"
  | "Awaiting Customer Reply"
  | "Completed"
  | "Cancelled"
  | "Closed";

export type WorkflowRecord = AppointmentRecord;

export type WorkflowSnapshot = {
  status: WorkflowStatus | AppointmentStatus;
  technicianNotes: string;
  postRepairCheckNotes: string;
};

export type WorkflowSummary = {
  total: number;
  inProgress: number;
  postRepair: number;
  ready: number;
  awaitingCustomerReply?: number;
  closed?: number;
};

export type WorkflowWorkflowActivityEntry = {
  type: "EMAIL" | "SMS" | "STATUS" | "NOTE" | "POST_REPAIR" | "CALL" | "SYSTEM";
  message: string;
  user: string;
  role: string;
  timestamp: string;
};

export type WorkflowCommunicationState = {
  selectedTemplate: string;
  draftEmail: string;
  selectedSmsTemplate: string;
  draftSms: string;
  callLog: string;
  callAttempts: string[];
  activityLog: WorkflowWorkflowActivityEntry[];
};

export type WorkflowTriggerSettings = {
  activity: boolean;
  email: boolean;
  sms: boolean;
};