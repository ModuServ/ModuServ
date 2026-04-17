import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import RoleGuard from "./auth/RoleGuard";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useRolePermissions } from "./hooks/useRolePermissions";

const Login                = lazy(() => import("./pages/auth/Login"));
const AdminHome            = lazy(() => import("./pages/dashboard/AdminHome"));
const CustomerSearch       = lazy(() => import("./pages/customers/CustomerSearch"));
const CustomerIntake       = lazy(() => import("./pages/intake/CustomerIntake"));
const IntakeManagement     = lazy(() => import("./pages/intake/IntakeManagement"));
const FormsPage            = lazy(() => import("./pages/forms/FormsPage"));
const FormManagePage       = lazy(() => import("./pages/forms/FormManagePage"));
const FormDetailPage       = lazy(() => import("./pages/forms/FormDetailPage"));
const CalendarDashboard    = lazy(() => import("./pages/calendar/CalendarDashboard"));
const AppointmentManagement = lazy(() => import("./pages/appointments/AppointmentManagement"));
const RepairTracking       = lazy(() => import("./pages/repairs/RepairTracking"));
const UsersAdmin           = lazy(() => import("./pages/users/UsersAdmin"));
const SyncQueuePage        = lazy(() => import("./pages/sync/SyncQueuePage"));
const SettingsPage         = lazy(() => import("./pages/settings/SettingsPage"));
const AuditLogPage         = lazy(() => import("./pages/audit/AuditLogPage"));
const LocationManagement   = lazy(() => import("./pages/locations/LocationManagement"));

function PageLoader() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      minHeight: 200,
      color: "#9ca3af",
      fontSize: 14,
    }}>
      Loading…
    </div>
  );
}

export function AppRoutes() {
  const permissions = useRolePermissions();

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <RoleGuard allow={permissions.canAccessDashboard}>
                <ErrorBoundary>
                  <AdminHome />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route
            path="/jobs"
            element={
              <RoleGuard allow={permissions.canAccessCustomerSearch}>
                <ErrorBoundary>
                  <CustomerSearch />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route
            path="/customer-intake"
            element={
              <RoleGuard allow={permissions.canAccessCustomerIntake}>
                <ErrorBoundary>
                  <CustomerIntake />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route
            path="/customer-intake/manage"
            element={
              <RoleGuard allow={permissions.canManageIntakeOptions}>
                <ErrorBoundary>
                  <IntakeManagement />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route
            path="/calendar"
            element={
              <RoleGuard allow={permissions.canAccessCalendar}>
                <ErrorBoundary>
                  <CalendarDashboard />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route
            path="/appointment-management"
            element={
              <RoleGuard allow={permissions.canAccessAppointmentManagement}>
                <ErrorBoundary>
                  <AppointmentManagement />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route
            path="/repair-tracking"
            element={
              <RoleGuard allow={permissions.canAccessRepairTracking}>
                <ErrorBoundary>
                  <RepairTracking />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route
            path="/users"
            element={
              <RoleGuard allow={permissions.canAccessUserManagement}>
                <ErrorBoundary>
                  <UsersAdmin />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route
            path="/sync"
            element={
              <RoleGuard allow={permissions.canAccessSyncQueue}>
                <ErrorBoundary>
                  <SyncQueuePage />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route
            path="/settings"
            element={
              <RoleGuard allow={permissions.canAccessSettings}>
                <ErrorBoundary>
                  <SettingsPage />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route
            path="/audit"
            element={
              <RoleGuard allow={permissions.canAccessUserManagement}>
                <ErrorBoundary>
                  <AuditLogPage />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route
            path="/forms"
            element={
              <RoleGuard allow={permissions.canSubmitForms || permissions.canManageForms}>
                <ErrorBoundary>
                  <FormsPage />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route
            path="/forms/:formId/manage"
            element={
              <RoleGuard allow={permissions.canManageForms}>
                <ErrorBoundary>
                  <FormManagePage />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route
            path="/forms/:formId"
            element={
              <RoleGuard allow={permissions.canSubmitForms || permissions.canManageForms}>
                <ErrorBoundary>
                  <FormDetailPage />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route
            path="/location-management"
            element={
              <RoleGuard allow={permissions.canAccessLocationManagement}>
                <ErrorBoundary>
                  <LocationManagement />
                </ErrorBoundary>
              </RoleGuard>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
