import type { WorkflowCommunicationState } from "../workflowTypes";

export const repairTemplateOptions = [
  "Repair update ready for collection",
  "Awaiting parts update",
  "Need customer approval",
  "Follow-up no response",
];

export const repairSmsTemplateOptions = [
  "Your repair is in progress.",
  "Your repair is ready for collection.",
  "We need your approval before continuing.",
  "We attempted to contact you regarding your repair.",
];

export const initialWorkflowCommunicationState: WorkflowCommunicationState = {
  selectedTemplate: "Repair update ready for collection",
  draftEmail: "",
  selectedSmsTemplate: "Your repair is in progress.",
  draftSms: "",
  callLog: "",
  callAttempts: [],
  activityLog: [],
};
