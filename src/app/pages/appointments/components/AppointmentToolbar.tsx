import "./AppointmentToolbar.css";
import { Filter, Search } from "lucide-react";
import type { AppointmentStatus } from "../appointmentTypes";

type Props = {
  search: string;
  statusFilter: AppointmentStatus | "All";
  dateFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: AppointmentStatus | "All") => void;
  onDateChange: (value: string) => void;
};

export default function AppointmentToolbar({
  search,
  statusFilter,
  dateFilter,
  onSearchChange,
  onStatusChange,
  onDateChange,
}: Props) {
  return (
    <div className="ms-appointments-toolbar">
      <div className="ms-appointments-toolbar__search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search by appointment ID, customer, or device..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="ms-appointments-toolbar__filters">
        <div className="ms-appointments-toolbar__filter">
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as AppointmentStatus | "All")}
          >
            <option value="All">All Statuses</option>
            <option value="Awaiting Diagnosis">Awaiting Diagnosis</option>
            <option value="Awaiting Repair">Awaiting Repair</option>
            <option value="In Progress">In Progress</option>
            <option value="Post Repair Check">Post Repair Check</option>
            <option value="Ready For Collection">Ready For Collection</option>
            <option value="Awaiting Parts">Awaiting Parts</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="ms-appointments-toolbar__date-row">
          <div className="ms-appointments-toolbar__date">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </div>
          <button
            type="button"
            className={`ms-appointments-toolbar__clear-btn${dateFilter ? " is-active" : ""}`}
            onClick={() => onDateChange("")}
            aria-label="Clear date filter"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
