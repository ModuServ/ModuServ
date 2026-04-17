export type WorkflowAwareRecord = {
  id: string;
  isLocked?: boolean;
  lockedBy?: string;
  lockedAt?: string;
  lockReason?: string;
};

export type WorkflowMode = "view" | "edit";

export function isRecordLocked(record: WorkflowAwareRecord | null | undefined): boolean {
  return Boolean(record?.isLocked);
}

export function isLockedByMe(
  record: WorkflowAwareRecord | null | undefined,
  actor: string | null | undefined
): boolean {
  if (!record || !actor) return false;
  return Boolean(record.isLocked) && (record.lockedBy || "") === actor;
}

export function isLockedByAnotherUser(
  record: WorkflowAwareRecord | null | undefined,
  actor: string | null | undefined
): boolean {
  if (!record || !record.isLocked) return false;
  if (!actor) return true;
  return (record.lockedBy || "") !== actor;
}

export function canEditRecord(
  record: WorkflowAwareRecord | null | undefined,
  actor: string | null | undefined,
  hasEditPermission: boolean
): boolean {
  if (!hasEditPermission || !record) return false;
  if (!record.isLocked) return true;
  return isLockedByMe(record, actor);
}

export function getWorkflowModeForRecord(
  record: WorkflowAwareRecord | null | undefined,
  actor: string | null | undefined,
  hasEditPermission: boolean
): WorkflowMode {
  return canEditRecord(record, actor, hasEditPermission) ? "edit" : "view";
}

export function getLockBannerText(
  record: WorkflowAwareRecord | null | undefined,
  actor: string | null | undefined
): string {
  if (!record?.isLocked) return "";
  if (isLockedByMe(record, actor)) {
    return `Locked by you${record.lockedAt ? ` at ${record.lockedAt}` : ""}`;
  }

  const owner = record.lockedBy || "another user";
  return `Locked by ${owner}${record.lockedAt ? ` at ${record.lockedAt}` : ""}`;
}