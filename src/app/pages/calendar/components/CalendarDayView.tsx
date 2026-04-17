import "./CalendarDayView.css";
import { Lock, Unlock } from "lucide-react";
import type { BlockedSlot, CalendarAppointment } from "../calendarTypes";
import { formatDateKey, formatDayLabel, normalizeTimeKey } from "../utils/calendarUtils";

type Props = {
  anchorDate: Date;
  appointments: CalendarAppointment[];
  blockedSlots: BlockedSlot[];
  timeSlots: string[];
  onBlock: (date: string, start: string) => void;
  onUnblock: (date: string, start: string) => void;
};

export default function CalendarDayView({
  anchorDate,
  appointments,
  blockedSlots,
  timeSlots,
  onBlock,
  onUnblock,
}: Props) {
  const currentDateKey = formatDateKey(anchorDate);

  return (
    <div className="ms-calendar-view-wrap">
      <div className="ms-calendar-grid ms-calendar-grid--daily">
        <div className="ms-calendar-grid__corner" />
        <div className="ms-calendar-grid__day-header">{formatDayLabel(anchorDate)}</div>

        {timeSlots.map((slot) => {
          const normalizedSlot = normalizeTimeKey(slot);
          const appointment = appointments.find((item) => normalizeTimeKey(item.start) === normalizedSlot);
          const blocked = blockedSlots.find((item) => normalizeTimeKey(item.start) === normalizedSlot);

          return (
            <>
              <div key={`daily-label-${slot}`} className="ms-calendar-grid__time-label">
                {slot}
              </div>

              <div key={`daily-cell-${slot}`} className="ms-calendar-grid__cell">
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
                    <button type="button" onClick={!appointment?.isLocked ? () => onBlock(currentDateKey, slot) : undefined}>
                      <Lock size={14} />
                      <span>Block</span>
                    </button>
                  </div>
                )}

                {blocked ? (
                  <div className="ms-calendar-grid__inline-actions">
                    <button type="button" onClick={!appointment?.isLocked ? () => onUnblock(currentDateKey, slot) : undefined}>
                      <Unlock size={14} />
                      <span>Unblock</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          );
        })}
      </div>
    </div>
  );
}




