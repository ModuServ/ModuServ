import { CalendarDays, Eye, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useJobs } from "../../../context/JobsContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { useSite } from "../../../context/SiteContext";
import { API_BASE, authFetch } from "../../../lib/api";

type StatusFilter =
  | "All"
  | "New"
  | "In Diagnosis"
  | "Awaiting Repair"
  | "In Progress"
  | "Post Repair Device Check"
  | "Pending Postage"
  | "Ready For Collection"
  | "Ready For Collection Unsuccessful"
  | "Awaiting Customer Reply"
  | "Awaiting Parts";

type ServerJob = {
  id: string;
  customerFirstName: string;
  customerLastName: string;
  deviceModel: string;
  category: string;
  status: string;
  priorityWasOverridden: boolean;
  isDeleted: boolean;
  createdAt?: string;
};

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "New":
      return "status-badge status-badge--pending";
    case "In Diagnosis":
      return "status-badge status-badge--warning";
    case "Awaiting Repair":
      return "status-badge status-badge--hold";
    case "In Progress":
      return "status-badge status-badge--info";
    case "Post Repair Device Check":
      return "status-badge status-badge--info";
    case "Pending Postage":
      return "status-badge status-badge--warning";
    case "Ready For Collection":
      return "status-badge status-badge--success";
    case "Ready For Collection Unsuccessful":
      return "status-badge status-badge--warning";
    case "Awaiting Customer Reply":
      return "status-badge status-badge--hold";
    case "Awaiting Parts":
      return "status-badge status-badge--hold";
    default:
      return "status-badge";
  }
}

function getPaymentStatus(priorityWasOverridden: boolean, status: string) {
  if (status === "Ready For Collection" || priorityWasOverridden) {
    return "Paid";
  }
  return "Not Paid";
}

export default function JobsOverview() {
  const { jobs, softDeleteJobLocal, restoreJobLocal } = useJobs();
  const { user } = useAuth();
  const { canArchiveJobs, canRestoreJobs } = useRolePermissions();
  const { selectedSiteId } = useSite();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [dateRange, setDateRange] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [serverJobs, setServerJobs] = useState<ServerJob[]>([]);

  const loadJobsFromServer = async (includeDeleted: boolean) => {
    try {
      const response = await authFetch(
        `${API_BASE}/jobs?includeDeleted=${includeDeleted ? "true" : "false"}&site_id=${selectedSiteId}`
      );
      const data = await response.json();
      setServerJobs(Array.isArray(data) ? data : []);
    } catch {
      setServerJobs([]);
    }
  };

  useEffect(() => {
    void loadJobsFromServer(showArchived);
  }, [showArchived, selectedSiteId]);

  const baseJobs = showArchived ? serverJobs : jobs.filter((job) => !job.isDeleted);

  const filteredJobs = useMemo(() => {
    return baseJobs.filter((job) => {
      const fullName = `${job.customerFirstName || ""} ${job.customerLastName || ""}`.trim();

      const matchesSearch =
        !searchTerm.trim() ||
        job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.deviceModel || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.checkInCondition || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || job.status === statusFilter;

      const matchesDate = !dateRange.trim() || true;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [baseJobs, searchTerm, statusFilter, dateRange]);

  const canCreate = !!user;

  const softDeleteJob = async (jobId: string) => {
    if (!user || !canArchiveJobs) return;
    const confirmed = window.confirm("Archive this job?");
    if (!confirmed) return;

    softDeleteJobLocal(jobId, user.username);

    const response = await authFetch(`${API_BASE}/jobs/${jobId}/soft-delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ performedBy: user.username }),
    });

    if (!response.ok) {
      // Archive request failed — record stays visible until next sync
    }
  };

  const restoreJob = async (jobId: string) => {
    if (!user) return;

    restoreJobLocal(jobId, user.username);

    const response = await authFetch(`${API_BASE}/jobs/${jobId}/restore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ performedBy: user.username }),
    });

    if (response.ok) {
      await loadJobsFromServer(true);
    }
  };

  return (
    <section className="jobs-page">
      <div className="jobs-header">
        <div>
          <h1 className="jobs-title">Jobs Management</h1>
          <p className="jobs-subtitle">View and manage repair jobs</p>
        </div>

        <div className="jobs-header-actions">
          {canRestoreJobs ? (
            <label className="jobs-toggle">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              <span>Show Archived</span>
            </label>
          ) : null}

          {canCreate ? (
            <Link to="/jobs/new" className="jobs-create-button">
              <Plus size={16} />
              <span>Create New Job</span>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="jobs-filters-card">
        <div className="jobs-filters">
          <div className="jobs-search-wrap">
            <Search size={16} className="jobs-search-icon" />
            <input
              className="jobs-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by job ID, customer, device..."
            />
          </div>

          <select
            className="jobs-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="In Diagnosis">In Diagnosis</option>
            <option value="Awaiting Repair">Awaiting Repair</option>
            <option value="In Progress">In Progress</option>
            <option value="Post Repair Device Check">Post Repair Device Check</option>
            <option value="Pending Postage">Pending Postage</option>
            <option value="Ready For Collection">Ready For Collection</option>
            <option value="Ready For Collection Unsuccessful">Ready For Collection Unsuccessful</option>
            <option value="Awaiting Customer Reply">Awaiting Customer Reply</option>
            <option value="Awaiting Parts">Awaiting Parts</option>
          </select>

          <div className="jobs-date-wrap">
            <CalendarDays size={16} className="jobs-date-icon" />
            <input
              className="jobs-date-input"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              placeholder="Select date range"
            />
          </div>

          <button
            type="button"
            className="button-link button-link--button button-link--secondary jobs-clear-button"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("All");
              setDateRange("");
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="jobs-empty-state">
          <div className="jobs-empty-state__icon">??</div>
          <h3 className="jobs-empty-state__title">No jobs found</h3>
          <p className="jobs-empty-state__subtitle">
            Create your first job to get started
          </p>
          {canCreate ? (
            <Link to="/jobs/new" className="jobs-create-button jobs-empty-state__button">
              <Plus size={16} />
              <span>Create Job</span>
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="jobs-table-card">
          <div className="jobs-table-wrap">
            <table className="jobs-table jobs-table--styled">
              <thead>
                <tr>
                  <th style={{ width: "120px" }}>Job ID</th>
                  <th style={{ width: "200px" }}>Customer Name</th>
                  <th style={{ width: "180px" }}>Device Model</th>
                  <th style={{ width: "180px" }}>Repair Type</th>
                  <th style={{ width: "140px" }}>Status</th>
                  <th style={{ width: "120px" }}>Payment</th>
                  <th style={{ width: "140px" }}>Created Date</th>
                  <th style={{ width: "180px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const paymentStatus = getPaymentStatus(
                    job.priorityWasOverridden,
                    job.status
                  );

                  const fullName = `${job.customerFirstName || ""} ${job.customerLastName || ""}`.trim();

                  return (
                    <tr key={job.id}>
                      <td>{job.id}</td>
                      <td>{fullName}</td>
                      <td>{job.deviceModel}</td>
                      <td>{job.category}</td>
                      <td>
                        <span className={getStatusBadgeClass(job.status)}>
                          {job.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            paymentStatus === "Paid"
                              ? "payment-badge payment-badge--paid"
                              : "payment-badge payment-badge--unpaid"
                          }
                        >
                          {paymentStatus}
                        </span>
                      </td>
                      <td>{job.createdAt ? new Date(job.createdAt as string).toLocaleDateString() : "—"}</td>
                      <td className="jobs-table__actions">
                        <div className="jobs-row-actions">
                          <Link to={`/jobs/${job.id}`} className="jobs-view-button">
                            <Eye size={16} />
                            <span>View</span>
                          </Link>

                          {!showArchived && canArchiveJobs ? (
                            <button
                              type="button"
                              className="jobs-view-button jobs-view-button--danger"
                              onClick={() => void softDeleteJob(job.id)}
                            >
                              <Trash2 size={16} />
                              <span>Archive</span>
                            </button>
                          ) : showArchived && canRestoreJobs ? (
                            <button
                              type="button"
                              className="jobs-view-button jobs-view-button--restore"
                              onClick={() => void restoreJob(job.id)}
                            >
                              <RotateCcw size={16} />
                              <span>Restore</span>
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="jobs-pagination">
            <span>
              Showing 1-{filteredJobs.length} of {filteredJobs.length} jobs
            </span>
            <div className="jobs-pagination__controls">
              <button type="button" className="jobs-page-button" disabled>
                Prev
              </button>
              <button type="button" className="jobs-page-button jobs-page-button--active">
                1
              </button>
              <button type="button" className="jobs-page-button" disabled>
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}




