import "./FormsPage.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Settings2, Copy, Archive, Trash2, MoreHorizontal, ClipboardList, MapPin } from "lucide-react";
import { useForms } from "../../context/FormsContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import type { FormRecord, FormLocation } from "./formTypes";

const STATUS_LABELS: Record<FormRecord["status"], string> = {
  Draft: "Draft",
  Active: "Active",
  Archived: "Archived",
};

const LOCATION_LABELS: Record<FormLocation, string> = {
  system: "System",
  customers: "Customers",
  scheduling: "Scheduling",
};

export default function FormsPage() {
  const navigate = useNavigate();
  const { forms, createForm, deleteForm, duplicateForm, updateForm } = useForms();
  const { canManageForms, canSubmitForms } = useRolePermissions();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLocation, setNewLocation] = useState<FormLocation>("system");
  const [createError, setCreateError] = useState("");

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) { setCreateError("Form name is required."); return; }
    const form = createForm(newName.trim(), newDesc.trim() || undefined, newLocation);
    setShowCreate(false);
    setNewName("");
    setNewDesc("");
    setNewLocation("system");
    setCreateError("");
    navigate(`/forms/${form.id}/manage`);
  }

  function handleDuplicate(id: string) {
    setOpenMenuId(null);
    duplicateForm(id);
  }

  function handleArchive(form: FormRecord) {
    setOpenMenuId(null);
    updateForm(form.id, { status: form.status === "Archived" ? "Draft" : "Archived" });
  }

  function handleDelete(id: string) {
    setOpenMenuId(null);
    setConfirmDeleteId(id);
  }

  function confirmDelete() {
    if (confirmDeleteId) deleteForm(confirmDeleteId);
    setConfirmDeleteId(null);
  }

  const visibleForms = forms.filter((f) => f.status !== "Archived" || openMenuId === f.id);
  const archivedCount = forms.filter((f) => f.status === "Archived").length;

  return (
    <section className="ms-forms-page">
      <div className="ms-forms-page__header">
        <div>
          <h1>Forms</h1>
          <p>Build and manage custom forms for your team. Fill forms to capture structured data.</p>
        </div>
        {canManageForms && (
          <button className="ms-forms-page__create-btn" onClick={() => setShowCreate(true)}>
            <Plus size={15} />
            New Form
          </button>
        )}
      </div>

      {forms.length === 0 ? (
        <div className="ms-forms-page__empty">
          <ClipboardList size={40} strokeWidth={1.4} />
          <p>No forms yet.</p>
          {canManageForms && (
            <button className="ms-forms-page__create-btn" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Create your first form
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="ms-forms-page__grid">
            {forms.filter((f) => f.status !== "Archived").map((form) => (
              <FormCard
                key={form.id}
                form={form}
                canManage={canManageForms}
                canFill={canSubmitForms}
                menuOpen={openMenuId === form.id}
                onOpenMenu={() => setOpenMenuId(openMenuId === form.id ? null : form.id)}
                onCloseMenu={() => setOpenMenuId(null)}
                onFill={() => navigate(`/forms/${form.id}`)}
                onEdit={() => navigate(`/forms/${form.id}/manage`)}
                onDuplicate={() => handleDuplicate(form.id)}
                onArchive={() => handleArchive(form)}
                onDelete={() => handleDelete(form.id)}
              />
            ))}
          </div>

          {archivedCount > 0 && (
            <details className="ms-forms-page__archived-section">
              <summary>Archived forms ({archivedCount})</summary>
              <div className="ms-forms-page__grid ms-forms-page__grid--archived">
                {forms.filter((f) => f.status === "Archived").map((form) => (
                  <FormCard
                    key={form.id}
                    form={form}
                    canManage={canManageForms}
                    canFill={false}
                    menuOpen={openMenuId === form.id}
                    onOpenMenu={() => setOpenMenuId(openMenuId === form.id ? null : form.id)}
                    onCloseMenu={() => setOpenMenuId(null)}
                    onFill={() => navigate(`/forms/${form.id}`)}
                    onEdit={() => navigate(`/forms/${form.id}/manage`)}
                    onDuplicate={() => handleDuplicate(form.id)}
                    onArchive={() => handleArchive(form)}
                    onDelete={() => handleDelete(form.id)}
                  />
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {/* ── Create modal ──────────────────────────────────────────────── */}
      {showCreate && (
        <div className="ms-forms-page__modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="ms-forms-page__modal" onClick={(e) => e.stopPropagation()}>
            <h3>New Form</h3>
            <form onSubmit={handleCreate}>
              <div className="ms-forms-page__modal-field">
                <label>Form name *</label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setCreateError(""); }}
                  placeholder="e.g. Customer Checklist"
                />
                {createError && <span className="ms-forms-page__modal-error">{createError}</span>}
              </div>
              <div className="ms-forms-page__modal-field">
                <label>Description (optional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is this form for?"
                  rows={2}
                />
              </div>
              <div className="ms-forms-page__modal-field">
                <label>Sidebar location</label>
                <select
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value as FormLocation)}
                  className="ms-forms-page__modal-select"
                >
                  <option value="system">System</option>
                  <option value="customers">Customers</option>
                  <option value="scheduling">Scheduling</option>
                </select>
              </div>
              <div className="ms-forms-page__modal-actions">
                <button type="submit" className="ms-forms-page__modal-confirm">Create &amp; Edit</button>
                <button type="button" className="ms-forms-page__modal-cancel" onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); setNewLocation("system"); setCreateError(""); }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ──────────────────────────────────────── */}
      {confirmDeleteId && (
        <div className="ms-forms-page__modal-backdrop" onClick={() => setConfirmDeleteId(null)}>
          <div className="ms-forms-page__modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete form?</h3>
            <p className="ms-forms-page__modal-body">This will permanently delete the form and all its responses. This cannot be undone.</p>
            <div className="ms-forms-page__modal-actions">
              <button className="ms-forms-page__modal-danger" onClick={confirmDelete}>Delete</button>
              <button className="ms-forms-page__modal-cancel" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Click-away for open menus */}
      {openMenuId && (
        <div className="ms-forms-page__click-away" onClick={() => setOpenMenuId(null)} />
      )}
    </section>
  );
}

type CardProps = {
  form: FormRecord;
  canManage: boolean;
  canFill: boolean;
  menuOpen: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onFill: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

function FormCard({ form, canManage, canFill, menuOpen, onOpenMenu, onFill, onEdit, onDuplicate, onArchive, onDelete }: CardProps) {
  const statusClass = form.status === "Active" ? "is-active" : form.status === "Archived" ? "is-archived" : "is-draft";
  const createdDate = new Date(form.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="ms-forms-card">
      <div className="ms-forms-card__top">
        <div className="ms-forms-card__icon-wrap">
          <FileText size={18} />
        </div>
        <div className="ms-forms-card__meta">
          <span className={`ms-forms-card__status ${statusClass}`}>{STATUS_LABELS[form.status]}</span>
          {canManage && (
            <div className="ms-forms-card__menu-wrap">
              <button className="ms-forms-card__menu-btn" onClick={onOpenMenu} aria-label="Options">
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <div className="ms-forms-card__menu">
                  <button onClick={onDuplicate}><Copy size={13} /> Duplicate</button>
                  <button onClick={onArchive}>
                    <Archive size={13} />
                    {form.status === "Archived" ? "Unarchive" : "Archive"}
                  </button>
                  <button className="is-danger" onClick={onDelete}><Trash2 size={13} /> Delete</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <h3 className="ms-forms-card__name">{form.name}</h3>
      {form.description && <p className="ms-forms-card__desc">{form.description}</p>}

      <div className="ms-forms-card__stats">
        <span>{form.fields.length} field{form.fields.length !== 1 ? "s" : ""}</span>
        <span className="ms-forms-card__location">
          <MapPin size={10} />
          {LOCATION_LABELS[form.location ?? "system"]}
        </span>
        <span>Created {createdDate}</span>
      </div>

      <div className="ms-forms-card__actions">
        {canFill && form.status !== "Archived" && (
          <button className="ms-forms-card__fill-btn" onClick={onFill}>Fill Form</button>
        )}
        {canManage && (
          <button className="ms-forms-card__edit-btn" onClick={onEdit}>
            <Settings2 size={13} /> Manage
          </button>
        )}
      </div>
    </div>
  );
}
