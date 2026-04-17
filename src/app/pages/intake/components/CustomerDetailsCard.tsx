import "./CustomerDetailsCard.css";
import { UserRound } from "lucide-react";
import type { IntakeFormData } from "../intakeTypes";

type Props = {
  form: IntakeFormData;
  disabled: boolean;
  onChange: <K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) => void;
};

export default function CustomerDetailsCard({ form, disabled, onChange }: Props) {
  return (
    <article className="ms-intake-card">
      <div className="ms-intake-card__header">
        <div className="ms-intake-card__icon-wrap">
          <UserRound size={18} />
        </div>
        <div>
          <h2>Customer Details</h2>
          <p>Capture the customer identity and contact information.</p>
        </div>
      </div>

      <div className="ms-intake-card__grid">
        <div className="ms-intake-card__field">
          <label>First Name</label>
          <input type="text" value={form.firstName} onChange={(e) => onChange("firstName", e.target.value)} placeholder="Enter first name" disabled={disabled} />
        </div>

        <div className="ms-intake-card__field">
          <label>Last Name</label>
          <input type="text" value={form.lastName} onChange={(e) => onChange("lastName", e.target.value)} placeholder="Enter last name" disabled={disabled} />
        </div>

        <div className="ms-intake-card__field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => onChange("email", e.target.value)} placeholder="Enter email" disabled={disabled} />
        </div>

        <div className="ms-intake-card__field">
          <label>Phone Number</label>
          <input type="text" value={form.phoneNumber} onChange={(e) => onChange("phoneNumber", e.target.value)} placeholder="Enter phone number" disabled={disabled} />
        </div>

        <div className="ms-intake-card__field">
          <label>Address Line 1</label>
          <input type="text" value={form.addressLine1} onChange={(e) => onChange("addressLine1", e.target.value)} placeholder="Enter address line 1" disabled={disabled} />
        </div>

        <div className="ms-intake-card__field">
          <label>Address Line 2</label>
          <input type="text" value={form.addressLine2} onChange={(e) => onChange("addressLine2", e.target.value)} placeholder="Enter address line 2" disabled={disabled} />
        </div>

        <div className="ms-intake-card__field">
          <label>County</label>
          <input type="text" value={form.county} onChange={(e) => onChange("county", e.target.value)} placeholder="Enter county" disabled={disabled} />
        </div>

        <div className="ms-intake-card__field">
          <label>Postcode</label>
          <input type="text" value={form.postcode} onChange={(e) => onChange("postcode", e.target.value)} placeholder="Enter postcode" disabled={disabled} />
        </div>
      </div>
    </article>
  );
}
