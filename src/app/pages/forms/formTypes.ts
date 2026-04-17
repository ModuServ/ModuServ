export type FieldType =
  | "text"
  | "textarea"
  | "dropdown"
  | "checkbox"
  | "date"
  | "number"
  | "button";

export type FormField = {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  buttonLabel?: string;
  buttonAction?: "submit" | "clear";
};

export type FormStatus = "Draft" | "Active" | "Archived";
export type FormLocation = "system" | "customers" | "scheduling";

export type FormRecord = {
  id: string;
  name: string;
  description?: string;
  status: FormStatus;
  location: FormLocation;
  fields: FormField[];
  siteId: string;
  createdAt: string;
  updatedAt: string;
};

export type FormResponse = {
  id: string;
  formId: string;
  submittedBy: string;
  submittedAt: string;
  values: Record<string, string | string[] | boolean>;
};
