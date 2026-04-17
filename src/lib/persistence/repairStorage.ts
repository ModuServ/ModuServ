export const REPAIR_JOBS_STORAGE_KEY = "moduserv:repairJobs";

export function loadRepairJobs<T>(fallback: T): T {
  try {
    const raw = localStorage.getItem(REPAIR_JOBS_STORAGE_KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveRepairJobs<T>(jobs: T): void {
  try {
    localStorage.setItem(REPAIR_JOBS_STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // ignore storage failure for now
  }
}

export function clearRepairJobs(): void {
  try {
    localStorage.removeItem(REPAIR_JOBS_STORAGE_KEY);
  } catch {
    // ignore storage failure for now
  }
}
