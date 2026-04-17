import "./CalendarMonthView.css";
import type { BlockedSlot, CalendarAppointment } from "../calendarTypes";
import { formatDateKey, isSameMonth } from "../utils/calendarUtils";

type Props = {
  monthDays: Date[];
  anchorDate: Date;
  appointments: CalendarAppointment[];
  blockedSlots: BlockedSlot[];
};

export default function CalendarMonthView({
  monthDays,
  anchorDate,
  appointments,
  blockedSlots,
}: Props) {
  return (
    <div className="ms-calendar-month">
      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((label) => (
        <div key={label} className="ms-calendar-month__header">
          {label}
        </div>
      ))}

      {monthDays.map((day) => {
        const dateKey = formatDateKey(day);
        const dayAppointments = appointments.filter((item) => item.date === dateKey);
        const dayBlocked = blockedSlots.filter((item) => item.date === dateKey);

        return (
          <div
            key={dateKey}
            className={`ms-calendar-month__cell ${!isSameMonth(day, anchorDate) ? "is-muted" : ""}`}
          >
            <div className="ms-calendar-month__date">{day.getDate()}</div>

            <div className="ms-calendar-month__items">
              {dayAppointments.slice(0, 2).map((item) => (
                <div key={item.id} className="ms-calendar-month__pill">
                  {item.customer}
                </div>
              ))}

              {dayBlocked.slice(0, 1).map((item) => (
                <div key={item.id} className="ms-calendar-month__pill ms-calendar-month__pill--blocked">
                  Blocked
                </div>
              ))}

              {dayAppointments.length + dayBlocked.length > 2 ? (
                <div className="ms-calendar-month__more">
                  +{dayAppointments.length + dayBlocked.length - 2} more
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}



