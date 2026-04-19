import { useEffect, useRef } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./app/routes";
import { AppShell } from "./app/layout/AppShell";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RoleProvider } from "./context/RoleContext";
import { SiteProvider } from "./context/SiteContext";
import { PermissionsProvider } from "./context/PermissionsContext";
import { RoleRegistryProvider } from "./context/RoleRegistryContext";
import { SyncProvider } from "./context/SyncContext";
import { AuditProvider } from "./context/AuditContext";
import { JobsProvider, useJobs } from "./context/JobsContext";
import { SettingsProvider } from "./context/SettingsContext";
import { IntakeOptionsProvider } from "./app/context/IntakeOptionsContext";
import { FormsProvider } from "./app/context/FormsContext";
import { AppointmentProvider, useAppointments } from "./app/context/AppointmentContext";
import { CustomerProvider } from "./app/context/CustomerContext";
import "./styles/global.css";

function AppReadyReporter() {
  const { user } = useAuth();
  const { appointments } = useAppointments();
  const { jobs } = useJobs();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    // Not logged in — show login page immediately
    if (user === null) {
      fired.current = true;
      window.dispatchEvent(new CustomEvent("moduserv:ready"));
      return;
    }
    // Logged in — wait until at least one data set has arrived from backend
    if (appointments.length > 0 || jobs.length > 0) {
      fired.current = true;
      window.dispatchEvent(new CustomEvent("moduserv:ready"));
    }
  }, [user, appointments.length, jobs.length]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <RoleRegistryProvider>
          <RoleProvider>
            <SiteProvider>
              <SyncProvider>
                <SettingsProvider>
                <AuditProvider>
                  <JobsProvider>
                    <IntakeOptionsProvider>
                      <AppointmentProvider>
                        <CustomerProvider>
                          <FormsProvider>
                            <AppReadyReporter />
                            <BrowserRouter>
                              <AppShell>
                                <AppRoutes />
                              </AppShell>
                            </BrowserRouter>
                          </FormsProvider>
                        </CustomerProvider>
                      </AppointmentProvider>
                    </IntakeOptionsProvider>
                  </JobsProvider>
                </AuditProvider>
                </SettingsProvider>
              </SyncProvider>
            </SiteProvider>
          </RoleProvider>
        </RoleRegistryProvider>
      </PermissionsProvider>
    </AuthProvider>
  );
}
