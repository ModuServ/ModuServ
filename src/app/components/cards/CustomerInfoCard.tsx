import "./InfoCards.css";
import type { CustomerInfo } from "../../pages/appointments/appointmentTypes";

type Props = {
  value: CustomerInfo;
  editable?: boolean;
  onChange?: <K extends keyof CustomerInfo>(key: K, nextValue: CustomerInfo[K]) => void;
};

export default function CustomerInfoCard({ value, editable = false, onChange }: Props) {
  function setValue<K extends keyof CustomerInfo>(key: K, nextValue: CustomerInfo[K]) {
    if (!onChange) return;
    onChange(key, nextValue);
  }

  return (
    <section className="ms-info-card">
      <div className="ms-info-card__header">
        <h3>Customer Details</h3>
        <p>Identity and contact information.</p>
      </div>

      <div className="ms-info-card__grid">
        <div className="ms-info-card__field">
          <label>First Name</label>
          <input value={value.firstName || ""} disabled={!editable} onChange={(e) => setValue("firstName", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>Last Name</label>
          <input value={value.lastName || ""} disabled={!editable} onChange={(e) => setValue("lastName", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>Email</label>
          <input value={value.email || ""} disabled={!editable} onChange={(e) => setValue("email", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>Phone Number</label>
          <input value={value.phoneNumber || ""} disabled={!editable} onChange={(e) => setValue("phoneNumber", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>Address Line 1</label>
          <input value={value.addressLine1 || ""} disabled={!editable} onChange={(e) => setValue("addressLine1", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>Address Line 2</label>
          <input value={value.addressLine2 || ""} disabled={!editable} onChange={(e) => setValue("addressLine2", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>County</label>
          <input value={value.county || ""} disabled={!editable} onChange={(e) => setValue("county", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>Postcode</label>
          <input value={value.postcode || ""} disabled={!editable} onChange={(e) => setValue("postcode", e.target.value)} />
        </div>
      </div>
    </section>
  );
}
