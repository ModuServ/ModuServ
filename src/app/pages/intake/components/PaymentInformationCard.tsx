import "./PaymentInformationCard.css";
import { CreditCard } from "lucide-react";
import type { IntakeFormData } from "../intakeTypes";
import { paymentStatusOptions as defaultStatuses, paymentTypeOptions as defaultTypes } from "../data/intakeData";

type Props = {
  form: IntakeFormData;
  disabled: boolean;
  onChange: <K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) => void;
  paymentTypeOptions?: string[];
  paymentStatusOptions?: string[];
};

export default function PaymentInformationCard({
  form,
  disabled,
  onChange,
  paymentTypeOptions = defaultTypes,
  paymentStatusOptions = defaultStatuses,
}: Props) {
  return (
    <article className="ms-intake-card">
      <div className="ms-intake-card__header">
        <div className="ms-intake-card__icon-wrap">
          <CreditCard size={18} />
        </div>
        <div>
          <h2>Payment Information</h2>
          <p>Capture the commercial details for the intake.</p>
        </div>
      </div>

      <div className="ms-intake-card__grid ms-intake-card__grid--triple">
        <div className="ms-intake-card__field">
          <label>Amount</label>
          <input type="number" value={form.amount} onChange={(e) => onChange("amount", e.target.value)} placeholder="Enter amount" disabled={disabled} />
        </div>

        <div className="ms-intake-card__field">
          <label>Payment Type</label>
          <select value={form.paymentType} onChange={(e) => onChange("paymentType", e.target.value)} disabled={disabled}>
            <option value="">Select payment type</option>
            {paymentTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <div className="ms-intake-card__field">
          <label>Payment Status</label>
          <select value={form.paymentStatus} onChange={(e) => onChange("paymentStatus", e.target.value)} disabled={disabled}>
            <option value="">Select payment status</option>
            {paymentStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </div>
    </article>
  );
}
