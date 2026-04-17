import "./InfoCards.css";
import type { DeviceInfo } from "../../pages/appointments/appointmentTypes";

type Props = {
  value: DeviceInfo;
  editable?: boolean;
  onChange?: <K extends keyof DeviceInfo>(key: K, nextValue: DeviceInfo[K]) => void;
};

export default function DeviceInfoCard({ value, editable = false, onChange }: Props) {
  function setValue<K extends keyof DeviceInfo>(key: K, nextValue: DeviceInfo[K]) {
    if (!onChange) return;
    onChange(key, nextValue);
  }

  return (
    <section className="ms-info-card">
      <div className="ms-info-card__header">
        <h3>Device Information</h3>
        <p>Device identity and condition.</p>
      </div>

      <div className="ms-info-card__grid">
        <div className="ms-info-card__field">
          <label>Brand</label>
          <input value={value.brand || ""} disabled={!editable} onChange={(e) => setValue("brand", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>Device Type</label>
          <input value={value.deviceType || ""} disabled={!editable} onChange={(e) => setValue("deviceType", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>Device Model</label>
          <input value={value.deviceModel || ""} disabled={!editable} onChange={(e) => setValue("deviceModel", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>Colour</label>
          <input value={value.colour || ""} disabled={!editable} onChange={(e) => setValue("colour", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>IMEI</label>
          <input value={value.imei || ""} disabled={!editable} onChange={(e) => setValue("imei", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>Serial Number</label>
          <input value={value.serialNumber || ""} disabled={!editable} onChange={(e) => setValue("serialNumber", e.target.value)} />
        </div>

        <div className="ms-info-card__field">
          <label>Water Damage</label>
          <select value={value.waterDamage || "No"} disabled={!editable} onChange={(e) => setValue("waterDamage", e.target.value as "Yes" | "No")}>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        <div className="ms-info-card__field">
          <label>Back Glass Cracked</label>
          <select value={value.backGlassCracked || "No"} disabled={!editable} onChange={(e) => setValue("backGlassCracked", e.target.value as "Yes" | "No")}>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        <div className="ms-info-card__field ms-info-card__field--full">
          <label>Check In Condition</label>
          <textarea value={value.checkInCondition || ""} disabled={!editable} onChange={(e) => setValue("checkInCondition", e.target.value)} />
        </div>
      </div>
    </section>
  );
}
