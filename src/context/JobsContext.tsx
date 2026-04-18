import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initialJobs, type Job } from "../data/jobs";
import { useAudit } from "./AuditContext";
import { useSync } from "./SyncContext";
import { useSite } from "./SiteContext";
import { useAuth } from "./AuthContext";
import { API_BASE, authFetch } from "../lib/api";

type JobsContextType = {
  jobs: Job[];
  createJob: (input: Omit<Job, "id">) => Job;
  updateJob: (id: string, input: Omit<Job, "id">) => void;
  softDeleteJobLocal: (id: string, performedBy: string) => void;
  restoreJobLocal: (id: string, performedBy: string) => void;
  getJobById: (id: string) => Job | undefined;
  resetJobs: () => void;
};

const JobsContext = createContext<JobsContextType | undefined>(undefined);

const STORAGE_KEY = "moduserv.jobs";

function loadJobs(): Job[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialJobs;
    const parsed = JSON.parse(raw) as Job[];
    return Array.isArray(parsed) ? parsed : initialJobs;
  } catch {
    return initialJobs;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

export function JobsProvider({ children }: { children: ReactNode }) {
  const [allJobs, setAllJobs] = useState<Job[]>(() => loadJobs());
  const { logEvent } = useAudit();
  const { addToQueue } = useSync();
  const { selectedSiteId } = useSite();
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allJobs));
  }, [allJobs]);

  // Re-fetch jobs from backend whenever the selected site changes
  useEffect(() => {
    if (!user) return;
    async function fetchJobs() {
      try {
        const res = await authFetch(`${API_BASE}/jobs?site_id=${selectedSiteId}`);
        if (!res.ok) return;
        const data = await res.json() as Job[];
        if (Array.isArray(data)) {
          // Replace this site's jobs with server data; preserve other sites' local jobs
          setAllJobs((prev) => {
            const otherSites = prev.filter((j) => j.siteId && j.siteId !== selectedSiteId);
            return [...otherSites, ...data];
          });
        }
      } catch { /* offline — keep localStorage */ }
    }
    void fetchJobs();
  }, [user, selectedSiteId]);

  // Only expose jobs belonging to the current site
  const jobs = useMemo(
    () => allJobs.filter((j) => !j.siteId || j.siteId === selectedSiteId),
    [allJobs, selectedSiteId]
  );

  const createJob = (input: Omit<Job, "id">) => {
    const nextNumber =
      allJobs.length > 0
        ? Math.max(
            ...allJobs.map((job) => {
              const numericPart = Number(job.id.replace("job-", ""));
              return Number.isNaN(numericPart) ? 0 : numericPart;
            })
          ) + 1
        : 1;

    const newJob: Job = {
      id: `job-${String(nextNumber).padStart(3, "0")}`,
      ...input,
      siteId: input.siteId ?? selectedSiteId,
    };

    setAllJobs((prev) => [...prev, newJob]);
    addToQueue("job", newJob.id, "create", { ...newJob, createdBy: "System" });

    logEvent(newJob.id, "JOB_CREATED", `Job created for ${newJob.customerFirstName} ${newJob.customerLastName}.`);
    return newJob;
  };

  const updateJob = (id: string, input: Omit<Job, "id">) => {
    const existingJob = jobs.find((job) => job.id === id);

    let nextRepairStartTime = input.repairStartTime;
    let nextRepairEndTime = input.repairEndTime;
    let nextRepairDurationMinutes = input.repairDurationMinutes;

    if (existingJob) {
      const previousStatus = existingJob.status;
      const nextStatus = input.status;

      if (previousStatus !== "In Progress" && nextStatus === "In Progress" && !existingJob.repairStartTime) {
        nextRepairStartTime = nowIso();
      }

      if (
        previousStatus !== "Post Repair Device Check" &&
        nextStatus === "Post Repair Device Check" &&
        existingJob.repairStartTime &&
        !existingJob.repairEndTime
      ) {
        const endTime = new Date();
        const startTime = new Date(existingJob.repairStartTime);
        const durationMinutes = Math.max(
          0,
          Math.floor((endTime.getTime() - startTime.getTime()) / 60000)
        );

        nextRepairEndTime = endTime.toISOString();
        nextRepairDurationMinutes = durationMinutes;
      }
    }

    const updatedJob: Job = {
      id,
      ...input,
      repairStartTime: String(nextRepairStartTime ?? ""),
      repairEndTime: String(nextRepairEndTime ?? ""),
      repairDurationMinutes: nextRepairDurationMinutes ?? "",
    };

    setAllJobs((prev) => prev.map((job) => (job.id === id ? updatedJob : job)));
    addToQueue("job", id, "update", { ...updatedJob, updatedBy: "System" });

    logEvent(id, "JOB_UPDATED", `Job updated. Current status: ${updatedJob.status}.`);

    if (existingJob?.status !== updatedJob.status) {
      logEvent(id, "STATUS_CHANGED", `${existingJob?.status ?? "Unknown"} ? ${updatedJob.status}`);
    }

    if (!existingJob?.repairStartTime && updatedJob.repairStartTime) {
      logEvent(id, "REPAIR_TIMER_STARTED", `Repair timer started at ${updatedJob.repairStartTime}.`);
    }

    if (!existingJob?.repairEndTime && updatedJob.repairEndTime) {
      logEvent(
        id,
        "REPAIR_TIMER_STOPPED",
        `Repair timer stopped at ${updatedJob.repairEndTime}. Duration: ${updatedJob.repairDurationMinutes} minutes.`
      );
    }
  };

  const softDeleteJobLocal = (id: string, performedBy: string) => {
    setAllJobs((prev) =>
      prev.map((job) =>
        job.id === id
          ? {
              ...job,
              isDeleted: true,
              deletedAt: nowIso(),
              deletedBy: performedBy,
            }
          : job
      )
    );

    const job = jobs.find((item) => item.id === id);
    if (job) {
      addToQueue("job", id, "update", {
        ...job,
        isDeleted: true,
        deletedAt: nowIso(),
        deletedBy: performedBy,
        updatedBy: performedBy,
      });
    }

    logEvent(id, "JOB_ARCHIVED", `Job archived by ${performedBy}.`);
  };

  const restoreJobLocal = (id: string, performedBy: string) => {
    setAllJobs((prev) =>
      prev.map((job) =>
        job.id === id
          ? {
              ...job,
              isDeleted: false,
              restoredAt: nowIso(),
              restoredBy: performedBy,
            }
          : job
      )
    );

    const job = jobs.find((item) => item.id === id);
    if (job) {
      addToQueue("job", id, "update", {
        ...job,
        isDeleted: false,
        restoredAt: nowIso(),
        restoredBy: performedBy,
        updatedBy: performedBy,
      });
    }

    logEvent(id, "JOB_RESTORED", `Job restored by ${performedBy}.`);
  };

  const getJobById = (id: string) => allJobs.find((job) => job.id === id);

  const resetJobs = () => {
    setAllJobs(initialJobs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialJobs));
  };

  const value = useMemo(
    () => ({
      jobs,
      createJob,
      updateJob,
      softDeleteJobLocal,
      restoreJobLocal,
      getJobById,
      resetJobs,
    }),
    [jobs, allJobs, selectedSiteId]
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs() {
  const context = useContext(JobsContext);

  if (!context) {
    throw new Error("useJobs must be used within a JobsProvider");
  }

  return context;
}

