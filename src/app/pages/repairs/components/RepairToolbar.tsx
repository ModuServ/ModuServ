import "./RepairToolbar.css";
import { CalendarRange, Filter, Search } from "lucide-react";
import type { WorkflowStatus } from "../workflowTypes";

type Props = {
  search: string;
  statusFilter: WorkflowStatus | "All";
  dateFrom: string;
  dateTo: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: WorkflowStatus | "All") => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
};

export default function RepairToolbar({
  search,
  statusFilter,
  dateFrom,
  dateTo,
  onSearchChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
}: Props) {
  return (
    <div className="ms-repair-toolbar">
      <div className="ms-repair-toolbar__search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search by appointment ID, customer, device, or repair type..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="ms-repair-toolbar__controls">
        <div className="ms-repair-toolbar__filter">
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as WorkflowStatus | "All")}
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

        <div className="ms-repair-toolbar__date-group">
          <div className="ms-repair-toolbar__date">
            <CalendarRange size={16} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
          </div>

          <div className="ms-repair-toolbar__date">
            <CalendarRange size={16} />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

