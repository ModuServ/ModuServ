import "./InfoCards.css";
import type { PaymentInfo } from "../../pages/appointments/appointmentTypes";

type Props = {
  value: PaymentInfo;
  editable?: boolean;
  onChange?: <K extends keyof PaymentInfo>(key: K, nextValue: PaymentInfo[K]) => void;
};

export default function PaymentInfoCard({ value, editable = false, onChange }: Props) {
  function setValue<K extends keyof PaymentInfo>(key: K, nextValue: PaymentInfo[K]) {
    if (!onChange) return;
    onChange(key, nextValue);
  }

  return (
    <section className="ms-info-card">
      <div className="ms-info-card__header">
        <h3>Payment Information</h3>
        <p>Commercial details for this job.</p>
      </div>

      <div className="ms-info-card__grid">
        <div className="ms-info-card__field">
          <label>Amount</label>
          <input value={value.amount || ""} disabled={!editable} onChange={(e) => setValue("amount", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>Payment Type</label>
          <input value={value.paymentType || ""} disabled={!editable} onChange={(e) => setValue("paymentType", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>Payment Status</label>
          <input value={value.paymentStatus || ""} disabled={!editable} onChange={(e) => setValue("paymentStatus", e.target.value)} />
        </div>
      </div>
    </section>
  );
}
