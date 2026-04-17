import { useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { defaultPermissionTemplate, usePermissions } from "../../context/PermissionsContext";

export function useRolePermissions() {
  const { user } = useAuth();
  const { rolePermissions, ensureRolePermissions } = usePermissions();

  // Normalise legacy role names that pre-date the current role definitions
  const rawRole = user?.role || "Technician";
  const selectedRole = rawRole === "Admin" ? "Primary Admin" : rawRole;

  useEffect(() => {
    ensureRolePermissions(selectedRole);
  }, [ensureRolePermissions, selectedRole]);

  const permissions = useMemo(() => {
    return {
      ...defaultPermissionTemplate,
      ...(rolePermissions[selectedRole] || {}),
    };
  }, [rolePermissions, selectedRole]);

  return {
    selectedRole,

    canAccessDashboard: permissions.accessDashboard,
    canAccessCustomerSearch: permissions.accessCustomerSearch,
    canAccessCustomerIntake: permissions.accessCustomerIntake,
    canAccessCalendar: permissions.accessCalendar,
    canAccessAppointmentManagement: permissions.accessAppointmentManagement,
    canAccessRepairTracking: permissions.accessRepairTracking,
    canAccessUserManagement: permissions.accessUserManagement,
    canAccessSyncQueue: permissions.accessSyncQueue,
    canAccessSettings: permissions.accessSettings,

    canCreateUsers: permissions.createUsers,
    canEditUsers: permissions.editUsers,
    canDeleteUsers: permissions.deleteUsers,

    canCreateAppointments: permissions.createAppointments,
    canBlockCalendarSlots: permissions.canBlockCalendarSlots,
    canUnblockCalendarSlots: permissions.canUnblockCalendarSlots,

    canEditRepairStatus: permissions.editRepairStatus,
    canEditWorkflowStatus: permissions.editRepairStatus,
    canEditTechnicianNotes: permissions.editTechnicianNotes,
    canEditPostRepairChecks: permissions.editPostRepairChecks,
    canEditCheckInCondition: permissions.canEditCheckInCondition,

    canAccessSiteSwitcher: permissions.canAccessSiteSwitcher,

    // Audit
    canExportAuditLog: permissions.canExportAuditLog,
    canClearAuditLog: permissions.canClearAuditLog,
    canDeleteRecords: permissions.canDeleteRecords,

    // Job management
    canArchiveJobs: permissions.canArchiveJobs,
    canRestoreJobs: permissions.canRestoreJobs,
    canAddNotes: permissions.canAddNotes,

    // Escalation & workflow
    canEscalateAppointment: permissions.canEscalateAppointment,
    canResetRecords: permissions.canResetRecords,
    canLockRecords: permissions.canLockRecords,
    canUnlockRecords: permissions.canUnlockRecords,

    // Communication
    canSendEmails: permissions.canSendEmails,
    canSendSms: permissions.canSendSms,

    // Role & settings admin
    canDeleteRoles: permissions.canDeleteRoles,
    canResetSettings: permissions.canResetSettings,
    // Intake management
    canManageIntakeOptions: permissions.canManageIntakeOptions,
    // Forms
    canManageForms: permissions.canManageForms,
    canSubmitForms: permissions.canSubmitForms,
    // Location management
    canAccessLocationManagement: permissions.canAccessLocationManagement,
  };
}


