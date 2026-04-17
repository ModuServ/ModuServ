import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";

type CalendarView = "daily" | "weekly" | "monthly";

function formatHeader(date: Date, view: CalendarView) {
  if (view === "daily") {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (view === "weekly") {
    return `Week of ${date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }

  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function CalendarDashboard() {
  const [view, setView] = useState<CalendarView>("daily");
  const [currentDate, setCurrentDate] = useState(new Date());

  const headerLabel = useMemo(
    () => formatHeader(currentDate, view),
    [currentDate, view]
  );

  const moveDate = (direction: "prev" | "next") => {
    const next = new Date(currentDate);

    if (view === "daily") {
      next.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (view === "weekly") {
      next.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      next.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    }

    setCurrentDate(next);
  };

  const timeSlots = Array.from({ length: 48 }, (_, index) => {
    const totalMinutes = index * 30;
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const minutes = String(totalMinutes % 60).padStart(2, "0");
    return `${hours}:${minutes}`;
  });

  return (
    <section className="calendar-page">
      <div className="calendar-shell">
        <div className="calendar-toolbar">
          <div className="calendar-toolbar__left">
            <button
              type="button"
              className="calendar-icon-button"
              onClick={() => moveDate("prev")}
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              className="calendar-icon-button"
              onClick={() => moveDate("next")}
            >
              <ChevronRight size={18} />
            </button>

            <button
              type="button"
              className="calendar-outline-button"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </button>

            <div className="calendar-toolbar__title">{headerLabel}</div>
          </div>

          <div className="calendar-toolbar__center">
            <div className="calendar-view-switcher">
              <button
                type="button"
                className={`calendar-view-switcher__button ${view === "daily" ? "calendar-view-switcher__button--active" : ""}`}
                onClick={() => setView("daily")}
              >
                Daily
              </button>
              <button
                type="button"
                className={`calendar-view-switcher__button ${view === "weekly" ? "calendar-view-switcher__button--active" : ""}`}
                onClick={() => setView("weekly")}
              >
                Weekly
              </button>
              <button
                type="button"
                className={`calendar-view-switcher__button ${view === "monthly" ? "calendar-view-switcher__button--active" : ""}`}
                onClick={() => setView("monthly")}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="calendar-toolbar__right">
            <button type="button" className="calendar-primary-button">
              <Plus size={16} />
              <span>New Appointment</span>
            </button>
          </div>
        </div>

        {view === "daily" ? (
          <div className="calendar-body">
            <div className="calendar-day-header">
              <div className="calendar-day-header__title">Daily Schedule</div>
              <div className="calendar-day-header__actions">
                <button type="button" className="calendar-outline-button">
                  Block Selected Time
                </button>
                <button type="button" className="calendar-outline-button">
                  Unblock Selected Time
                </button>
              </div>
            </div>

            <div className="calendar-daily-grid">
              <div className="calendar-daily-grid__times">
                {timeSlots.map((slot, index) => (
                  <div key={slot} className="calendar-time-row">
                    {index % 2 === 0 ? slot : ""}
                  </div>
                ))}
              </div>

              <div className="calendar-daily-grid__slots">
                {timeSlots.map((slot, index) => (
                  <button
                    key={slot}
                    type="button"
                    className={`calendar-slot ${index % 2 === 0 ? "calendar-slot--hour" : ""}`}
                    title={slot}
                  />
                ))}

                <div
                  className="calendar-appointment-card"
                  style={{ top: "864px", height: "144px" }}
                >
                  <div className="calendar-appointment-card__time">09:00 - 10:30</div>
                  <div className="calendar-appointment-card__title">John Smith</div>
                  <div className="calendar-appointment-card__meta">iPhone 13 Pro</div>
                  <div className="calendar-appointment-card__meta">Screen Replacement</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {view === "weekly" ? (
          <div className="calendar-placeholder-card">
            <h3>Weekly View</h3>
            <p>Weekly scheduling grid will be built after the daily view is locked down.</p>
          </div>
        ) : null}

        {view === "monthly" ? (
          <div className="calendar-placeholder-card">
            <h3>Monthly View</h3>
            <p>Monthly appointment overview will be added after daily and weekly views are stable.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
