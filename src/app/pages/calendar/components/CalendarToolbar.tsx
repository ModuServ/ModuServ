import "./CalendarToolbar.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarView } from "../calendarTypes";
import { formatDayLabel, formatMonthTitle } from "../utils/calendarUtils";

type Props = {
  view: CalendarView;
  setView: (view: CalendarView) => void;
  anchorDate: Date;
  weekDays: Date[];
  goPrevious: () => void;
  goNext: () => void;
};

export default function CalendarToolbar({
  view,
  setView,
  anchorDate,
  weekDays,
  goPrevious,
  goNext,
}: Props) {
  return (
    <div className="ms-calendar-toolbar">
      <div className="ms-calendar-toolbar__view-switch">
        <button type="button" className={view === "daily" ? "is-active" : ""} onClick={() => setView("daily")}>
          Daily
        </button>
        <button type="button" className={view === "weekly" ? "is-active" : ""} onClick={() => setView("weekly")}>
          Weekly
        </button>
        <button type="button" className={view === "monthly" ? "is-active" : ""} onClick={() => setView("monthly")}>
          Monthly
        </button>
      </div>

      <div className="ms-calendar-toolbar__week-nav">
        <button type="button" onClick={goPrevious}>
          <ChevronLeft size={16} />
        </button>

        <div className="ms-calendar-toolbar__week-label">
          {view === "daily" && formatDayLabel(anchorDate)}
          {view === "weekly" && `${formatDayLabel(weekDays[0])} - ${formatDayLabel(weekDays[6])}`}
          {view === "monthly" && formatMonthTitle(anchorDate)}
        </div>

        <button type="button" onClick={goNext}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
