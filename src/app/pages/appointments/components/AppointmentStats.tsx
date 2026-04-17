import "./AppointmentStats.css";
import { CalendarDays, Clock3 } from "lucide-react";

type Props = {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
};

export default function AppointmentStats({
  total,
  scheduled,
  inProgress,
  completed,
}: Props) {
  return (
    <div className="ms-appointments-stats">
      <article className="ms-appointments-stats__card">
        <div className="ms-appointments-stats__icon">
          <CalendarDays size={18} />
        </div>
        <div>
          <span>Total</span>
          <strong>{total}</strong>
        </div>
      </article>

      <article className="ms-appointments-stats__card">
        <div className="ms-appointments-stats__icon">
          <Clock3 size={18} />
        </div>
        <div>
          <span>Scheduled</span>
          <strong>{scheduled}</strong>
        </div>
      </article>

      <article className="ms-appointments-stats__card">
        <div className="ms-appointments-stats__icon">
          <Clock3 size={18} />
        </div>
        <div>
          <span>In Progress</span>
          <strong>{inProgress}</strong>
        </div>
      </article>

      <article className="ms-appointments-stats__card">
        <div className="ms-appointments-stats__icon">
          <CalendarDays size={18} />
        </div>
        <div>
          <span>Completed</span>
          <strong>{completed}</strong>
        </div>
      </article>
    </div>
  );
}
