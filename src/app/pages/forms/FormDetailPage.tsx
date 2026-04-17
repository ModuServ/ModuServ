import "./FormDetailPage.css";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Settings2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useForms } from "../../context/FormsContext";
import { useAuth } from "../../../context/AuthContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import FormFiller from "./components/FormFiller";
import type { FormResponse } from "./formTypes";

type Tab = "fill" | "responses";

export default function FormDetailPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { getFormById, addResponse, getResponsesForForm, deleteResponse } = useForms();
  const { user } = useAuth();
  const { canManageForms, canSubmitForms } = useRolePermissions();

  const [tab, setTab] = useState<Tab>("fill");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const form = getFormById(formId ?? "");

  if (!form) {
    return (
      <div className="ms-form-detail__not-found">
        <p>Form not found.</p>
        <button onClick={() => navigate("/forms")}>Back to Forms</button>
      </div>
    );
  }

  const responses = getResponsesForForm(form.id);

  function handleSubmit(values: FormResponse["values"]) {
    addResponse(form!.id, values, user?.username ?? "Unknown");
    setTab("responses");
  }

  function renderValue(val: string | string[] | boolean | undefined): string {
    if (val === undefined || val === null || val === "") return "—";
    if (Array.isArray(val)) return val.length > 0 ? val.join(", ") : "—";
    return String(val);
  }

  const filledFields = form.fields.filter((f) => f.type !== "button");

  return (
    <section className="ms-form-detail">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="ms-form-detail__header">
        <button className="ms-form-detail__back" onClick={() => navigate("/forms")}>
          <ArrowLeft size={15} /> Forms
        </button>
        <div className="ms-form-detail__header-info">
          <h1>{form.name}</h1>
          {form.description && <p>{form.description}</p>}
        </div>
        {canManageForms && (
          <button
            className="ms-form-detail__manage-btn"
            onClick={() => navigate(`/forms/${form.id}/manage`)}
          >
            <Settings2 size={14} /> Manage
          </button>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="ms-form-detail__tabs">
        <button
          className={`ms-form-detail__tab${tab === "fill" ? " is-active" : ""}`}
          onClick={() => setTab("fill")}
        >
          Fill Form
        </button>
        <button
          className={`ms-form-detail__tab${tab === "responses" ? " is-active" : ""}`}
          onClick={() => setTab("responses")}
        >
          Responses
          {responses.length > 0 && (
            <span className="ms-form-detail__tab-badge">{responses.length}</span>
          )}
        </button>
      </div>

      {/* ── Fill tab ──────────────────────────────────────────────────── */}
      {tab === "fill" && (
        <div className="ms-form-detail__fill-panel">
          {form.status === "Archived" ? (
            <div className="ms-form-detail__archived-notice">
              This form is archived and can no longer accept responses.
            </div>
          ) : !canSubmitForms ? (
            <div className="ms-form-detail__archived-notice">
              You do not have permission to submit this form.
            </div>
          ) : (
            <FormFiller form={form} onSubmit={handleSubmit} />
          )}
        </div>
      )}

      {/* ── Responses tab ─────────────────────────────────────────────── */}
      {tab === "responses" && (
        <div className="ms-form-detail__responses-panel">
          {responses.length === 0 ? (
            <div className="ms-form-detail__empty">
              <p>No responses yet.</p>
              <span>Fill and submit the form to see responses here.</span>
            </div>
          ) : (
            <div className="ms-form-detail__response-list">
              {[...responses].reverse().map((response) => (
                <ResponseRow
                  key={response.id}
                  response={response}
                  fields={filledFields.map((f) => ({ id: f.id, label: f.label }))}
                  expanded={expandedId === response.id}
                  onToggle={() => setExpandedId(expandedId === response.id ? null : response.id)}
                  canDelete={canManageForms}
                  onDelete={() => setConfirmDeleteId(response.id)}
                  renderValue={renderValue}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Delete confirm ─────────────────────────────────────────────── */}
      {confirmDeleteId && (
        <div className="ms-form-detail__modal-backdrop" onClick={() => setConfirmDeleteId(null)}>
          <div className="ms-form-detail__modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete response?</h3>
            <p>This cannot be undone.</p>
            <div className="ms-form-detail__modal-actions">
              <button
                className="ms-form-detail__modal-danger"
                onClick={() => { deleteResponse(confirmDeleteId); setConfirmDeleteId(null); }}
              >
                Delete
              </button>
              <button className="ms-form-detail__modal-cancel" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type ResponseRowProps = {
  response: FormResponse;
  fields: { id: string; label: string }[];
  expanded: boolean;
  onToggle: () => void;
  canDelete: boolean;
  onDelete: () => void;
  renderValue: (val: string | string[] | boolean | undefined) => string;
};

function ResponseRow({ response, fields, expanded, onToggle, canDelete, onDelete, renderValue }: ResponseRowProps) {
  return (
    <div className="ms-form-detail__response">
      <div className="ms-form-detail__response-header" onClick={onToggle}>
        <div className="ms-form-detail__response-meta">
          <span className="ms-form-detail__response-by">{response.submittedBy}</span>
          <span className="ms-form-detail__response-at">{response.submittedAt}</span>
          <span className="ms-form-detail__response-id">{response.id}</span>
        </div>
        <div className="ms-form-detail__response-controls">
          {canDelete && (
            <button
              className="ms-form-detail__response-delete"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              aria-label="Delete response"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button className="ms-form-detail__response-expand" aria-label="Toggle">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="ms-form-detail__response-body">
          {fields.length === 0 ? (
            <p className="ms-form-detail__response-empty">No field data.</p>
          ) : (
            <table className="ms-form-detail__response-table">
              <tbody>
                {fields.map((field) => (
                  <tr key={field.id}>
                    <td className="ms-form-detail__response-field-label">{field.label}</td>
                    <td className="ms-form-detail__response-field-value">
                      {renderValue(response.values[field.id])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
