export type AuditAction =
  | "JOB_CREATED"
  | "JOB_UPDATED"
  | "PRIORITY_OVERRIDDEN"
  | "JOB_ARCHIVED"
  | "JOB_RESTORED"
  | "STATUS_CHANGED"
  | "REPAIR_TIMER_STARTED"
  | "REPAIR_TIMER_STOPPED"
  | "APPOINTMENT_CREATED"
  | "APPOINTMENT_UPDATED"
  | "APPOINTMENT_DELETED"
  | "APPOINTMENT_ESCALATED"
  | "CUSTOMER_CREATED"
  | "CUSTOMER_UPDATED";

export type AuditEntityType = "job" | "appointment" | "customer";

export type AuditEntry = {
  id: string;
  jobId: string;
  action: AuditAction;
  message: string;
  createdAt: string;
  entityType?: AuditEntityType;
  createdBy?: string;
};

