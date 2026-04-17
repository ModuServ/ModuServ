import "./CalendarWeekView.css";
import { Lock, Unlock } from "lucide-react";
import type { BlockedSlot, CalendarAppointment } from "../calendarTypes";
import { formatDateKey, formatDayLabel, normalizeTimeKey } from "../utils/calendarUtils";

type Props = {
  weekDays: Date[];
  appointments: CalendarAppointment[];
  blockedSlots: BlockedSlot[];
  timeSlots: string[];
  onBlock: (date: string, start: string) => void;
  onUnblock: (date: string, start: string) => void;
};

export default function CalendarWeekView({
  weekDays,
  appointments,
  blockedSlots,
  timeSlots,
  onBlock,
  onUnblock,
}: Props) {
  return (
    <div className="ms-calendar-view-wrap">
      <div className="ms-calendar-grid">
        <div className="ms-calendar-grid__corner" />

        {weekDays.map((day) => (
          <div key={formatDateKey(day)} className="ms-calendar-grid__day-header">
            {formatDayLabel(day)}
          </div>
        ))}

        {timeSlots.map((slot) => (
          <>
            <div key={`week-label-${slot}`} className="ms-calendar-grid__time-label">
              {slot}
            </div>

            {weekDays.map((day) => {
              const dateKey = formatDateKey(day);
              const normalizedSlot = normalizeTimeKey(slot);
              const appointment = appointments.find(
                (item) => item.date === dateKey && normalizeTimeKey(item.start) === normalizedSlot
              );
              const blocked = blockedSlots.find(
                (item) => item.date === dateKey && normalizeTimeKey(item.start) === normalizedSlot
              );

              return (
                <div key={`${dateKey}-${slot}`} className="ms-calendar-grid__cell">
                  {appointment ? (
                    <div className="ms-calendar-grid__appointment">
                      <strong>{appointment?.isLocked ? '?? ' + appointment?.customer : appointment?.customer}</strong>
                      <span>{appointment.device}</span>
                      <span>{appointment.repairType}</span>
                      <small>{appointment.start} - {appointment.end}</small>
                    </div>
                  ) : blocked ? (
                    <div className="ms-calendar-grid__blocked">
                      <strong>{blocked.label}</strong>
                      <small>{blocked.start}</small>
                    </div>
                  ) : (
                    <div className="ms-calendar-grid__slot-actions">
                      <button type="button" onClick={!appointment?.isLocked ? () => onBlock(dateKey, slot) : undefined}>
                        <Lock size={14} />
                        <span>Block</span>
                      </button>
                    </div>
                  )}

                  {blocked ? (
                    <div className="ms-calendar-grid__inline-actions">
                      <button type="button" onClick={!appointment?.isLocked ? () => onUnblock(dateKey, slot) : undefined}>
                        <Unlock size={14} />
                        <span>Unblock</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}




