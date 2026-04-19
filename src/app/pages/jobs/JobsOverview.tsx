import { CalendarDays, Eye, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppointments } from "../../context/AppointmentContext";
import type { AppointmentStatus } from "../appointments/appointmentTypes";

type StatusFilter = "All" | AppointmentStatus;

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Awaiting Diagnosis":          return "status-badge status-badge--warning";
    case "Awaiting Repair":             return "status-badge status-badge--hold";
    case "In Progress":                 return "status-badge status-badge--info";
    case "Post Repair Check":           return "status-badge status-badge--info";
    case "Awaiting Parts":              return "status-badge status-badge--hold";
    case "Awaiting Customer Reply":     return "status-badge status-badge--hold";
    case "Ready For Collection":        return "status-badge status-badge--success";
    case "Ready For Collection (Unsuccessful)": return "status-badge status-badge--warning";
    case "Completed":                   return "status-badge status-badge--success";
    case "Cancelled":                   return "status-badge";
    case "Closed":                      return "status-badge";
    default:                            return "status-badge";
  }
}

export default function JobsOverview() {
  const { appointments } = useAppointments();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [dateRange, setDateRange] = useState("");

  const active = useMemo(
    () => appointments.filter((a) => !a.archived),
    [appointments]
  );

  const filtered = useMemo(() => {
    return active.filter((apt) => {
      const matchesSearch =
        !searchTerm.trim() ||
        apt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (apt.device || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (apt.checkInCondition || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All" || apt.status === statusFilter;

      const matchesDate =
        !dateRange.trim() ||
        (apt.date ?? "").startsWith(dateRange) ||
        (apt.createdAt ?? "").startsWith(dateRange);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [active, searchTerm, statusFilter, dateRange]);

  function openAppointment(id: string) {
    navigate("/appointments", { state: { openId: id } });
  }

  return (
    <section className="jobs-page">
      <div className="jobs-header">
        <div>
          <h1 className="jobs-title">Jobs Overview</h1>
          <p className="jobs-subtitle">All repair jobs across the shared workflow</p>
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
              placeholder="Search by ID, customer, device..."
            />
          </div>

          <select
            className="jobs-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="All">All Statuses</option>
            <option value="Awaiting Diagnosis">Awaiting Diagnosis</option>
            <option value="Awaiting Repair">Awaiting Repair</option>
            <option value="In Progress">In Progress</option>
            <option value="Post Repair Check">Post Repair Check</option>
            <option value="Awaiting Parts">Awaiting Parts</option>
            <option value="Awaiting Customer Reply">Awaiting Customer Reply</option>
            <option value="Ready For Collection">Ready For Collection</option>
            <option value="Ready For Collection (Unsuccessful)">Ready For Collection (Unsuccessful)</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Closed">Closed</option>
          </select>

          <div className="jobs-date-wrap">
            <CalendarDays size={16} className="jobs-date-icon" />
            <input
              className="jobs-date-input"
              type="date"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="button-link button-link--button button-link--secondary jobs-clear-button"
            onClick={() => { setSearchTerm(""); setStatusFilter("All"); setDateRange(""); }}
          >
            Clear
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="jobs-empty-state">
          <div className="jobs-empty-state__icon">🔧</div>
          <h3 className="jobs-empty-state__title">No jobs found</h3>
          <p className="jobs-empty-state__subtitle">Try adjusting your filters or create a new intake.</p>
        </div>
      ) : (
        <div className="jobs-table-card">
          <div className="jobs-table-wrap">
            <table className="jobs-table jobs-table--styled">
              <thead>
                <tr>
                  <th style={{ width: "120px" }}>Job ID</th>
                  <th style={{ width: "200px" }}>Customer</th>
                  <th style={{ width: "200px" }}>Device</th>
                  <th style={{ width: "160px" }}>Repair Type</th>
                  <th style={{ width: "160px" }}>Status</th>
                  <th style={{ width: "120px" }}>Payment</th>
                  <th style={{ width: "130px" }}>Date</th>
                  <th style={{ width: "100px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((apt) => {
                  const paymentStatus = apt.paymentInfo?.paymentStatus ?? "—";
                  const isPaid = paymentStatus === "Paid";
                  const dateVal = apt.date ?? apt.createdAt?.slice(0, 10) ?? "—";

                  return (
                    <tr key={apt.id}>
                      <td>{apt.id}</td>
                      <td>{apt.customer}</td>
                      <td>{apt.device || apt.deviceModel || "—"}</td>
                      <td>{apt.repairType || "—"}</td>
                      <td>
                        <span className={getStatusBadgeClass(apt.status)}>
                          {apt.status}
                        </span>
                      </td>
                      <td>
                        <span className={isPaid ? "payment-badge payment-badge--paid" : "payment-badge payment-badge--unpaid"}>
                          {paymentStatus}
                        </span>
                      </td>
                      <td>{dateVal}</td>
                      <td className="jobs-table__actions">
                        <div className="jobs-row-actions">
                          <button
                            type="button"
                            className="jobs-view-button"
                            onClick={() => openAppointment(apt.id)}
                          >
                            <Eye size={16} />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="jobs-pagination">
            <span>Showing {filtered.length} of {active.length} jobs</span>
            <div className="jobs-pagination__controls">
              <button type="button" className="jobs-page-button" disabled>Prev</button>
              <button type="button" className="jobs-page-button jobs-page-button--active">1</button>
              <button type="button" className="jobs-page-button" disabled>Next</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
