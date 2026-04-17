import "./AdminHome.css";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock,
  RefreshCw,
  Users,
  Wrench,
} from "lucide-react";
import { useDashboardMetrics } from "../../hooks/useDashboardMetrics";

// Status pipeline definition — workflow order with display config
type PipelineStage = {
  label: string;
  key: keyof ReturnType<typeof useDashboardMetrics>;
  color: string;       // dot + bar accent
  group: "active" | "waiting" | "terminal";
};

const PIPELINE: PipelineStage[] = [
  { label: "Awaiting Diagnosis",             key: "awaitingDiagnosis",            color: "#3b82f6", group: "active"   },
  { label: "Awaiting Repair",                key: "awaitingRepair",               color: "#6366f1", group: "active"   },
  { label: "In Progress",                    key: "inProgress",                   color: "#f59e0b", group: "active"   },
  { label: "Post Repair Check",              key: "postRepairCheck",              color: "#a855f7", group: "active"   },
  { label: "Awaiting Parts",                 key: "awaitingParts",                color: "#f97316", group: "waiting"  },
  { label: "Awaiting Customer Reply",        key: "awaitingCustomerReply",        color: "#14b8a6", group: "waiting"  },
  { label: "Ready For Collection",           key: "readyForCollection",           color: "#22c55e", group: "terminal" },
  { label: "Ready For Collection (Unsuccessful)", key: "readyForCollectionUnsuccessful", color: "#ef4444", group: "terminal" },
  { label: "Completed",                      key: "completed",                    color: "#10b981", group: "terminal" },
  { label: "Cancelled",                      key: "cancelled",                    color: "#9ca3af", group: "terminal" },
  { label: "Closed",                         key: "closed",                       color: "#6b7280", group: "terminal" },
];

const GROUP_LABELS: Record<string, string> = {
  active:   "Active Workflow",
  waiting:  "On Hold",
  terminal: "Resolution",
};

export default function AdminHome() {
  const m = useDashboardMetrics();

  // Max active-stage count used to scale pipeline bars (terminal stages don't get bars)
  const activeMax = Math.max(
    m.awaitingDiagnosis,
    m.awaitingRepair,
    m.inProgress,
    m.postRepairCheck,
    m.awaitingParts,
    m.awaitingCustomerReply,
    m.readyForCollection,
    m.readyForCollectionUnsuccessful,
    1
  );

  // Group pipeline stages
  const grouped: Record<string, PipelineStage[]> = {};
  for (const stage of PIPELINE) {
    if (!grouped[stage.group]) grouped[stage.group] = [];
    grouped[stage.group].push(stage);
  }

  return (
    <section className="ms-dashboard">
      <div className="ms-dashboard__header">
        <div>
          <h1 className="ms-dashboard__title">Dashboard</h1>
          <p className="ms-dashboard__subtitle">Live overview of all connected ModuServ data.</p>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────── */}
      <div className="ms-dashboard__stats">
        <article className="ms-dashboard__stat-card">
          <div className="ms-dashboard__stat-icon ms-dashboard__stat-icon--blue">
            <CalendarDays size={20} />
          </div>
          <div className="ms-dashboard__stat-content">
            <div className="ms-dashboard__stat-label">Total Appointments</div>
            <div className="ms-dashboard__stat-value">{m.totalAppointments}</div>
          </div>
        </article>

        <article className="ms-dashboard__stat-card">
          <div className="ms-dashboard__stat-icon ms-dashboard__stat-icon--amber">
            <Activity size={20} />
          </div>
          <div className="ms-dashboard__stat-content">
            <div className="ms-dashboard__stat-label">Active</div>
            <div className="ms-dashboard__stat-value">{m.activeAppointments}</div>
          </div>
        </article>

        <article className="ms-dashboard__stat-card">
          <div className="ms-dashboard__stat-icon ms-dashboard__stat-icon--green">
            <CheckCircle2 size={20} />
          </div>
          <div className="ms-dashboard__stat-content">
            <div className="ms-dashboard__stat-label">Ready for Collection</div>
            <div className="ms-dashboard__stat-value">{m.readyForCollection}</div>
          </div>
        </article>

        <article className="ms-dashboard__stat-card">
          <div className="ms-dashboard__stat-icon ms-dashboard__stat-icon--purple">
            <Users size={20} />
          </div>
          <div className="ms-dashboard__stat-content">
            <div className="ms-dashboard__stat-label">Customers</div>
            <div className="ms-dashboard__stat-value">{m.totalCustomers}</div>
          </div>
        </article>

        <article className="ms-dashboard__stat-card">
          <div className={`ms-dashboard__stat-icon ${m.pendingSync > 0 ? "ms-dashboard__stat-icon--red" : "ms-dashboard__stat-icon--grey"}`}>
            <RefreshCw size={20} />
          </div>
          <div className="ms-dashboard__stat-content">
            <div className="ms-dashboard__stat-label">Pending Sync</div>
            <div className="ms-dashboard__stat-value">{m.pendingSync}</div>
          </div>
        </article>
      </div>

      {/* ── Main panels ───────────────────────────────────── */}
      <div className="ms-dashboard__panels">

        {/* Pipeline */}
        <section className="ms-dashboard__panel ms-dashboard__panel--pipeline">
          <div className="ms-dashboard__panel-header">
            <h2>Repair Pipeline</h2>
            <p>Live appointment distribution across all workflow stages.</p>
          </div>

          <div className="ms-dashboard__pipeline">
            {(["active", "waiting", "terminal"] as const).map((group) => (
              <div key={group} className="ms-dashboard__pipeline-group">
                <p className="ms-dashboard__pipeline-group-label">{GROUP_LABELS[group]}</p>
                {grouped[group].map((stage) => {
                  const count = m[stage.key] as number;
                  const barPct = group !== "terminal"
                    ? Math.round((count / activeMax) * 100)
                    : 0;
                  return (
                    <div key={stage.key} className="ms-dashboard__pipeline-row">
                      <span
                        className="ms-dashboard__pipeline-dot"
                        style={{ background: stage.color }}
                      />
                      <span className="ms-dashboard__pipeline-label">{stage.label}</span>
                      <span className="ms-dashboard__pipeline-count">{count}</span>
                      {group !== "terminal" ? (
                        <div className="ms-dashboard__pipeline-bar">
                          <div
                            className="ms-dashboard__pipeline-fill"
                            style={{ width: `${barPct}%`, background: stage.color }}
                          />
                        </div>
                      ) : (
                        <div className="ms-dashboard__pipeline-bar ms-dashboard__pipeline-bar--empty" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        {/* Right column */}
        <div className="ms-dashboard__right-col">

          {/* At a Glance */}
          <section className="ms-dashboard__panel">
            <div className="ms-dashboard__panel-header">
              <h2>At a Glance</h2>
              <p>Key operational figures right now.</p>
            </div>
            <div className="ms-dashboard__glance-list">
              <div className="ms-dashboard__glance-row">
                <div className="ms-dashboard__glance-icon" style={{ background: "#eff6ff", color: "#3b82f6" }}>
                  <CalendarDays size={15} />
                </div>
                <span className="ms-dashboard__glance-label">Today's Appointments</span>
                <strong className="ms-dashboard__glance-value">{m.todayCount}</strong>
              </div>
              <div className="ms-dashboard__glance-row">
                <div className="ms-dashboard__glance-icon" style={{ background: "#fef2f2", color: "#ef4444" }}>
                  <Wrench size={15} />
                </div>
                <span className="ms-dashboard__glance-label">High Priority Jobs</span>
                <strong className="ms-dashboard__glance-value">{m.jobsHighPriority}</strong>
              </div>
              <div className="ms-dashboard__glance-row">
                <div className="ms-dashboard__glance-icon" style={{ background: "#fef3c7", color: "#f59e0b" }}>
                  <Clock size={15} />
                </div>
                <span className="ms-dashboard__glance-label">In Progress</span>
                <strong className="ms-dashboard__glance-value">{m.inProgress}</strong>
              </div>
              <div className="ms-dashboard__glance-row">
                <div className="ms-dashboard__glance-icon" style={{ background: "#f0fdf4", color: "#22c55e" }}>
                  <CheckCircle2 size={15} />
                </div>
                <span className="ms-dashboard__glance-label">Completed (All Time)</span>
                <strong className="ms-dashboard__glance-value">{m.completed}</strong>
              </div>
              {m.totalJobs > 0 && (
                <div className="ms-dashboard__glance-row">
                  <div className="ms-dashboard__glance-icon" style={{ background: "#f5f3ff", color: "#6366f1" }}>
                    <Activity size={15} />
                  </div>
                  <span className="ms-dashboard__glance-label">Jobs (Backend)</span>
                  <strong className="ms-dashboard__glance-value">{m.totalJobs}</strong>
                </div>
              )}
            </div>
          </section>

          {/* System Status */}
          <section className="ms-dashboard__panel">
            <div className="ms-dashboard__panel-header">
              <h2>System Status</h2>
              <p>Live state of connected data sources.</p>
            </div>
            <div className="ms-dashboard__status-stack">
              <div className="ms-dashboard__status-row">
                <span>Appointments Loaded</span>
                <span className={`ms-dashboard__status-pill ${m.totalAppointments > 0 ? "ms-dashboard__status-pill--green" : "ms-dashboard__status-pill--grey"}`}>
                  {m.totalAppointments}
                </span>
              </div>
              <div className="ms-dashboard__status-row">
                <span>Customers Loaded</span>
                <span className={`ms-dashboard__status-pill ${m.totalCustomers > 0 ? "ms-dashboard__status-pill--green" : "ms-dashboard__status-pill--grey"}`}>
                  {m.totalCustomers}
                </span>
              </div>
              <div className="ms-dashboard__status-row">
                <span>Sync Queue</span>
                <span className={`ms-dashboard__status-pill ${m.pendingSync > 0 ? "ms-dashboard__status-pill--amber" : "ms-dashboard__status-pill--green"}`}>
                  {m.pendingSync > 0 ? `${m.pendingSync} pending` : "Clear"}
                </span>
              </div>
              <div className="ms-dashboard__status-row">
                <span>Role Guards</span>
                <span className="ms-dashboard__status-pill ms-dashboard__status-pill--green">Active</span>
              </div>
              <div className="ms-dashboard__status-row">
                <span>AI Suggestions</span>
                <span className="ms-dashboard__status-pill ms-dashboard__status-pill--blue">Enabled</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </section>
  );
}
