import { useMemo } from "react";
import { useAppointments } from "../context/AppointmentContext";
import { useCustomers } from "../context/CustomerContext";
import { useJobs } from "../../context/JobsContext";
import { useSync } from "../../context/SyncContext";

export function useDashboardMetrics() {
  const { appointments } = useAppointments();
  const { customers } = useCustomers();
  const { jobs } = useJobs();
  const { pendingCount } = useSync();

  const safeAppointments = appointments ?? [];
  const safeCustomers = customers ?? [];
  const safeJobs = jobs ?? [];

  return useMemo(() => {
    // ── Appointment status counts ────────────────────────────
    const byStatus = (status: string) =>
      safeAppointments.filter((a) => a.status === status).length;

    const awaitingDiagnosis            = byStatus("Awaiting Diagnosis");
    const awaitingRepair               = byStatus("Awaiting Repair");
    const inProgress                   = byStatus("In Progress");
    const postRepairCheck              = byStatus("Post Repair Check");
    const readyForCollection           = byStatus("Ready For Collection");
    const readyForCollectionUnsuccessful = byStatus("Ready For Collection (Unsuccessful)");
    const awaitingParts                = byStatus("Awaiting Parts");
    const awaitingCustomerReply        = byStatus("Awaiting Customer Reply");
    const completed                    = byStatus("Completed");
    const cancelled                    = byStatus("Cancelled");
    const closed                       = byStatus("Closed");

    const TERMINAL = new Set(["Completed", "Cancelled", "Closed"]);
    const activeAppointments = safeAppointments.filter(
      (a) => !TERMINAL.has(a.status)
    ).length;

    // ── Today's appointments ─────────────────────────────────
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = safeAppointments.filter((a) => {
      const d = a.date ?? (a.createdAt ? a.createdAt.slice(0, 10) : "");
      return d === todayStr;
    }).length;

    // ── Customers — from CustomerContext (accurate) ──────────
    const totalCustomers = safeCustomers.length;

    // ── Jobs — from JobsContext (non-deleted) ────────────────
    const liveJobs = safeJobs.filter((j) => !j.isDeleted);
    const totalJobs        = liveJobs.length;
    const jobsNew          = liveJobs.filter((j) => j.status === "New").length;
    const jobsHighPriority = liveJobs.filter((j) => j.priority === "High").length;
    const jobsMedPriority  = liveJobs.filter((j) => j.priority === "Medium").length;
    const jobsLowPriority  = liveJobs.filter((j) => j.priority === "Low").length;

    return {
      // Top-level counts
      totalAppointments: safeAppointments.length,
      totalCustomers,
      totalJobs,
      pendingSync: pendingCount,
      activeAppointments,
      todayCount,

      // Appointment pipeline statuses
      awaitingDiagnosis,
      awaitingRepair,
      inProgress,
      postRepairCheck,
      readyForCollection,
      readyForCollectionUnsuccessful,
      awaitingParts,
      awaitingCustomerReply,
      completed,
      cancelled,
      closed,

      // Job metrics
      jobsNew,
      jobsHighPriority,
      jobsMedPriority,
      jobsLowPriority,
    };
  }, [safeAppointments, safeCustomers, safeJobs, pendingCount]);
}
