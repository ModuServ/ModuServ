import "./FieldEditor.css";
import { Trash2, ChevronUp, ChevronDown, Plus, X } from "lucide-react";
import type { FormField } from "../formTypes";

type Props = {
  field: FormField;
  index: number;
  total: number;
  onChange: (updated: FormField) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

const FIELD_TYPE_LABELS: Record<FormField["type"], string> = {
  text: "Text",
  textarea: "Textarea",
  dropdown: "Dropdown",
  checkbox: "Checkbox",
  date: "Date",
  number: "Number",
  button: "Button",
};

export default function FieldEditor({ field, index, total, onChange, onDelete, onMoveUp, onMoveDown }: Props) {
  function set<K extends keyof FormField>(key: K, value: FormField[K]) {
    onChange({ ...field, [key]: value });
  }

  function addOption() {
    const current = field.options ?? [];
    set("options", [...current, `Option ${current.length + 1}`]);
  }

  function updateOption(i: number, value: string) {
    const updated = [...(field.options ?? [])];
    updated[i] = value;
    set("options", updated);
  }

  function removeOption(i: number) {
    set("options", (field.options ?? []).filter((_, idx) => idx !== i));
  }

  const hasOptions = field.type === "dropdown" || field.type === "checkbox";
  const hasPlaceholder = field.type === "text" || field.type === "textarea" || field.type === "number";
  const isButton = field.type === "button";

  return (
    <div className="ms-field-editor">
      <div className="ms-field-editor__header">
        <span className="ms-field-editor__type-pill">{FIELD_TYPE_LABELS[field.type]}</span>
        <div className="ms-field-editor__controls">
          <button
            className="ms-field-editor__ctrl-btn"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label="Move field up"
          >
            <ChevronUp size={14} />
          </button>
          <button
            className="ms-field-editor__ctrl-btn"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label="Move field down"
          >
            <ChevronDown size={14} />
          </button>
          <button
            className="ms-field-editor__ctrl-btn ms-field-editor__ctrl-btn--delete"
            onClick={onDelete}
            aria-label="Delete field"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Label */}
      {!isButton && (
        <div className="ms-field-editor__row">
          <label>Label</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="Field label"
          />
        </div>
      )}

      {/* Placeholder */}
      {hasPlaceholder && (
        <div className="ms-field-editor__row">
          <label>Placeholder</label>
          <input
            type="text"
            value={field.placeholder ?? ""}
            onChange={(e) => set("placeholder", e.target.value)}
            placeholder="Hint text shown inside the field"
          />
        </div>
      )}

      {/* Required toggle */}
      {!isButton && (
        <div className="ms-field-editor__row ms-field-editor__row--toggle">
          <label>Required</label>
          <button
            className={`ms-field-editor__toggle${field.required ? " is-on" : ""}`}
            onClick={() => set("required", !field.required)}
            role="switch"
            aria-checked={field.required}
          >
            <span className="ms-field-editor__toggle-knob" />
          </button>
        </div>
      )}

      {/* Options for dropdown / checkbox */}
      {hasOptions && (
        <div className="ms-field-editor__options">
          <label>Options</label>
          {(field.options ?? []).map((opt, i) => (
            <div key={i} className="ms-field-editor__option-row">
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
              />
              <button
                className="ms-field-editor__option-remove"
                onClick={() => removeOption(i)}
                aria-label={`Remove option ${i + 1}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button className="ms-field-editor__add-option" onClick={addOption}>
            <Plus size={12} /> Add option
          </button>
        </div>
      )}

      {/* Button field settings */}
      {isButton && (
        <div className="ms-field-editor__button-settings">
          <div className="ms-field-editor__row">
            <label>Button label</label>
            <input
              type="text"
              value={field.buttonLabel ?? ""}
              onChange={(e) => set("buttonLabel", e.target.value)}
              placeholder="e.g. Submit"
            />
          </div>
          <div className="ms-field-editor__row">
            <label>Action</label>
            <select
              value={field.buttonAction ?? "submit"}
              onChange={(e) => set("buttonAction", e.target.value as "submit" | "clear")}
            >
              <option value="submit">Submit form</option>
              <option value="clear">Clear form</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
