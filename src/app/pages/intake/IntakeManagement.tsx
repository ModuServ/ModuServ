import "./IntakeManagement.css";
import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, RotateCcw, Settings2 } from "lucide-react";
import { useIntakeOptions } from "../../context/IntakeOptionsContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";

export default function IntakeManagement() {
  const { canManageIntakeOptions } = useRolePermissions();
  const {
    options,
    addBrand, removeBrand,
    addDeviceType, removeDeviceType,
    addModel, removeModel,
    addColour, removeColour,
    addPaymentType, removePaymentType,
    addPaymentStatus, removePaymentStatus,
    resetToDefaults,
  } = useIntakeOptions();

  // Model matrix state
  const [selectedBrand, setSelectedBrand] = useState<string>(options.brands[0] ?? "");
  const [selectedType, setSelectedType] = useState<string>("");
  const [newModelInput, setNewModelInput] = useState("");

  // Inline add inputs
  const [newBrand, setNewBrand] = useState("");
  const [newDeviceType, setNewDeviceType] = useState("");
  const [newColour, setNewColour] = useState("");
  const [newPaymentType, setNewPaymentType] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");

  // Collapsed sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    brands: true,
    deviceTypes: true,
    models: true,
    colours: false,
    paymentTypes: false,
    paymentStatuses: false,
  });

  const [confirmReset, setConfirmReset] = useState(false);

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const currentModels =
    selectedBrand && selectedType
      ? (options.modelMap[selectedBrand]?.[selectedType] ?? [])
      : [];

  function handleAddModel() {
    if (!selectedBrand || !selectedType || !newModelInput.trim()) return;
    addModel(selectedBrand, selectedType, newModelInput.trim());
    setNewModelInput("");
  }

  if (!canManageIntakeOptions) {
    return (
      <section className="ms-intake-mgmt">
        <div className="ms-intake-mgmt__denied">
          <Settings2 size={32} />
          <p>You do not have permission to manage intake options.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ms-intake-mgmt">
      <div className="ms-intake-mgmt__header">
        <div>
          <h1>Intake Form Management</h1>
          <p>Manage brands, device types, models, colours, and payment options available on the customer intake form.</p>
        </div>
        <button
          className="ms-intake-mgmt__reset-btn"
          onClick={() => setConfirmReset(true)}
        >
          <RotateCcw size={14} />
          Reset to defaults
        </button>
      </div>

      {/* ── BRANDS ──────────────────────────────────────────────────────── */}
      <div className="ms-intake-mgmt__card">
        <button className="ms-intake-mgmt__section-toggle" onClick={() => toggleSection("brands")}>
          <span>Brands <span className="ms-intake-mgmt__count">({options.brands.length})</span></span>
          {expandedSections.brands ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {expandedSections.brands && (
          <div className="ms-intake-mgmt__section-body">
            <div className="ms-intake-mgmt__tag-list">
              {options.brands.map((brand) => (
                <span key={brand} className="ms-intake-mgmt__tag">
                  {brand}
                  <button
                    className="ms-intake-mgmt__tag-remove"
                    onClick={() => removeBrand(brand)}
                    aria-label={`Remove ${brand}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="ms-intake-mgmt__add-row">
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="New brand name"
                onKeyDown={(e) => { if (e.key === "Enter") { addBrand(newBrand); setNewBrand(""); } }}
              />
              <button onClick={() => { addBrand(newBrand); setNewBrand(""); }}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DEVICE TYPES ────────────────────────────────────────────────── */}
      <div className="ms-intake-mgmt__card">
        <button className="ms-intake-mgmt__section-toggle" onClick={() => toggleSection("deviceTypes")}>
          <span>Device Types <span className="ms-intake-mgmt__count">({options.deviceTypes.length})</span></span>
          {expandedSections.deviceTypes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {expandedSections.deviceTypes && (
          <div className="ms-intake-mgmt__section-body">
            <div className="ms-intake-mgmt__tag-list">
              {options.deviceTypes.map((dt) => (
                <span key={dt} className="ms-intake-mgmt__tag">
                  {dt}
                  <button
                    className="ms-intake-mgmt__tag-remove"
                    onClick={() => removeDeviceType(dt)}
                    aria-label={`Remove ${dt}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="ms-intake-mgmt__add-row">
              <input
                type="text"
                value={newDeviceType}
                onChange={(e) => setNewDeviceType(e.target.value)}
                placeholder="New device type"
                onKeyDown={(e) => { if (e.key === "Enter") { addDeviceType(newDeviceType); setNewDeviceType(""); } }}
              />
              <button onClick={() => { addDeviceType(newDeviceType); setNewDeviceType(""); }}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODEL MATRIX ────────────────────────────────────────────────── */}
      <div className="ms-intake-mgmt__card">
        <button className="ms-intake-mgmt__section-toggle" onClick={() => toggleSection("models")}>
          <span>Device Models</span>
          {expandedSections.models ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {expandedSections.models && (
          <div className="ms-intake-mgmt__section-body">
            <p className="ms-intake-mgmt__hint">
              Select a brand and device type to view and edit the models for that combination.
            </p>

            <div className="ms-intake-mgmt__matrix-selectors">
              <div className="ms-intake-mgmt__field">
                <label>Brand</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => { setSelectedBrand(e.target.value); setSelectedType(""); }}
                >
                  <option value="">Select brand</option>
                  {options.brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="ms-intake-mgmt__field">
                <label>Device Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  disabled={!selectedBrand}
                >
                  <option value="">Select device type</option>
                  {options.deviceTypes.map((dt) => <option key={dt} value={dt}>{dt}</option>)}
                </select>
              </div>
            </div>

            {selectedBrand && selectedType && (
              <>
                <div className="ms-intake-mgmt__model-header">
                  <span className="ms-intake-mgmt__model-label">
                    {selectedBrand} → {selectedType}
                    <span className="ms-intake-mgmt__count"> ({currentModels.length} models)</span>
                  </span>
                </div>

                {currentModels.length === 0 ? (
                  <p className="ms-intake-mgmt__empty">No models configured for this combination yet.</p>
                ) : (
                  <ul className="ms-intake-mgmt__model-list">
                    {currentModels.map((model) => (
                      <li key={model} className="ms-intake-mgmt__model-item">
                        <span>{model}</span>
                        <button
                          className="ms-intake-mgmt__model-remove"
                          onClick={() => removeModel(selectedBrand, selectedType, model)}
                          aria-label={`Remove ${model}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="ms-intake-mgmt__add-row">
                  <input
                    type="text"
                    value={newModelInput}
                    onChange={(e) => setNewModelInput(e.target.value)}
                    placeholder={`Add model for ${selectedBrand} ${selectedType}`}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddModel(); }}
                  />
                  <button onClick={handleAddModel}>
                    <Plus size={14} /> Add
                  </button>
                </div>
              </>
            )}

            {!selectedBrand && (
              <p className="ms-intake-mgmt__empty">Select a brand to get started.</p>
            )}
            {selectedBrand && !selectedType && (
              <p className="ms-intake-mgmt__empty">Select a device type to view its models.</p>
            )}
          </div>
        )}
      </div>

      {/* ── COLOURS ─────────────────────────────────────────────────────── */}
      <div className="ms-intake-mgmt__card">
        <button className="ms-intake-mgmt__section-toggle" onClick={() => toggleSection("colours")}>
          <span>Colours <span className="ms-intake-mgmt__count">({options.colours.length})</span></span>
          {expandedSections.colours ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {expandedSections.colours && (
          <div className="ms-intake-mgmt__section-body">
            <div className="ms-intake-mgmt__tag-list">
              {options.colours.map((c) => (
                <span key={c} className="ms-intake-mgmt__tag">
                  {c}
                  <button className="ms-intake-mgmt__tag-remove" onClick={() => removeColour(c)}>×</button>
                </span>
              ))}
            </div>
            <div className="ms-intake-mgmt__add-row">
              <input type="text" value={newColour} onChange={(e) => setNewColour(e.target.value)} placeholder="New colour"
                onKeyDown={(e) => { if (e.key === "Enter") { addColour(newColour); setNewColour(""); } }} />
              <button onClick={() => { addColour(newColour); setNewColour(""); }}><Plus size={14} /> Add</button>
            </div>
          </div>
        )}
      </div>

      {/* ── PAYMENT TYPES ───────────────────────────────────────────────── */}
      <div className="ms-intake-mgmt__card">
        <button className="ms-intake-mgmt__section-toggle" onClick={() => toggleSection("paymentTypes")}>
          <span>Payment Types <span className="ms-intake-mgmt__count">({options.paymentTypes.length})</span></span>
          {expandedSections.paymentTypes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {expandedSections.paymentTypes && (
          <div className="ms-intake-mgmt__section-body">
            <div className="ms-intake-mgmt__tag-list">
              {options.paymentTypes.map((pt) => (
                <span key={pt} className="ms-intake-mgmt__tag">
                  {pt}
                  <button className="ms-intake-mgmt__tag-remove" onClick={() => removePaymentType(pt)}>×</button>
                </span>
              ))}
            </div>
            <div className="ms-intake-mgmt__add-row">
              <input type="text" value={newPaymentType} onChange={(e) => setNewPaymentType(e.target.value)} placeholder="New payment type"
                onKeyDown={(e) => { if (e.key === "Enter") { addPaymentType(newPaymentType); setNewPaymentType(""); } }} />
              <button onClick={() => { addPaymentType(newPaymentType); setNewPaymentType(""); }}><Plus size={14} /> Add</button>
            </div>
          </div>
        )}
      </div>

      {/* ── PAYMENT STATUSES ────────────────────────────────────────────── */}
      <div className="ms-intake-mgmt__card">
        <button className="ms-intake-mgmt__section-toggle" onClick={() => toggleSection("paymentStatuses")}>
          <span>Payment Statuses <span className="ms-intake-mgmt__count">({options.paymentStatuses.length})</span></span>
          {expandedSections.paymentStatuses ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {expandedSections.paymentStatuses && (
          <div className="ms-intake-mgmt__section-body">
            <div className="ms-intake-mgmt__tag-list">
              {options.paymentStatuses.map((ps) => (
                <span key={ps} className="ms-intake-mgmt__tag">
                  {ps}
                  <button className="ms-intake-mgmt__tag-remove" onClick={() => removePaymentStatus(ps)}>×</button>
                </span>
              ))}
            </div>
            <div className="ms-intake-mgmt__add-row">
              <input type="text" value={newPaymentStatus} onChange={(e) => setNewPaymentStatus(e.target.value)} placeholder="New payment status"
                onKeyDown={(e) => { if (e.key === "Enter") { addPaymentStatus(newPaymentStatus); setNewPaymentStatus(""); } }} />
              <button onClick={() => { addPaymentStatus(newPaymentStatus); setNewPaymentStatus(""); }}><Plus size={14} /> Add</button>
            </div>
          </div>
        )}
      </div>

      {/* ── RESET CONFIRM MODAL ─────────────────────────────────────────── */}
      {confirmReset && (
        <div className="ms-intake-mgmt__modal-backdrop" onClick={() => setConfirmReset(false)}>
          <div className="ms-intake-mgmt__modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reset to defaults?</h3>
            <p>
              This will restore all brands, device types, models, colours, and payment options
              to their original values. Any custom entries you added will be lost.
            </p>
            <div className="ms-intake-mgmt__modal-actions">
              <button className="ms-intake-mgmt__modal-confirm" onClick={() => { resetToDefaults(); setConfirmReset(false); }}>
                Yes, reset
              </button>
              <button className="ms-intake-mgmt__modal-cancel" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
