import type { AppointmentRecord } from "../../appointments/appointmentTypes";
import type {
  WorkflowRecord,
  WorkflowSnapshot,
  WorkflowStatus,
  WorkflowSummary
} from "../workflowTypes";

function getCustomerName(record: AppointmentRecord) {
  if (record.customer && record.customer.trim() !== "") {
    return record.customer.trim();
  }

  const firstName = record.customerInfo?.firstName?.trim() || "";
  const lastName = record.customerInfo?.lastName?.trim() || "";
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function getDeviceLabel(record: AppointmentRecord) {
  if (record.device && record.device.trim() !== "") {
    return record.device.trim();
  }

  const brand = record.brand?.trim() || record.deviceInfo?.brand?.trim() || "";
  const deviceType = record.deviceType?.trim() || record.deviceInfo?.deviceType?.trim() || "";
  const deviceModel = record.deviceModel?.trim() || record.deviceInfo?.deviceModel?.trim() || "";

  return [brand, deviceType, deviceModel].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function getWorkflowTypeLabel(record: AppointmentRecord) {
  return (record.repairType || "General Repair").trim();
}

export function workflowStatusClassName(status: string) {
  return status
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[()]/g, "")
    .replace(/-+/g, "-")
    .trim();
}

export function buildWorkflowSummary(records: WorkflowRecord[]): WorkflowSummary {
  return {
    total: records.length,
    inProgress: records.filter((record) => record.status === "In Progress").length,
    postRepair: records.filter((record) => record.status === "Post Repair Check").length,
    ready: records.filter((record) => record.status === "Ready For Collection").length,
    awaitingCustomerReply: records.filter((record) => record.status === "Awaiting Customer Reply").length,
    closed: records.filter((record) => record.status === "Closed").length,
  };
}

export function createWorkflowSnapshot(record: WorkflowRecord): WorkflowSnapshot {
  return {
    status: record.status as WorkflowStatus,
    technicianNotes: record.technicianNotes || "",
    postRepairCheckNotes: record.postRepairCheckNotes || "",
  };
}

export function filterWorkflowRecords(
  records: WorkflowRecord[],
  search: string,
  statusFilter: WorkflowStatus | "All"
) {
  const query = search.trim().toLowerCase();

  return records.filter((record) => {
    const customerName = getCustomerName(record as AppointmentRecord);
    const deviceLabel = getDeviceLabel(record as AppointmentRecord);
    const workflowTypeLabel = getWorkflowTypeLabel(record as AppointmentRecord);

    const matchesSearch =
      query === "" ||
      (record.id || "").toLowerCase().includes(query) ||
      customerName.toLowerCase().includes(query) ||
      deviceLabel.toLowerCase().includes(query) ||
      workflowTypeLabel.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "All" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

export function getWorkflowEmailTemplateBody(template: string) {
  const templateMap: Record<string, string> = {
    "Repair update ready for collection":
      "Hello, your appointment workflow has progressed and your device is now ready for collection.",
    "Awaiting parts update":
      "Hello, your appointment workflow is currently awaiting parts. We will update you as soon as they arrive.",
    "Need customer approval":
      "Hello, we need your approval before proceeding with the next stage of this appointment workflow.",
    "Follow-up no response":
      "Hello, we previously tried to reach you regarding your appointment workflow. Please get back to us when possible.",
  };

  return templateMap[template] || "";
}