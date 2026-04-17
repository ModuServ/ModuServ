import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./app/routes";
import { AppShell } from "./app/layout/AppShell";
import { AuthProvider } from "./context/AuthContext";
import { RoleProvider } from "./context/RoleContext";
import { SiteProvider } from "./context/SiteContext";
import { PermissionsProvider } from "./context/PermissionsContext";
import { RoleRegistryProvider } from "./context/RoleRegistryContext";
import { SyncProvider } from "./context/SyncContext";
import { AuditProvider } from "./context/AuditContext";
import { JobsProvider } from "./context/JobsContext";
import { SettingsProvider } from "./context/SettingsContext";
import { IntakeOptionsProvider } from "./app/context/IntakeOptionsContext";
import { FormsProvider } from "./app/context/FormsContext";
import { AppointmentProvider } from "./app/context/AppointmentContext";
import { CustomerProvider } from "./app/context/CustomerContext";
import "./styles/global.css";

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
