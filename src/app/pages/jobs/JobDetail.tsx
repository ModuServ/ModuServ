import { Mail, MessageSquare, Phone, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { JobForm } from "../../../components/jobs/JobForm";
import { StatusBreadcrumb } from "../../../components/jobs/StatusBreadcrumb";
import { useAuth } from "../../../context/AuthContext";
import { useJobs } from "../../../context/JobsContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { API_BASE, authFetch } from "../../../lib/api";

type StatusHistoryItem = {
  id: number;
  jobId: string;
  status: string;
  changedAt: string;
  changedBy: string;
};

type JobNote = {
  id: number;
  jobId: string;
  content: string;
  createdAt: string;
  createdBy: string;
};

type JobActivity = {
  id: number;
  jobId: string;
  action: string;
  details: string;
  createdAt: string;
  createdBy: string;
};

export default function JobDetail() {
  const { id } = useParams();
  const { getJobById, updateJob } = useJobs();
  const { user } = useAuth();

  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [activities, setActivities] = useState<JobActivity[]>([]);
  const [noteText, setNoteText] = useState("");
  const [rightPaneTab, setRightPaneTab] = useState<"phone" | "email" | "sms" | "complaint">("phone");

  const job = useMemo(() => (id ? getJobById(id) : undefined), [id, getJobById]);
  const { canAddNotes } = useRolePermissions();
  const canEdit = !!user;

  const loadHistory = async () => {
    if (!id) return;
    const response = await authFetch(`${API_BASE}/jobs/${id}/status-history`);
    const data = (await response.json()) as StatusHistoryItem[];
    setHistory(data);
  };

  const loadNotes = async () => {
    if (!id) return;
    const response = await authFetch(`${API_BASE}/jobs/${id}/notes`);
    const data = (await response.json()) as JobNote[];
    setNotes(data);
  };

  const loadActivity = async () => {
    if (!id) return;
    const response = await authFetch(`${API_BASE}/jobs/${id}/activity`);
    const data = (await response.json()) as JobActivity[];
    setActivities(data);
  };

  useEffect(() => {
    void loadHistory();
    void loadNotes();
    void loadActivity();
  }, [id]);

  const addNote = async () => {
    if (!id || !noteText.trim() || !user || !canAddNotes) return;

    const response = await authFetch(`${API_BASE}/jobs/${id}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: noteText.trim(), createdBy: user.username }),
    });

    if (response.ok) {
      setNoteText("");
      await loadNotes();
      await loadActivity();
    }
  };

  if (!job) {
    return <p>Job not found.</p>;
  }

  return (
    <section className="APT-detail-page">
      <div className="page-row">
        <div>
          <h1>Job Detail</h1>
          <div className="APT-detail-breadcrumb-text">Jobs &gt; Job Detail &gt; {job.id}</div>
        </div>
        <span className="APT-id-badge">{job.id}</span>
      </div>

      <StatusBreadcrumb history={history} currentStatus={job.status} />

      <div className="APT-detail-layout">
        <div className="APT-detail-left">
          {canEdit ? (
            <JobForm
              initialValues={{
                customerFirstName: job.customerFirstName,
                customerLastName: job.customerLastName,
                customerEmail: job.customerEmail,
                customerPhone: job.customerPhone,
                addressLine1: job.addressLine1,
                addressLine2: job.addressLine2,
                county: job.county,
                postcode: job.postcode,

                brand: job.brand,
                deviceType: job.deviceType,
                deviceModel: job.deviceModel,
                colour: job.colour,
                imei: job.imei,
                serialNumber: job.serialNumber,
                checkInCondition: job.checkInCondition,

                partRequired: job.partRequired,
                partAllocated: job.partAllocated,
                partName: job.partName,
                partType: job.partType,
                partSupplier: job.partSupplier,
                partStatus: job.partStatus,

                paymentAmount: String(job.paymentAmount ?? ""),
                paymentType: job.paymentType,
                paymentStatus: job.paymentStatus,

                qcStatus: job.qcStatus,
                backglass: job.backglass,
                status: job.status,
                priority: job.priority,
                suggestedPriority: job.suggestedPriority,
                category: job.category,
                priorityWasOverridden: job.priorityWasOverridden,
                ber: job.ber,
                repairStartTime: String(job.repairStartTime ?? ""),
                repairEndTime: String(job.repairEndTime ?? ""),
                repairDurationMinutes: String(job.repairDurationMinutes ?? ""),
                isDeleted: job.isDeleted,
                deletedAt: job.deletedAt,
                deletedBy: job.deletedBy,
                restoredAt: job.restoredAt,
                restoredBy: job.restoredBy,
              }}
              submitLabel="Update Job"
              onSubmit={async (values) => {
                updateJob(job.id, values);
                setTimeout(async () => {
                  await loadHistory();
                  await loadActivity();
                }, 400);
              }}
            />
          ) : (
            <div className="card">
              <h3 className="section-title">Read Only View</h3>
              <div className="readonly-job">
                <p><strong>Customer:</strong> {job.customerFirstName} {job.customerLastName}</p>
                <p><strong>Device:</strong> {job.brand} {job.deviceModel}</p>
                <p><strong>Status:</strong> {job.status}</p>
                <p><strong>Priority:</strong> {job.priority}</p>
                <p><strong>QC Status:</strong> {job.qcStatus || "Not provided"}</p>
                <p><strong>Backglass:</strong> {job.backglass || "Not provided"}</p>
                <p><strong>BER:</strong> {job.ber ? <span className="ber-inline">Beyond Economic Repair</span> : "No"}</p>
                <p><strong>Repair Duration:</strong> {job.repairDurationMinutes || "Not recorded"}</p>
              </div>
            </div>
          )}
        </div>

        <aside className="APT-detail-right">
          <div className="card right-pane-tabs-card">
            <div className="right-pane-tabs">
              <button
                type="button"
                className={`right-pane-tab ${rightPaneTab === "phone" ? "right-pane-tab--active" : ""}`}
                onClick={() => setRightPaneTab("phone")}
              >
                <Phone size={16} /> Phone
              </button>
              <button
                type="button"
                className={`right-pane-tab ${rightPaneTab === "email" ? "right-pane-tab--active" : ""}`}
                onClick={() => setRightPaneTab("email")}
              >
                <Mail size={16} /> Email
              </button>
              <button
                type="button"
                className={`right-pane-tab ${rightPaneTab === "sms" ? "right-pane-tab--active" : ""}`}
                onClick={() => setRightPaneTab("sms")}
              >
                <MessageSquare size={16} /> SMS
              </button>
              <button
                type="button"
                className={`right-pane-tab ${rightPaneTab === "complaint" ? "right-pane-tab--active" : ""}`}
                onClick={() => setRightPaneTab("complaint")}
              >
                <ShieldAlert size={16} /> Complaint
              </button>
            </div>

            <div className="right-pane-comms-body">
              {rightPaneTab === "phone" ? <p>Phone interaction area.</p> : null}
              {rightPaneTab === "email" ? <p>Email template and compose area.</p> : null}
              {rightPaneTab === "sms" ? <p>SMS template and compose area.</p> : null}
              {rightPaneTab === "complaint" ? <p>Complaint logging area.</p> : null}
            </div>
          </div>

          <div className="card right-pane-card">
            <h3 className="section-title">Notes</h3>
            {canAddNotes && (
              <>
                <textarea
                  className="right-pane-notes-input"
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                />
                <div className="form-actions">
                  <button type="button" className="button-link button-link--button" onClick={() => void addNote()}>
                    Add Note
                  </button>
                </div>
              </>
            )}

            <div className="right-pane-list">
              {notes.length === 0 ? <p>No notes yet.</p> : null}
              {notes.map((note) => (
                <div key={note.id} className="right-pane-item">
                  <p className="right-pane-item__title">{note.createdBy}</p>
                  <p className="right-pane-item__text">{note.content}</p>
                  <span className="right-pane-item__time">{new Date(note.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card right-pane-card">
            <h3 className="section-title">Activity</h3>
            <div className="right-pane-list">
              {activities.length === 0 ? <p>No activity yet.</p> : null}
              {activities.map((item) => (
                <div key={item.id} className="right-pane-item">
                  <p className="right-pane-item__title">{item.action}</p>
                  <p className="right-pane-item__text">{item.details}</p>
                  <span className="right-pane-item__time">
                    {item.createdBy} · {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}




