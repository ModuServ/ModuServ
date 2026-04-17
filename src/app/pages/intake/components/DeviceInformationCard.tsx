import "./DeviceInformationCard.css";
import { useState } from "react";
import { Smartphone, X, AlertTriangle } from "lucide-react";
import type { AIAssessment, AIUrgency } from "../../../../lib/ai";
import type { IntakeFormData } from "../intakeTypes";
import { brandOptions as staticBrandOptions, colourOptions as staticColourOptions, deviceTypeOptions as staticDeviceTypeOptions } from "../data/intakeData";

const RISK_IF_UNTREATED: Record<string, string> = {
  power_failure: "Device becomes completely unusable — data may be unrecoverable if not addressed promptly.",
  heat_event: "Risk of fire or battery explosion if thermal runaway is not diagnosed and contained.",
  battery_swollen: "Battery may rupture or ignite — poses an active fire and chemical hazard if left in use.",
  battery_drain: "Device will become unreliable and eventually non-functional as capacity continues to degrade.",
  charging_fault: "Device will lose charge and become unusable once the battery fully depletes.",
  display_damage: "Cracks can spread into the digitizer, causing full touchscreen failure and glass injury risk.",
  cosmetic_damage: "No functional risk — affects resale value and device aesthetics only.",
  water_damage: "Corrosion spreads over time, causing secondary failures across the motherboard and internal components.",
  ber: "Repair cost likely exceeds device value — replacement should be discussed with the customer.",
};

const URGENCY_COLOURS: Record<AIUrgency, string> = {
  Critical: "#991b1b",
  High: "#b45309",
  Medium: "#1d4ed8",
  Low: "#374151",
};

const URGENCY_BG: Record<AIUrgency, string> = {
  Critical: "#fee2e2",
  High: "#fef3c7",
  Medium: "#eff6ff",
  Low: "#f3f4f6",
};

type Props = {
  form: IntakeFormData;
  disabled: boolean;
  onChange: <K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) => void;
  brandOptions?: string[];
  deviceTypeOptions?: string[];
  modelOptions?: string[];
  colourOptions?: string[];
  aiAssessment?: AIAssessment;
};

export default function DeviceInformationCard({
  form,
  disabled,
  onChange,
  brandOptions = staticBrandOptions,
  deviceTypeOptions = staticDeviceTypeOptions,
  modelOptions = [],
  colourOptions = staticColourOptions,
  aiAssessment,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
    <article className="ms-intake-card">
      <div className="ms-intake-card__header">
        <div className="ms-intake-card__icon-wrap">
          <Smartphone size={18} />
        </div>
        <div>
          <h2>Device Information</h2>
          <p>Capture the incoming device information and condition.</p>
        </div>
      </div>

      <div className="ms-intake-card__grid ms-intake-card__grid--triple">
        <div className="ms-intake-card__field">
          <label>Brand</label>
          <select value={form.brand} onChange={(e) => onChange("brand", e.target.value)} disabled={disabled}>
            <option value="">Select brand</option>
            {brandOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <div className="ms-intake-card__field">
          <label>Device Type</label>
          <select value={form.deviceType} onChange={(e) => onChange("deviceType", e.target.value)} disabled={disabled}>
            <option value="">Select device type</option>
            {deviceTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </div>

      <div className="ms-intake-card__grid">
        <div className="ms-intake-card__field">
          <label>Device Model</label>
          <select value={form.deviceModel} onChange={(e) => onChange("deviceModel", e.target.value)} disabled={disabled}>
            <option value="">Select device model</option>
            {modelOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <div className="ms-intake-card__field">
          <label>Colour</label>
          <select value={form.colour} onChange={(e) => onChange("colour", e.target.value)} disabled={disabled}>
            <option value="">Select colour</option>
            {colourOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <div className="ms-intake-card__field">
          <label>IMEI</label>
          <input type="text" value={form.imei} onChange={(e) => onChange("imei", e.target.value)} placeholder="Enter IMEI" disabled={disabled} />
        </div>

        <div className="ms-intake-card__field">
          <label>Serial Number</label>
          <input type="text" value={form.serialNumber} onChange={(e) => onChange("serialNumber", e.target.value)} placeholder="Enter serial number" disabled={disabled} />
        </div>
      </div>

      <div className="ms-intake-card__field">
        <label>Check In Condition</label>
        <textarea value={form.checkInCondition} onChange={(e) => onChange("checkInCondition", e.target.value)} placeholder="Describe the condition on arrival" disabled={disabled} />
        {aiAssessment && form.checkInCondition.trim() ? (
          <div className="ms-intake-ai-hint">
            <span
              className="ms-intake-ai-hint__pill"
              title="Double-click to view full AI assessment"
              onDoubleClick={() => setModalOpen(true)}
            >AI</span>
            <span>
              Urgency:{" "}
              <strong>{aiAssessment.suggestedUrgency}</strong>
            </span>
            {aiAssessment.detectedIssues.length > 1 ? (
              <span>
                <strong>{aiAssessment.detectedIssues.length} issues</strong> detected
              </span>
            ) : (
              <span>
                Category:{" "}
                <strong>{aiAssessment.suggestedCategory}</strong>
              </span>
            )}
            {aiAssessment.repairComplexity !== "Single" ? (
              <span className="ms-intake-ai-hint__complexity">
                {aiAssessment.repairComplexity}
              </span>
            ) : null}
            {aiAssessment.flags.length > 0 ? (
              <span className="ms-intake-ai-hint__flags">
                {aiAssessment.flags.length} flag{aiAssessment.flags.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>

    {modalOpen && aiAssessment ? (
      <div
        className="ms-intake-ai-modal-overlay"
        onClick={() => setModalOpen(false)}
      >
        <div
          className="ms-intake-ai-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="ms-intake-ai-modal__header">
            <div className="ms-intake-ai-modal__title">
              <span className="ms-intake-ai-hint__pill" style={{ fontSize: "12px" }}>AI</span>
              AI Repair Assessment
            </div>
            <button
              className="ms-intake-ai-modal__close"
              onClick={() => setModalOpen(false)}
              aria-label="Close assessment"
            >
              <X size={18} />
            </button>
          </div>

          {/* Summary badges */}
          <div className="ms-intake-ai-modal__badges">
            <span
              className="ms-intake-ai-modal__badge"
              style={{ background: URGENCY_BG[aiAssessment.suggestedUrgency], color: URGENCY_COLOURS[aiAssessment.suggestedUrgency] }}
            >
              Urgency: {aiAssessment.suggestedUrgency}
            </span>
            <span
              className="ms-intake-ai-modal__badge"
              style={{
                background: aiAssessment.suggestedRisk === "High" ? "#fee2e2" : aiAssessment.suggestedRisk === "Medium" ? "#fef3c7" : "#f0fdf4",
                color: aiAssessment.suggestedRisk === "High" ? "#991b1b" : aiAssessment.suggestedRisk === "Medium" ? "#92400e" : "#166534",
              }}
            >
              Risk: {aiAssessment.suggestedRisk}
            </span>
            <span
              className="ms-intake-ai-modal__badge"
              style={{
                background: aiAssessment.repairComplexity === "Complex" ? "#fee2e2" : aiAssessment.repairComplexity === "Multiple" ? "#fef3c7" : "#f3f4f6",
                color: aiAssessment.repairComplexity === "Complex" ? "#991b1b" : aiAssessment.repairComplexity === "Multiple" ? "#92400e" : "#374151",
              }}
            >
              {aiAssessment.repairComplexity} repair
            </span>
          </div>

          {/* Detected Issues */}
          {aiAssessment.detectedIssues.length > 0 && (
            <section>
              <p className="ms-intake-ai-modal__section-title">
                Detected Issues ({aiAssessment.detectedIssues.length})
              </p>
              <div className="ms-intake-ai-modal__issues">
                {aiAssessment.detectedIssues.map((issue) => (
                  <div key={issue.issueId} className="ms-intake-ai-modal__issue">
                    <div className="ms-intake-ai-modal__issue-header">
                      <span
                        className="ms-intake-ai-modal__urgency-chip"
                        style={{
                          background: URGENCY_BG[issue.urgencyContribution],
                          color: URGENCY_COLOURS[issue.urgencyContribution],
                        }}
                      >
                        {issue.urgencyContribution}
                      </span>
                      <span className="ms-intake-ai-modal__category-chip">{issue.category}</span>
                    </div>
                    <p className="ms-intake-ai-modal__issue-label">{issue.label}</p>
                    <p className="ms-intake-ai-modal__issue-risk">
                      <strong>Risk if untreated:</strong>{" "}
                      {RISK_IF_UNTREATED[issue.issueId] ?? "Further diagnosis required to determine risk."}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Flags */}
          {aiAssessment.flags.length > 0 && (
            <section>
              <p className="ms-intake-ai-modal__section-title">
                Flags ({aiAssessment.flags.length})
              </p>
              <div className="ms-intake-ai-modal__flags">
                {aiAssessment.flags.map((flag, i) => (
                  <div key={i} className="ms-intake-ai-modal__flag">
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                    {flag}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Explanation */}
          <p className="ms-intake-ai-modal__explanation">{aiAssessment.explanation}</p>
        </div>
      </div>
    ) : null}
    </>
  );
}
