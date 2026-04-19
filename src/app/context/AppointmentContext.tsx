import { createContext, useContext, useEffect, useState } from "react";
import { loadAppointments, saveAppointments } from "../services/appointmentStorage";
import type { AppointmentRecord } from "../pages/appointments/appointmentTypes";
import { API_BASE, authFetch } from "../../lib/api";
import { useSite } from "../../context/SiteContext";
import { useAuth } from "../../context/AuthContext";
import { useSync } from "../../context/SyncContext";

interface AppointmentContextType {
  appointments: AppointmentRecord[];
  addAppointment: (appt: AppointmentRecord) => Promise<void>;
  updateAppointments: (appts: AppointmentRecord[]) => void;
  updateAppointment: (id: string, updates: Partial<AppointmentRecord>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  clearAppointments: () => void;
}

const AppointmentContext = createContext<AppointmentContextType | null>(null);

export function AppointmentProvider({ children }: { children: React.ReactNode }) {
  const { selectedSiteId } = useSite();
  const { user } = useAuth();
  const { addToQueue } = useSync();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>(() =>
    loadAppointments([])
  );

  // Persist to localStorage whenever state changes
  useEffect(() => {
    saveAppointments(appointments);
  }, [appointments]);

  // Fetch from backend when logged in; poll every 30s to stay in sync across devices
  useEffect(() => {
    if (!user) return;
    async function fetchFromAPI() {
      try {
        const res = await authFetch(`${API_BASE}/appointments?site_id=${selectedSiteId}`);
        if (!res.ok) return;
        const data = await res.json() as AppointmentRecord[];
        if (Array.isArray(data)) {
          setAppointments(data);
          saveAppointments(data);
        }
      } catch { /* backend offline — keep localStorage data */ }
    }
    fetchFromAPI();
    const poll = setInterval(fetchFromAPI, 2_000);
    return () => clearInterval(poll);
  }, [user, selectedSiteId]);

  async function addAppointment(appt: AppointmentRecord) {
    const withSite = { ...appt, siteId: appt.siteId ?? selectedSiteId };
    setAppointments((prev) => [withSite, ...prev]);

    try {
      const res = await authFetch(`${API_BASE}/appointments`, {
        method: "POST",
        body: JSON.stringify(withSite),
      });
      if (res.ok) {
        const data = await res.json() as { appointment: AppointmentRecord };
        setAppointments((prev) =>
          prev.map((a) => (a.id === withSite.id ? data.appointment : a))
        );
      } else {
        addToQueue("appointment", withSite.id, "create", withSite);
      }
    } catch {
      addToQueue("appointment", withSite.id, "create", withSite);
    }
  }

  function updateAppointments(appts: AppointmentRecord[]) {
    setAppointments(appts);
  }

  async function updateAppointment(id: string, updates: Partial<AppointmentRecord>) {
    // Optimistic update
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );

    try {
      const existing = appointments.find((a) => a.id === id);
      const payload = { ...(existing ?? {}), ...updates };
      const res = await authFetch(`${API_BASE}/appointments/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        addToQueue("appointment", id, "update", payload);
      }
    } catch {
      const existing = appointments.find((a) => a.id === id);
      addToQueue("appointment", id, "update", { ...(existing ?? {}), ...updates });
    }
  }

  async function deleteAppointment(id: string) {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    try {
      await authFetch(`${API_BASE}/appointments/${id}`, { method: "DELETE" });
    } catch { /* offline — local removal is sufficient */ }
  }

  function clearAppointments() {
    setAppointments([]);
  }

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        addAppointment,
        updateAppointments,
        updateAppointment,
        deleteAppointment,
        clearAppointments,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const ctx = useContext(AppointmentContext);
  if (!ctx) throw new Error("useAppointments must be used within AppointmentProvider");
  return ctx;
}
