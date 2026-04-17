import "./FormFiller.css";
import { useState } from "react";
import type { FormRecord, FormField } from "../formTypes";

type FieldValues = Record<string, string | string[] | boolean>;

type Props = {
  form: FormRecord;
  onSubmit: (values: FieldValues) => void;
  isPreview?: boolean;
};

function buildInitialValues(fields: FormField[]): FieldValues {
  const values: FieldValues = {};
  for (const field of fields) {
    if (field.type === "checkbox") values[field.id] = [];
    else if (field.type === "button") continue;
    else values[field.id] = "";
  }
  return values;
}

export default function FormFiller({ form, onSubmit, isPreview = false }: Props) {
  const [values, setValues] = useState<FieldValues>(() => buildInitialValues(form.fields));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function setValue(fieldId: string, value: string | string[] | boolean) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: "" }));
  }

  function toggleCheckbox(fieldId: string, option: string) {
    const current = (values[fieldId] as string[]) ?? [];
    const next = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    setValue(fieldId, next);
  }

  function handleClear() {
    setValues(buildInitialValues(form.fields));
    setErrors({});
    setSubmitted(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPreview) { setSubmitted(true); return; }

    const newErrors: Record<string, string> = {};
    for (const field of form.fields) {
      if (field.type === "button") continue;
      if (!field.required) continue;
      const val = values[field.id];
      if (field.type === "checkbox") {
        if ((val as string[]).length === 0) newErrors[field.id] = "Please select at least one option.";
      } else {
        if (!String(val ?? "").trim()) newErrors[field.id] = "This field is required.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(values);
    setSubmitted(true);
    setValues(buildInitialValues(form.fields));
    setErrors({});
  }

  if (submitted && !isPreview) {
    return (
      <div className="ms-form-filler__success">
        <div className="ms-form-filler__success-icon">✓</div>
        <h3>Submitted</h3>
        <p>Your response has been recorded.</p>
        <button onClick={() => setSubmitted(false)}>Submit another</button>
      </div>
    );
  }

  return (
    <form className="ms-form-filler" onSubmit={handleSubmit} noValidate>
      {isPreview && (
        <div className="ms-form-filler__preview-banner">Preview mode — responses are not saved</div>
      )}

      {form.fields.length === 0 ? (
        <p className="ms-form-filler__empty">This form has no fields yet.</p>
      ) : (
        <div className="ms-form-filler__fields">
          {form.fields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={values[field.id]}
              error={errors[field.id]}
              onChange={(val) => setValue(field.id, val)}
              onToggleCheckbox={(opt) => toggleCheckbox(field.id, opt)}
              onClear={handleClear}
            />
          ))}
        </div>
      )}

      {/* Render a default submit button if no button field exists */}
      {!form.fields.some((f) => f.type === "button") && form.fields.length > 0 && (
        <button type="submit" className="ms-form-filler__submit">
          {isPreview ? "Preview Submit" : "Submit"}
        </button>
      )}
    </form>
  );
}

type FieldInputProps = {
  field: FormField;
  value: string | string[] | boolean | undefined;
  error?: string;
  onChange: (val: string | string[] | boolean) => void;
  onToggleCheckbox: (option: string) => void;
  onClear: () => void;
};

function FieldInput({ field, value, error, onChange, onToggleCheckbox, onClear }: FieldInputProps) {
  if (field.type === "button") {
    return (
      <div className="ms-form-filler__field">
        <button
          type={field.buttonAction === "submit" ? "submit" : "button"}
          className="ms-form-filler__button-field"
          onClick={field.buttonAction === "clear" ? onClear : undefined}
        >
          {field.buttonLabel || "Submit"}
        </button>
      </div>
    );
  }

  return (
    <div className={`ms-form-filler__field${error ? " has-error" : ""}`}>
      <label className="ms-form-filler__label">
        {field.label}
        {field.required && <span className="ms-form-filler__required"> *</span>}
      </label>

      {field.type === "text" && (
        <input
          type="text"
          value={(value as string) ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="ms-form-filler__input"
        />
      )}

      {field.type === "textarea" && (
        <textarea
          value={(value as string) ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="ms-form-filler__textarea"
          rows={3}
        />
      )}

      {field.type === "number" && (
        <input
          type="number"
          value={(value as string) ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="ms-form-filler__input"
        />
      )}

      {field.type === "date" && (
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="ms-form-filler__input"
        />
      )}

      {field.type === "dropdown" && (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="ms-form-filler__select"
        >
          <option value="">Select an option</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {field.type === "checkbox" && (
        <div className="ms-form-filler__checkboxes">
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="ms-form-filler__checkbox-row">
              <input
                type="checkbox"
                checked={((value as string[]) ?? []).includes(opt)}
                onChange={() => onToggleCheckbox(opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {error && <span className="ms-form-filler__error">{error}</span>}
    </div>
  );
}
