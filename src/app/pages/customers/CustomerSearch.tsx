import "./CustomerSearch.css";
import { Briefcase, CalendarClock, ExternalLink, Search, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { useCustomers } from "../../context/CustomerContext";
import { useAppointments } from "../../context/AppointmentContext";
import { useJobs } from "../../../context/JobsContext";
import { useAudit } from "../../../context/AuditContext";
import type { CustomerRecord } from "./customerTypes";
import type { AppointmentRecord } from "../appointments/appointmentTypes";
import type { Job } from "../../../data/jobs";

type ServiceEntry =
  | { kind: "appointment"; record: AppointmentRecord }
  | { kind: "job"; record: Job };

type CustomerSearchRow = {
  customer: CustomerRecord;
  appointments: AppointmentRecord[];
  jobs: Job[];
  latestEntry: ServiceEntry | null;
  latestDevice: string;
  latestStatus: string;
};

function entryDate(e: ServiceEntry): number {
  if (e.kind === "appointment") {
    return new Date(`${e.record.date || ""}T${e.record.time || "00:00"}`).getTime();
  }
  return 0;
}

function buildServiceHistory(appointments: AppointmentRecord[], jobs: Job[]): ServiceEntry[] {
  const entries: ServiceEntry[] = [
    ...appointments.map((a): ServiceEntry => ({ kind: "appointment", record: a })),
    ...jobs.map((j): ServiceEntry => ({ kind: "job", record: j })),
  ];
  return entries.sort((a, b) => entryDate(b) - entryDate(a));
}

export default function CustomerSearch() {
  const { canAccessCustomerSearch, canAccessAppointmentManagement, canAccessRepairTracking, canDeleteRecords, selectedRole } =
    useRolePermissions();
  const { customers, deleteCustomer } = useCustomers();
  const { appointments } = useAppointments();
  const { jobs } = useJobs();
  const { logEvent } = useAudit();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const searchRows = useMemo<CustomerSearchRow[]>(() => {
    const realCustomerIds = new Set(customers.map((c) => c.id));

    // Build rows for real customer records (link by ID or name fallback)
    const realRows: CustomerSearchRow[] = customers.map((customer) => {
      const linked = appointments.filter(
        (a) => a.customerId === customer.id || a.customer === customer.fullName
      );
      const linkedJobs = jobs.filter((j) => j.customerId === customer.id && !j.isDeleted);
      const history = buildServiceHistory(linked, linkedJobs);
      const latest = history[0] ?? null;
      const latestDevice =
        latest?.kind === "appointment"
          ? (latest.record.deviceInfo?.deviceModel || latest.record.deviceModel || latest.record.device || "—")
          : latest?.kind === "job"
          ? `${latest.record.brand} ${latest.record.deviceModel}`.trim() || "—"
          : "No history";
      const latestStatus =
        latest?.kind === "appointment" ? latest.record.status
          : latest?.kind === "job" ? latest.record.status
          : "—";
      return { customer, appointments: linked, jobs: linkedJobs, latestEntry: latest, latestDevice, latestStatus };
    });

    // Derive virtual customers from appointments not linked to any real customer record
    const unlinked = appointments.filter(
      (a) => !a.customerId || !realCustomerIds.has(a.customerId)
    );

    const virtualMap = new Map<string, AppointmentRecord[]>();
    for (const apt of unlinked) {
      const key = apt.customer?.trim().toLowerCase();
      if (!key) continue;
      const group = virtualMap.get(key) ?? [];
      group.push(apt);
      virtualMap.set(key, group);
    }

    const virtualRows: CustomerSearchRow[] = [];
    for (const apts of virtualMap.values()) {
      const first = apts[0];
      const info = first.customerInfo;
      const nameParts = (first.customer || "").trim().split(" ");
      const virtualCustomer: CustomerRecord = {
        id: first.customerId || `apt-cus-${first.id}`,
        firstName: info?.firstName || nameParts[0] || first.customer,
        lastName: info?.lastName || nameParts.slice(1).join(" ") || "",
        fullName: first.customer || `${info?.firstName ?? ""} ${info?.lastName ?? ""}`.trim(),
        email: info?.email || "",
        phoneNumber: info?.phoneNumber || "",
        addressLine1: info?.addressLine1 || "",
        addressLine2: info?.addressLine2,
        county: info?.county || "",
        postcode: info?.postcode || "",
        createdAt: first.createdAt || first.date || "",
        updatedAt: first.updatedAt || first.date || "",
      };
      const history = buildServiceHistory(apts, []);
      const latest = history[0] ?? null;
      const latestDevice = latest?.kind === "appointment"
        ? (latest.record.deviceInfo?.deviceModel || latest.record.deviceModel || latest.record.device || "—")
        : "—";
      const latestStatus = latest?.kind === "appointment" ? latest.record.status : "—";
      virtualRows.push({ customer: virtualCustomer, appointments: apts, jobs: [], latestEntry: latest, latestDevice, latestStatus });
    }

    return [...realRows, ...virtualRows];
  }, [customers, appointments, jobs]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchRows;

    return searchRows.filter((row) => {
      const { customer } = row;
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      const aptIds = row.appointments.map((a) => a.id.toLowerCase()).join(" ");
      const jobIds = row.jobs.map((j) => j.id.toLowerCase()).join(" ");

      return (
        customer.id.toLowerCase().includes(q) ||
        fullName.includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.phoneNumber.toLowerCase().includes(q) ||
        row.latestDevice.toLowerCase().includes(q) ||
        aptIds.includes(q) ||
        jobIds.includes(q)
      );
    });
  }, [query, searchRows]);

  useEffect(() => {
    if (!selectedCustomerId && filteredRows.length > 0) {
      setSelectedCustomerId(filteredRows[0].customer.id);
      return;
    }
    if (selectedCustomerId && !filteredRows.some((r) => r.customer.id === selectedCustomerId)) {
      setSelectedCustomerId(filteredRows[0]?.customer.id ?? null);
    }
  }, [filteredRows, selectedCustomerId]);

  const selectedRow = filteredRows.find((r) => r.customer.id === selectedCustomerId) ?? null;
  const selectedCustomer = selectedRow?.customer ?? null;

  const serviceHistory = useMemo(() => {
    if (!selectedRow) return [];
    return buildServiceHistory(selectedRow.appointments, selectedRow.jobs);
  }, [selectedRow]);

  function openAppointment(id: string) {
    navigate("/appointment-management", { state: { openId: id } });
  }

  function openJob(id: string) {
    navigate("/repair-tracking", { state: { openId: id } });
  }

  async function handleDeleteCustomer(id: string) {
    const name = selectedCustomer?.fullName ?? id;
    const confirmed = window.confirm(`Delete customer "${name}"? This cannot be undone.`);
    if (!confirmed) return;
    await deleteCustomer(id);
    logEvent(id, "CUSTOMER_UPDATED", `Customer ${id} (${name}) deleted by ${selectedRole}.`, { entityType: "customer", createdBy: selectedRole });
    setSelectedCustomerId(null);
  }

  if (!canAccessCustomerSearch) {
    return (
      <section className="ms-customer-search">
        <div className="ms-customer-search__empty">
          <h1>Customer Search</h1>
          <p>You do not have access to customer search.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ms-customer-search">
      <div className="ms-customer-search__header">
        <div>
          <h1>Customer Search</h1>
          <p>Search customers and view their full service history across appointments and jobs.</p>
          <span className="ms-customer-search__role">
            Active role: <strong>{selectedRole}</strong>
          </span>
        </div>
      </div>

      <div className="ms-customer-search__layout">
        {/* ── Table panel ─────────────────────────────────── */}
        <div className="ms-customer-search__panel">
          <div className="ms-customer-search__searchbar">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, email, phone, customer ID, appointment ID, or job ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="ms-customer-search__table-wrap">
            <table className="ms-customer-search__table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Latest Device</th>
                  <th>Appointments</th>
                  <th>Jobs</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.customer.id}
                    className={selectedCustomerId === row.customer.id ? "is-selected" : ""}
                    onClick={() => setSelectedCustomerId(row.customer.id)}
                  >
                    <td>{row.customer.id}</td>
                    <td>{row.customer.fullName}</td>
                    <td>{row.customer.email}</td>
                    <td>{row.customer.phoneNumber}</td>
                    <td>{row.latestDevice}</td>
                    <td>{row.appointments.length}</td>
                    <td>{row.jobs.length}</td>
                    <td>
                      <span className="ms-customer-search__status">{row.latestStatus}</span>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="ms-customer-search__no-results">
                      No customers matched your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────────────── */}
        <aside className="ms-customer-search__side">
          {/* Customer details */}
          <div className="ms-customer-search__card">
            <div className="ms-customer-search__card-head">
              <UserRound size={16} />
              <h2>Customer Details</h2>
              {selectedCustomer && canDeleteRecords && (
                <button
                  type="button"
                  className="ms-customer-search__delete-btn"
                  onClick={() => void handleDeleteCustomer(selectedCustomer.id)}
                  title="Delete customer"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            {selectedCustomer ? (
              <div className="ms-customer-search__details">
                <div className="ms-customer-search__detail-row">
                  <span>Customer ID</span>
                  <strong>{selectedCustomer.id}</strong>
                </div>
                <div className="ms-customer-search__detail-row">
                  <span>Full Name</span>
                  <strong>{selectedCustomer.fullName}</strong>
                </div>
                <div className="ms-customer-search__detail-row">
                  <span>Email</span>
                  <strong>{selectedCustomer.email || "—"}</strong>
                </div>
                <div className="ms-customer-search__detail-row">
                  <span>Phone</span>
                  <strong>{selectedCustomer.phoneNumber || "—"}</strong>
                </div>
                <div className="ms-customer-search__detail-row">
                  <span>Address</span>
                  <strong>
                    {[
                      selectedCustomer.addressLine1,
                      selectedCustomer.addressLine2,
                      selectedCustomer.county,
                      selectedCustomer.postcode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="ms-customer-search__placeholder">Select a customer to view details.</p>
            )}
          </div>

          {/* Service history */}
          <div className="ms-customer-search__card">
            <div className="ms-customer-search__card-head">
              <CalendarClock size={16} />
              <h2>Service History</h2>
              {selectedRow && (
                <span className="ms-customer-search__history-count">
                  {serviceHistory.length} record{serviceHistory.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {serviceHistory.length > 0 ? (
              <div className="ms-customer-search__history">
                {serviceHistory.map((entry) => {
                  if (entry.kind === "appointment") {
                    const apt = entry.record;
                    return (
                      <div key={apt.id} className="ms-customer-search__history-item ms-customer-search__history-item--apt">
                        <div className="ms-customer-search__history-item-header">
                          <div className="ms-customer-search__history-item-icon">
                            <CalendarClock size={13} />
                          </div>
                          <strong>{apt.id}</strong>
                          <span className="ms-customer-search__history-badge ms-customer-search__history-badge--apt">
                            Appointment
                          </span>
                        </div>
                        <span>{apt.deviceModel || apt.device || "—"}</span>
                        <span>{apt.date}{apt.time ? ` at ${apt.time}` : ""}</span>
                        <span className="ms-customer-search__history-status">{apt.status}</span>
                        {canAccessAppointmentManagement && (
                          <button
                            type="button"
                            className="ms-customer-search__nav-btn"
                            onClick={() => openAppointment(apt.id)}
                          >
                            <ExternalLink size={12} />
                            Open in Appointments
                          </button>
                        )}
                      </div>
                    );
                  }

                  const job = entry.record;
                  return (
                    <div key={job.id} className="ms-customer-search__history-item ms-customer-search__history-item--job">
                      <div className="ms-customer-search__history-item-header">
                        <div className="ms-customer-search__history-item-icon ms-customer-search__history-item-icon--job">
                          <Briefcase size={13} />
                        </div>
                        <strong>{job.id}</strong>
                        <span className="ms-customer-search__history-badge ms-customer-search__history-badge--job">
                          Job
                        </span>
                      </div>
                      <span>{job.brand} {job.deviceModel}</span>
                      <span>{job.checkInCondition || "—"}</span>
                      <span className="ms-customer-search__history-status">{job.status}</span>
                      {canAccessRepairTracking && (
                        <button
                          type="button"
                          className="ms-customer-search__nav-btn ms-customer-search__nav-btn--job"
                          onClick={() => openJob(job.id)}
                        >
                          <ExternalLink size={12} />
                          Open in Repairs
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="ms-customer-search__placeholder">
                {selectedCustomer
                  ? "No service history for this customer yet."
                  : "Select a customer to view their service history."}
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
