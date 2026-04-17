export type CalendarView = "daily" | "weekly" | "monthly";

export type CalendarAppointment = {
  id: string;
  customer: string;
  device: string;
  repairType: string;
  date: string;
  start: string;
  end: string;
  isLocked?: boolean;
  lockedAt?: string;
  lockedBy?: string;
  lockReason?: string;
};

export type BlockedSlot = {
  id: string;
  date: string;
  start: string;
  end: string;
  label: string;
  isLocked?: boolean;
  lockedAt?: string;
  lockedBy?: string;
  lockReason?: string;
};

