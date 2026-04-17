import "./FormManagePage.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Eye, ArrowLeft, Type, AlignLeft, ChevronDown, CheckSquare, Calendar, Hash, MousePointer, MapPin } from "lucide-react";
import { useForms, buildBlankField } from "../../context/FormsContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import FieldEditor from "./components/FieldEditor";
import FormFiller from "./components/FormFiller";
import type { FormField, FormStatus, FormLocation, FieldType } from "./formTypes";

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode }[] = [
  { type: "text",     label: "Text",     icon: <Type size={15} /> },
  { type: "textarea", label: "Textarea", icon: <AlignLeft size={15} /> },
  { type: "dropdown", label: "Dropdown", icon: <ChevronDown size={15} /> },
  { type: "checkbox", label: "Checkbox", icon: <CheckSquare size={15} /> },
  { type: "date",     label: "Date",     icon: <Calendar size={15} /> },
  { type: "number",   label: "Number",   icon: <Hash size={15} /> },
  { type: "button",   label: "Button",   icon: <MousePointer size={15} /> },
];

export default function FormManagePage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { getFormById, updateForm } = useForms();
  const { canManageForms } = useRolePermissions();

  const form = getFormById(formId ?? "");

  const [name, setName] = useState(form?.name ?? "");
  const [description, setDescription] = useState(form?.description ?? "");
  const [status, setStatus] = useState<FormStatus>(form?.status ?? "Draft");
  const [location, setLocation] = useState<FormLocation>(form?.location ?? "system");
  const [fields, setFields] = useState<FormField[]>(form?.fields ?? []);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Sync if form loads async
  useEffect(() => {
    if (form) {
      setName(form.name);
      setDescription(form.description ?? "");
      setStatus(form.status);
      setLocation(form.location ?? "system");
      setFields(form.fields);
    }
  }, [form?.id]);

  if (!form) {
    return (
      <div className="ms-form-manage__not-found">
        <p>Form not found.</p>
        <button onClick={() => navigate("/forms")}>Back to Forms</button>
      </div>
    );
  }

  if (!canManageForms) {
    return (
      <div className="ms-form-manage__not-found">
        <p>You do not have permission to manage forms.</p>
        <button onClick={() => navigate("/forms")}>Back to Forms</button>
      </div>
    );
  }

  function handleSave() {
    updateForm(form!.id, { name: name.trim() || form!.name, description, status, location, fields });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addField(type: FieldType) {
    setFields((prev) => [...prev, buildBlankField(type)]);
  }

  function updateField(index: number, updated: FormField) {
    setFields((prev) => prev.map((f, i) => (i === index ? updated : f)));
  }

  function deleteField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function moveField(index: number, direction: "up" | "down") {
    setFields((prev) => {
      const next = [...prev];
      const swap = direction === "up" ? index - 1 : index + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  }

  return (
    <section className="ms-form-manage">
      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <div className="ms-form-manage__topbar">
        <button className="ms-form-manage__back" onClick={() => navigate("/forms")}>
          <ArrowLeft size={15} /> Forms
        </button>

        <div className="ms-form-manage__topbar-center">
          <input
            className="ms-form-manage__title-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Form name"
          />
          <select
            className={`ms-form-manage__status-select ms-form-manage__status--${status.toLowerCase()}`}
            value={status}
            onChange={(e) => setStatus(e.target.value as FormStatus)}
          >
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
          </select>
          <div className="ms-form-manage__location-wrap">
            <MapPin size={13} className="ms-form-manage__location-icon" />
            <select
              className="ms-form-manage__location-select"
              value={location}
              onChange={(e) => setLocation(e.target.value as FormLocation)}
            >
              <option value="system">System</option>
              <option value="customers">Customers</option>
              <option value="scheduling">Scheduling</option>
            </select>
          </div>
        </div>

        <div className="ms-form-manage__topbar-actions">
          <button className="ms-form-manage__preview-btn" onClick={() => setShowPreview(true)}>
            <Eye size={14} /> Preview
          </button>
          <button className={`ms-form-manage__save-btn${saved ? " is-saved" : ""}`} onClick={handleSave}>
            <Save size={14} /> {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      <div className="ms-form-manage__body">
        {/* ── Left palette ─────────────────────────────────────────────── */}
        <aside className="ms-form-manage__palette">
          <p className="ms-form-manage__palette-title">Add Field</p>
          <div className="ms-form-manage__palette-list">
            {FIELD_TYPES.map(({ type, label, icon }) => (
              <button
                key={type}
                className="ms-form-manage__palette-item"
                onClick={() => addField(type)}
              >
                <span className="ms-form-manage__palette-icon">{icon}</span>
                {label}
              </button>
            ))}
          </div>

          <div className="ms-form-manage__palette-desc">
            <p className="ms-form-manage__palette-title" style={{ marginTop: 24 }}>Description</p>
            <textarea
              className="ms-form-manage__desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional form description…"
              rows={4}
            />
          </div>
        </aside>

        {/* ── Canvas ───────────────────────────────────────────────────── */}
        <main className="ms-form-manage__canvas">
          {fields.length === 0 ? (
            <div className="ms-form-manage__empty">
              <p>No fields yet.</p>
              <span>Click a field type on the left to add your first field.</span>
            </div>
          ) : (
            <div className="ms-form-manage__field-list">
              {fields.map((field, index) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  index={index}
                  total={fields.length}
                  onChange={(updated) => updateField(index, updated)}
                  onDelete={() => deleteField(index)}
                  onMoveUp={() => moveField(index, "up")}
                  onMoveDown={() => moveField(index, "down")}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Preview modal ────────────────────────────────────────────────── */}
      {showPreview && (
        <div className="ms-form-manage__preview-backdrop" onClick={() => setShowPreview(false)}>
          <div className="ms-form-manage__preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ms-form-manage__preview-header">
              <div>
                <h3>{name}</h3>
                {description && <p>{description}</p>}
              </div>
              <button onClick={() => setShowPreview(false)} className="ms-form-manage__preview-close">×</button>
            </div>
            <div className="ms-form-manage__preview-body">
              <FormFiller
                form={{ ...form, name, description, fields }}
                onSubmit={() => setShowPreview(false)}
                isPreview
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
