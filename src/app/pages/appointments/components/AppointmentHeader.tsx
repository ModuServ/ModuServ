import "./AppointmentHeader.css";
import { Plus } from "lucide-react";
import PermissionGate from "../../../components/auth/PermissionGate";

type Props = {
  selectedRole: string;
  canCreateAppointments: boolean;
  onNewAppointment: () => void;
};

export default function AppointmentHeader({
  selectedRole,
  canCreateAppointments,
  onNewAppointment,
}: Props) {
  return (
    <div className="ms-appointments-header">
      <div>
        <h1>Appointment Management</h1>
        <p>Track bookings, monitor daily flow, and manage appointment status updates.</p>
        <span className="ms-appointments-header__role">
          Current active role: <strong>{selectedRole}</strong>
        </span>
      </div>

      <PermissionGate
        allow={canCreateAppointments}
        fallback={
          <button type="button" className="ms-appointments-header__primary" disabled>
            <Plus size={16} />
            <span>New Appointment</span>
          </button>
        }
      >
        <button type="button" className="ms-appointments-header__primary" onClick={onNewAppointment}>
          <Plus size={16} />
          <span>New Appointment</span>
        </button>
      </PermissionGate>
    </div>
  );
}
