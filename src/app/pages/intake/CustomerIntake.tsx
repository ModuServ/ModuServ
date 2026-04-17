import "./CustomerIntake.css";
import { useMemo, useState } from "react";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { useAppointments } from "../../context/AppointmentContext";
import { useCustomers } from "../../context/CustomerContext";
import { useSite } from "../../../context/SiteContext";
import { useIntakeOptions } from "../../context/IntakeOptionsContext";
import { createAppointmentPipeline } from "../../services/appointmentPipeline";
import { runAIAssessment } from "../../../lib/ai";
import { useSettings } from "../../../context/SettingsContext";
import IntakeHeader from "./components/IntakeHeader";
import CustomerDetailsCard from "./components/CustomerDetailsCard";
import DeviceInformationCard from "./components/DeviceInformationCard";
import PaymentInformationCard from "./components/PaymentInformationCard";
import { initialIntakeForm } from "./data/intakeData";
import type { IntakeFormData } from "./intakeTypes";

export default function CustomerIntake() {
  const { canAccessCustomerIntake, selectedRole } = useRolePermissions();
  const { appointments, addAppointment } = useAppointments();
  const { upsertCustomer } = useCustomers();
  const { selectedSiteId } = useSite();
  const { options, getModelsFor } = useIntakeOptions();

  const { aiSuggestions } = useSettings();
  const canCreateCustomerIntake = canAccessCustomerIntake ?? true;
  const [form, setForm] = useState<IntakeFormData>(initialIntakeForm);
  const [message, setMessage] = useState("");

  const aiAssessment = useMemo(
    () => runAIAssessment({ checkInCondition: form.checkInCondition }),
    [form.checkInCondition]
  );

  // Derive available models from the brand + device type selection
  const availableModels = useMemo(
    () => getModelsFor(form.brand, form.deviceType),
    [form.brand, form.deviceType, getModelsFor]
  );

  function updateField<K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Reset model whenever brand or device type changes
      if (key === "brand" || key === "deviceType") {
        next.deviceModel = "";
      }
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!canCreateCustomerIntake) {
      setMessage("You do not have permission to create customer intake records.");
      return;
    }

    const requiredFields = [
      form.firstName,
      form.lastName,
      form.email,
      form.phoneNumber,
      form.addressLine1,
      form.county,
      form.postcode,
      form.brand,
      form.deviceType,
      form.deviceModel,
      form.colour,
      form.checkInCondition,
      form.amount,
      form.paymentType,
      form.paymentStatus,
      form.appointmentDate,
      form.appointmentTime,
    ];

    if (requiredFields.some((value) => !String(value).trim())) {
      setMessage("Please complete all required fields before submitting.");
      return;
    }

    const customerRecord = upsertCustomer({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      county: form.county.trim(),
      postcode: form.postcode.trim(),
    });

    const createdAppointment = {
      ...createAppointmentPipeline({
        input: {
          customer: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          brand: form.brand.trim(),
          deviceType: form.deviceType.trim(),
          deviceModel: form.deviceModel.trim(),
          date: form.appointmentDate.trim(),
          time: form.appointmentTime.trim(),
          checkInCondition: form.checkInCondition.trim(),
          additionalInformation: [
            `Email: ${form.email}`,
            `Phone: ${form.phoneNumber}`,
            `Address 1: ${form.addressLine1}`,
            form.addressLine2 ? `Address 2: ${form.addressLine2}` : "",
            `County: ${form.county}`,
            `Postcode: ${form.postcode}`,
            `Colour: ${form.colour}`,
            form.imei ? `IMEI: ${form.imei}` : "",
            form.serialNumber ? `Serial Number: ${form.serialNumber}` : "",
            `Payment Amount: ${form.amount}`,
            `Payment Type: ${form.paymentType}`,
            `Payment Status: ${form.paymentStatus}`,
          ]
            .filter(Boolean)
            .join(" | "),
          waterDamage: "No",
          backGlassCracked: "No",
          status: "Awaiting Diagnosis",
          repairType: "General Repair",
          siteId: selectedSiteId,
        },
        existingAppointments: appointments,
        selectedRole,
      }),
      customerId: customerRecord.id,
      customerInfo: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim(),
        county: form.county.trim(),
        postcode: form.postcode.trim(),
      },
      deviceInfo: {
        brand: form.brand.trim(),
        deviceType: form.deviceType.trim(),
        deviceModel: form.deviceModel.trim(),
        colour: form.colour.trim(),
        imei: form.imei.trim(),
        serialNumber: form.serialNumber.trim(),
        checkInCondition: form.checkInCondition.trim(),
        waterDamage: "No",
        backGlassCracked: "No",
      },
      paymentInfo: {
        amount: form.amount.trim(),
        paymentType: form.paymentType.trim(),
        paymentStatus: form.paymentStatus.trim(),
      },
    };

    addAppointment(createdAppointment);
    setMessage(
      `Customer intake submitted successfully. Linked customer ${customerRecord.id} and appointment ${createdAppointment.id} created.`
    );
    setForm({ ...initialIntakeForm });
  }

  return (
    <section className="ms-intake-page">
      <IntakeHeader selectedRole={selectedRole} />

      <form className="ms-intake-page__form-shell" onSubmit={handleSubmit}>
        <div className="ms-intake-page__schedule-card">
          <div className="ms-intake-page__schedule-header">
            <h3>Appointment Schedule</h3>
            <p>Select the intended appointment date and time for the intake.</p>
          </div>

          <div className="ms-intake-page__schedule-grid">
            <div className="ms-intake-page__schedule-field">
              <label>Appointment Date</label>
              <input
                type="date"
                value={form.appointmentDate}
                onChange={(e) => updateField("appointmentDate", e.target.value)}
                disabled={!canCreateCustomerIntake}
              />
            </div>

            <div className="ms-intake-page__schedule-field">
              <label>Appointment Time</label>
              <input
                type="time"
                value={form.appointmentTime}
                onChange={(e) => updateField("appointmentTime", e.target.value)}
                disabled={!canCreateCustomerIntake}
              />
            </div>
          </div>
        </div>

        <div className="ms-intake-page__cards">
          <CustomerDetailsCard
            form={form}
            disabled={!canCreateCustomerIntake}
            onChange={updateField}
          />
          <DeviceInformationCard
            form={form}
            disabled={!canCreateCustomerIntake}
            onChange={updateField}
            brandOptions={options.brands}
            deviceTypeOptions={options.deviceTypes}
            modelOptions={availableModels}
            colourOptions={options.colours}
            aiAssessment={aiSuggestions ? aiAssessment : undefined}
          />
          <PaymentInformationCard
            form={form}
            disabled={!canCreateCustomerIntake}
            onChange={updateField}
            paymentTypeOptions={options.paymentTypes}
            paymentStatusOptions={options.paymentStatuses}
          />
        </div>

        {message ? (
          <div className={`ms-intake-page__message ${canCreateCustomerIntake ? "is-success" : "is-error"}`}>
            {message}
          </div>
        ) : null}

        <div className="ms-intake-page__footer">
          <button type="submit" className="ms-intake-page__submit" disabled={!canCreateCustomerIntake}>
            {canCreateCustomerIntake ? "Submit Intake" : "Access Restricted"}
          </button>
        </div>
      </form>
    </section>
  );
}
