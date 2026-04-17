export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeTimeKey(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const match24 = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (match24) {
    const hours = String(Number(match24[1])).padStart(2, "0");
    return `${hours}:${match24[2]}`;
  }

  const match12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(raw);
  if (match12) {
    let hours = Number(match12[1]);
    const minutes = match12[2];
    const meridiem = match12[3].toUpperCase();

    if (meridiem === "AM" && hours === 12) hours = 0;
    if (meridiem === "PM" && hours !== 12) hours += 12;

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  return raw;
}

export function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function isSameMonth(a: Date, b: Date) {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}
