import { useEffect, useMemo, useState } from "react";
import type { Job } from "../../data/jobs";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { API_BASE, authFetch } from "../../lib/api";
import { runAIAssessment } from "../../lib/ai";

type DeviceOption = {
  id: string;
  category: "brand" | "deviceType" | "deviceModel" | "colour";
  label: string;
};

type JobFormValues = Omit<Job, "id">;

type JobFormProps = {
  initialValues?: JobFormValues;
  submitLabel?: string;
  onSubmit: (values: JobFormValues) => void;
};


const defaultValues: JobFormValues = {
  customerFirstName: "",
  customerLastName: "",
  customerEmail: "",
  customerPhone: "",
  addressLine1: "",
  addressLine2: "",
  county: "",
  postcode: "",

  brand: "",
  deviceType: "",
  deviceModel: "",
  colour: "",
  imei: "",
  serialNumber: "",
  checkInCondition: "",

  partRequired: "",
  partAllocated: "",
  partName: "",
  partType: "",
  partSupplier: "",
  partStatus: "",

  paymentAmount: "",
  paymentType: "",
  paymentStatus: "",

  qcStatus: "",
  backglass: "",
  status: "New",
  priority: "Medium",
  suggestedPriority: "Medium",
  category: "General",
  priorityWasOverridden: false,
  ber: false,

  repairStartTime: "",
  repairEndTime: "",
  repairDurationMinutes: "",

  isDeleted: false,
  deletedAt: "",
  deletedBy: "",
  restoredAt: "",
  restoredBy: "",
};

export function JobForm({
  initialValues = defaultValues,
  submitLabel = "Save Job",
  onSubmit,
}: JobFormProps) {
  const { user } = useAuth();
  const { aiSuggestions } = useSettings();
  const isAdmin = user?.role === "Admin";

  const [form, setForm] = useState<JobFormValues>({
    ...defaultValues,
    ...initialValues,
  });

  const [options, setOptions] = useState<DeviceOption[]>([]);
  const [newBrand, setNewBrand] = useState("");
  const [newDeviceType, setNewDeviceType] = useState("");
  const [newDeviceModel, setNewDeviceModel] = useState("");
  const [newColour, setNewColour] = useState("");
  const [optionMessage, setOptionMessage] = useState("");
  const [optionError, setOptionError] = useState("");

  // IMPORTANT: keep local form in sync with updated job values after save
  useEffect(() => {
    setForm({
      ...defaultValues,
      ...initialValues,
    });
  }, [initialValues]);

  const aiAssessment = useMemo(
    () =>
      runAIAssessment({
        checkInCondition: form.checkInCondition,
        ber: form.ber,
        status: form.status,
        partRequired: form.partRequired,
        partAllocated: form.partAllocated,
        partStatus: form.partStatus,
        repairStartTime: form.repairStartTime,
      }),
    [
      form.checkInCondition,
      form.ber,
      form.status,
      form.partRequired,
      form.partAllocated,
      form.partStatus,
      form.repairStartTime,
    ]
  );

  const brandOptions = options.filter((item) => item.category === "brand");
  const deviceTypeOptions = options.filter((item) => item.category === "deviceType");
  const deviceModelOptions = options.filter((item) => item.category === "deviceModel");
  const colourOptions = options.filter((item) => item.category === "colour");

  const loadOptions = async () => {
    try {
      const response = await fetch(`${API_BASE}/device-options`);
      const data = (await response.json()) as DeviceOption[];
      setOptions(Array.isArray(data) ? data : []);
    } catch {
      setOptions([]);
    }
  };

  useEffect(() => {
    void loadOptions();
  }, []);

  useEffect(() => {
    setForm((prev) => {
      const shouldAutoApply =
        prev.priority === prev.suggestedPriority || !prev.checkInCondition;

      return {
        ...prev,
        suggestedPriority: aiAssessment.suggestedPriority,
        category: aiAssessment.suggestedCategory,
        priority: shouldAutoApply ? aiAssessment.suggestedPriority : prev.priority,
        priorityWasOverridden: shouldAutoApply
          ? false
          : prev.priority !== aiAssessment.suggestedPriority,
      };
    });
  }, [aiAssessment]);

  const handleChange =
    (field: keyof JobFormValues) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      const value =
        event.target instanceof HTMLInputElement && event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;

      setForm((prev) => {
        const next = {
          ...prev,
          [field]: value,
        };

        if (field === "priority") {
          next.priorityWasOverridden = value !== prev.suggestedPriority;
        }

        return next;
      });
    };

  const addOption = async (
    category: "brand" | "deviceType" | "deviceModel" | "colour",
    label: string,
    clear: () => void
  ) => {
    setOptionMessage("");
    setOptionError("");

    if (!label.trim()) {
      setOptionError("Enter a value before adding an option.");
      return;
    }

    try {
      const response = await authFetch(`${API_BASE}/device-options`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          label: label.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOptionError(data.error ?? "Failed to add option.");
        return;
      }

      await loadOptions();
      clear();
      setOptionMessage("Option added successfully.");
    } catch {
      setOptionError("Unable to reach option service.");
    }
  };

  const handleUseSuggestion = () => {
    setForm((prev) => ({
      ...prev,
      priority: prev.suggestedPriority,
      priorityWasOverridden: false,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(form);
  };

  const renderAdminOptionTools = () => {
    if (!isAdmin) return null;

    return (
      <div className="device-options-admin">
        <h4>Add Dropdown Options</h4>

        <div className="device-options-admin__row">
          <input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="Add brand" />
          <button type="button" className="button-link button-link--button" onClick={() => void addOption("brand", newBrand, () => setNewBrand(""))}>
            Add Brand
          </button>
        </div>

        <div className="device-options-admin__row">
          <input value={newDeviceType} onChange={(e) => setNewDeviceType(e.target.value)} placeholder="Add device type" />
          <button type="button" className="button-link button-link--button" onClick={() => void addOption("deviceType", newDeviceType, () => setNewDeviceType(""))}>
            Add Device Type
          </button>
        </div>

        <div className="device-options-admin__row">
          <input value={newDeviceModel} onChange={(e) => setNewDeviceModel(e.target.value)} placeholder="Add device model" />
          <button type="button" className="button-link button-link--button" onClick={() => void addOption("deviceModel", newDeviceModel, () => setNewDeviceModel(""))}>
            Add Device Model
          </button>
        </div>

        <div className="device-options-admin__row">
          <input value={newColour} onChange={(e) => setNewColour(e.target.value)} placeholder="Add colour" />
          <button type="button" className="button-link button-link--button" onClick={() => void addOption("colour", newColour, () => setNewColour(""))}>
            Add Colour
          </button>
        </div>

        {optionMessage ? <div className="success-alert">{optionMessage}</div> : null}
        {optionError ? <div className="login-error">{optionError}</div> : null}
      </div>
    );
  };

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      <div className="job-detail-grid">
        <div className="job-detail-main">
          <section className="card">
            <h3 className="section-title">Customer Details</h3>
            <div className="form-grid">
              <div className="form-field">
                <label>First Name</label>
                <input value={form.customerFirstName} onChange={handleChange("customerFirstName")} />
              </div>
              <div className="form-field">
                <label>Last Name</label>
                <input value={form.customerLastName} onChange={handleChange("customerLastName")} />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input value={form.customerEmail} onChange={handleChange("customerEmail")} />
              </div>
              <div className="form-field">
                <label>Phone Number</label>
                <input value={form.customerPhone} onChange={handleChange("customerPhone")} />
              </div>
              <div className="form-field">
                <label>Address Line 1</label>
                <input value={form.addressLine1} onChange={handleChange("addressLine1")} />
              </div>
              <div className="form-field">
                <label>Address Line 2</label>
                <input value={form.addressLine2} onChange={handleChange("addressLine2")} />
              </div>
              <div className="form-field">
                <label>County</label>
                <input value={form.county} onChange={handleChange("county")} />
              </div>
              <div className="form-field">
                <label>Postcode</label>
                <input value={form.postcode} onChange={handleChange("postcode")} />
              </div>
            </div>
          </section>

          <section className="card">
            <h3 className="section-title">Device Information</h3>
            <div className="form-grid form-grid--three">
              <div className="form-field">
                <label>Brand</label>
                <select value={form.brand} onChange={handleChange("brand")}>
                  <option value="">Select brand</option>
                  {brandOptions.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Device Type</label>
                <select value={form.deviceType} onChange={handleChange("deviceType")}>
                  <option value="">Select device type</option>
                  {deviceTypeOptions.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Device Model</label>
                <select value={form.deviceModel} onChange={handleChange("deviceModel")}>
                  <option value="">Select device model</option>
                  {deviceModelOptions.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Colour</label>
                <select value={form.colour} onChange={handleChange("colour")}>
                  <option value="">Select colour</option>
                  {colourOptions.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>IMEI</label>
                <input value={form.imei} onChange={handleChange("imei")} />
              </div>
              <div className="form-field">
                <label>Serial Number</label>
                <input value={form.serialNumber} onChange={handleChange("serialNumber")} />
              </div>
              <div className="form-field form-field--full">
                <label>Check In Condition</label>
                <textarea rows={4} value={form.checkInCondition} onChange={handleChange("checkInCondition")} />
              </div>
            </div>
            {renderAdminOptionTools()}
          </section>

          <section className="card">
            <h3 className="section-title">Part Allocation</h3>
            <div className="form-grid">
              <div className="form-field">
                <label>Part Required</label>
                <select value={form.partRequired} onChange={handleChange("partRequired")}>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-field">
                <label>Part Allocated</label>
                <select value={form.partAllocated} onChange={handleChange("partAllocated")}>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-field">
                <label>Part Name</label>
                <input value={form.partName} onChange={handleChange("partName")} />
              </div>
              <div className="form-field">
                <label>Part Type</label>
                <input value={form.partType} onChange={handleChange("partType")} />
              </div>
              <div className="form-field">
                <label>Supplier</label>
                <input value={form.partSupplier} onChange={handleChange("partSupplier")} />
              </div>
              <div className="form-field">
                <label>Part Status</label>
                <input value={form.partStatus} onChange={handleChange("partStatus")} />
              </div>
            </div>
          </section>

          <section className="card">
            <h3 className="section-title">Payment Information</h3>
            <div className="form-grid form-grid--three">
              <div className="form-field">
                <label>Amount</label>
                <input value={form.paymentAmount} onChange={handleChange("paymentAmount")} />
              </div>
              <div className="form-field">
                <label>Payment Type</label>
                <select value={form.paymentType} onChange={handleChange("paymentType")}>
                  <option value="">Select payment type</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Payment Link">Payment Link</option>
                </select>
              </div>
              <div className="form-field">
                <label>Payment Status</label>
                <select value={form.paymentStatus} onChange={handleChange("paymentStatus")}>
                  <option value="">Select payment status</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="repair-workflow-header">
              <h3 className="section-title">Repair Workflow</h3>
              <button
                type="button"
                className={`ber-button ${form.ber ? "ber-button--active" : ""}`}
                onClick={() => setForm((prev) => ({ ...prev, ber: true }))}
              >
                BER
              </button>
            </div>

            {form.ber ? <div className="ber-banner">Beyond Economic Repair</div> : null}

            {aiSuggestions ? (
              <div className="ai-panel">
                <div className="ai-panel__header">
                  <h3>AI Insight</h3>
                  <span className="ai-badge">Rule-Based</span>
                </div>

                {/* Summary badges row */}
                <div className="ai-panel__badges">
                  <div className="ai-panel__badge-group">
                    <span className="ai-panel__label">Urgency</span>
                    <span className={`ai-urgency ai-urgency--${aiAssessment.suggestedUrgency.toLowerCase()}`}>
                      {aiAssessment.suggestedUrgency}
                    </span>
                  </div>
                  <div className="ai-panel__badge-group">
                    <span className="ai-panel__label">Risk</span>
                    <span className={`ai-risk ai-risk--${aiAssessment.suggestedRisk.toLowerCase()}`}>
                      {aiAssessment.suggestedRisk}
                    </span>
                  </div>
                  <div className="ai-panel__badge-group">
                    <span className="ai-panel__label">Complexity</span>
                    <span className={`ai-complexity ai-complexity--${aiAssessment.repairComplexity.toLowerCase()}`}>
                      {aiAssessment.repairComplexity}
                    </span>
                  </div>
                </div>

                {/* Detected issues — only shown when more than one exists */}
                {aiAssessment.detectedIssues.length > 0 ? (
                  <div className="ai-panel__issues">
                    <span className="ai-panel__label">
                      Detected Issues ({aiAssessment.detectedIssues.length})
                    </span>
                    <ul className="ai-issues-list">
                      {aiAssessment.detectedIssues.map((issue, i) => (
                        <li key={i} className="ai-issues-list__item">
                          <span className={`ai-urgency ai-urgency--${issue.urgencyContribution.toLowerCase()}`}>
                            {issue.urgencyContribution}
                          </span>
                          <span className="ai-category">{issue.category}</span>
                          <span>{issue.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* All repair categories when multiple */}
                {aiAssessment.suggestedCategories.length > 1 ? (
                  <div className="ai-panel__badge-group">
                    <span className="ai-panel__label">Repair Categories</span>
                    <div className="ai-category-list">
                      {aiAssessment.suggestedCategories.map((cat) => (
                        <span key={cat} className="ai-category">{cat}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="ai-panel__badge-group">
                    <span className="ai-panel__label">Category</span>
                    <span className="ai-category">{aiAssessment.suggestedCategory}</span>
                  </div>
                )}

                {aiAssessment.recommendedNextStatus ? (
                  <div className="ai-panel__next-status">
                    <span className="ai-panel__label">Recommended next:</span>
                    <span className="ai-next-status-value">{aiAssessment.recommendedNextStatus}</span>
                  </div>
                ) : null}

                <div className="ai-panel__confidence">
                  <span className="ai-panel__label">
                    Confidence: {Math.round(aiAssessment.confidenceScore * 100)}%
                  </span>
                  <div className="ai-confidence-bar">
                    <div
                      className="ai-confidence-bar__fill"
                      style={{ width: `${Math.round(aiAssessment.confidenceScore * 100)}%` }}
                    />
                  </div>
                </div>

                <p className="ai-panel__text">{aiAssessment.explanation}</p>

                {aiAssessment.flags.length > 0 ? (
                  <ul className="ai-flags-list">
                    {aiAssessment.flags.map((flag, i) => (
                      <li key={i} className="ai-flags-list__item">{flag}</li>
                    ))}
                  </ul>
                ) : null}

                {form.priorityWasOverridden ? (
                  <p className="ai-panel__override">Priority has been manually overridden.</p>
                ) : null}

                <button
                  type="button"
                  className="button-link button-link--button button-link--secondary"
                  onClick={handleUseSuggestion}
                >
                  Apply Suggested Priority
                </button>
              </div>
            ) : null}

            <div className="form-grid">
              <div className="form-field">
                <label>Status</label>
                <select value={form.status} onChange={handleChange("status")}>
                  <option value="New">New</option>
                  <option value="In Diagnosis">In Diagnosis</option>
                  <option value="Awaiting Repair">Awaiting Repair</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Post Repair Device Check">Post Repair Device Check</option>
                  <option value="Pending Postage">Pending Postage</option>
                  <option value="Ready For Collection">Ready For Collection</option>
                  <option value="Ready For Collection Unsuccessful">Ready For Collection Unsuccessful</option>
                  <option value="Awaiting Customer Reply">Awaiting Customer Reply</option>
                  <option value="Awaiting Parts">Awaiting Parts</option>
                </select>
              </div>
              <div className="form-field">
                <label>Priority</label>
                <select value={form.priority} onChange={handleChange("priority")}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="form-field">
                <label>QC Status</label>
                <select value={form.qcStatus} onChange={handleChange("qcStatus")}>
                  <option value="">Select QC status</option>
                  <option value="Tested">Tested</option>
                  <option value="Cannot be Tested">Cannot be Tested</option>
                </select>
              </div>
              <div className="form-field">
                <label>Backglass</label>
                <select value={form.backglass} onChange={handleChange("backglass")}>
                  <option value="">Select backglass</option>
                  <option value="Cracked">Cracked</option>
                  <option value="Not Cracked">Not Cracked</option>
                </select>
              </div>
            </div>

            <div className="repair-timer-box">
              <div><strong>Repair Start:</strong> {form.repairStartTime || "Not started"}</div>
              <div><strong>Repair End:</strong> {form.repairEndTime || "Not finished"}</div>
              <div><strong>Repair Duration:</strong> {form.repairDurationMinutes || "Not recorded"}</div>
            </div>
          </section>

          <div className="form-actions">
            <button type="submit" className="button-link button-link--button">
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

