import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { API_BASE, authFetch } from "../lib/api";

export type PermissionSet = {
  accessDashboard: boolean;
  accessCustomerSearch: boolean;
  accessCustomerIntake: boolean;
  accessCalendar: boolean;
  accessAppointmentManagement: boolean;
  accessRepairTracking: boolean;
  accessUserManagement: boolean;
  accessSyncQueue: boolean;
  accessSettings: boolean;
  createUsers: boolean;
  editUsers: boolean;
  deleteUsers: boolean;
  editRepairStatus: boolean;
  editTechnicianNotes: boolean;
  editPostRepairChecks: boolean;
  createAppointments: boolean;
  canBlockCalendarSlots: boolean;
  canUnblockCalendarSlots: boolean;
  canEditCheckInCondition: boolean;
  canAccessSiteSwitcher: boolean;
  // Audit
  canExportAuditLog: boolean;
  canClearAuditLog: boolean;
  canDeleteRecords: boolean;
  // Job management
  canArchiveJobs: boolean;
  canRestoreJobs: boolean;
  canAddNotes: boolean;
  // Escalation & workflow
  canEscalateAppointment: boolean;
  canResetRecords: boolean;
  canLockRecords: boolean;
  canUnlockRecords: boolean;
  // Communication
  canSendEmails: boolean;
  canSendSms: boolean;
  // Role & settings admin
  canDeleteRoles: boolean;
  canResetSettings: boolean;
  // Intake management
  canManageIntakeOptions: boolean;
  // Forms
  canManageForms: boolean;
  canSubmitForms: boolean;
  // Location management
  canAccessLocationManagement: boolean;
};

export type RolePermissionsMap = Record<string, PermissionSet>;

export const defaultPermissionTemplate: PermissionSet = {
  accessDashboard: true,
  accessCustomerSearch: true,
  accessCustomerIntake: false,
  accessCalendar: false,
  accessAppointmentManagement: false,
  accessRepairTracking: false,
  accessUserManagement: false,
  accessSyncQueue: false,
  accessSettings: false,
  createUsers: false,
  editUsers: false,
  deleteUsers: false,
  editRepairStatus: false,
  editTechnicianNotes: false,
  editPostRepairChecks: false,
  createAppointments: false,
  canBlockCalendarSlots: false,
  canUnblockCalendarSlots: false,
  canEditCheckInCondition: false,
  canAccessSiteSwitcher: false,
  canExportAuditLog: false,
  canClearAuditLog: false,
  canDeleteRecords: false,
  canArchiveJobs: false,
  canRestoreJobs: false,
  canAddNotes: false,
  canEscalateAppointment: false,
  canResetRecords: false,
  canLockRecords: false,
  canUnlockRecords: false,
  canSendEmails: false,
  canSendSms: false,
  canDeleteRoles: false,
  canResetSettings: false,
  canManageIntakeOptions: false,
  canManageForms: false,
  canSubmitForms: false,
  canAccessLocationManagement: false,
};

export const systemRoleDefaults: RolePermissionsMap = {
  "Primary Admin": {
    accessDashboard: true,
    accessCustomerSearch: true,
    accessCustomerIntake: true,
    accessCalendar: true,
    accessAppointmentManagement: true,
    accessRepairTracking: true,
    accessUserManagement: true,
    accessSyncQueue: true,
    accessSettings: true,
    createUsers: true,
    editUsers: true,
    deleteUsers: true,
    editRepairStatus: true,
    editTechnicianNotes: true,
    editPostRepairChecks: true,
    createAppointments: true,
    canBlockCalendarSlots: true,
    canUnblockCalendarSlots: true,
    canEditCheckInCondition: true,
    canAccessSiteSwitcher: true,
    canExportAuditLog: true,
    canClearAuditLog: true,
    canDeleteRecords: true,
    canArchiveJobs: true,
    canRestoreJobs: true,
    canAddNotes: true,
    canEscalateAppointment: true,
    canResetRecords: true,
    canLockRecords: true,
    canUnlockRecords: true,
    canSendEmails: true,
    canSendSms: true,
    canDeleteRoles: true,
    canResetSettings: true,
    canManageIntakeOptions: true,
    canManageForms: true,
    canSubmitForms: true,
    canAccessLocationManagement: true,
  },
  Administrator: {
    accessDashboard: true,
    accessCustomerSearch: true,
    accessCustomerIntake: true,
    accessCalendar: true,
    accessAppointmentManagement: true,
    accessRepairTracking: true,
    accessUserManagement: true,
    accessSyncQueue: true,
    accessSettings: true,
    createUsers: true,
    editUsers: true,
    deleteUsers: false,
    editRepairStatus: true,
    editTechnicianNotes: true,
    editPostRepairChecks: true,
    createAppointments: true,
    canBlockCalendarSlots: true,
    canUnblockCalendarSlots: true,
    canEditCheckInCondition: true,
    canAccessSiteSwitcher: true,
    canExportAuditLog: true,
    canClearAuditLog: true,
    canDeleteRecords: true,
    canArchiveJobs: true,
    canRestoreJobs: true,
    canAddNotes: true,
    canEscalateAppointment: true,
    canResetRecords: true,
    canLockRecords: true,
    canUnlockRecords: true,
    canSendEmails: true,
    canSendSms: true,
    canDeleteRoles: false,
    canResetSettings: false,
    canManageIntakeOptions: true,
    canManageForms: true,
    canSubmitForms: true,
    canAccessLocationManagement: true,
  },
  Technician: {
    accessDashboard: true,
    accessCustomerSearch: true,
    accessCustomerIntake: false,
    accessCalendar: false,
    accessAppointmentManagement: false,
    accessRepairTracking: true,
    accessUserManagement: false,
    accessSyncQueue: false,
    accessSettings: false,
    createUsers: false,
    editUsers: false,
    deleteUsers: false,
    editRepairStatus: true,
    editTechnicianNotes: true,
    editPostRepairChecks: true,
    createAppointments: false,
    canBlockCalendarSlots: false,
    canUnblockCalendarSlots: false,
    canEditCheckInCondition: false,
    canAccessSiteSwitcher: false,
    canExportAuditLog: false,
    canClearAuditLog: false,
    canDeleteRecords: false,
    canArchiveJobs: false,
    canRestoreJobs: false,
    canAddNotes: true,
    canEscalateAppointment: true,
    canResetRecords: false,
    canLockRecords: true,
    canUnlockRecords: true,
    canSendEmails: false,
    canSendSms: false,
    canDeleteRoles: false,
    canResetSettings: false,
    canManageIntakeOptions: false,
    canManageForms: false,
    canSubmitForms: true,
    canAccessLocationManagement: false,
  },
  Receptionist: {
    accessDashboard: true,
    accessCustomerSearch: true,
    accessCustomerIntake: true,
    accessCalendar: true,
    accessAppointmentManagement: true,
    accessRepairTracking: false,
    accessUserManagement: false,
    accessSyncQueue: false,
    accessSettings: false,
    createUsers: false,
    editUsers: false,
    deleteUsers: false,
    editRepairStatus: false,
    editTechnicianNotes: false,
    editPostRepairChecks: false,
    createAppointments: true,
    canBlockCalendarSlots: true,
    canUnblockCalendarSlots: true,
    canEditCheckInCondition: true,
    canAccessSiteSwitcher: true,
    canExportAuditLog: false,
    canClearAuditLog: false,
    canDeleteRecords: false,
    canArchiveJobs: false,
    canRestoreJobs: false,
    canAddNotes: true,
    canEscalateAppointment: false,
    canResetRecords: false,
    canLockRecords: true,
    canUnlockRecords: true,
    canSendEmails: true,
    canSendSms: true,
    canDeleteRoles: false,
    canResetSettings: false,
    canManageIntakeOptions: false,
    canManageForms: false,
    canSubmitForms: true,
    canAccessLocationManagement: false,
  },
  "Sales Assistant": {
    accessDashboard: true,
    accessCustomerSearch: true,
    accessCustomerIntake: true,
    accessCalendar: true,
    accessAppointmentManagement: true,
    accessRepairTracking: false,
    accessUserManagement: false,
    accessSyncQueue: false,
    accessSettings: false,
    createUsers: false,
    editUsers: false,
    deleteUsers: false,
    editRepairStatus: false,
    editTechnicianNotes: false,
    editPostRepairChecks: false,
    createAppointments: true,
    canBlockCalendarSlots: false,
    canUnblockCalendarSlots: false,
    canEditCheckInCondition: true,
    canAccessSiteSwitcher: true,
    canExportAuditLog: false,
    canClearAuditLog: false,
    canDeleteRecords: false,
    canArchiveJobs: false,
    canRestoreJobs: false,
    canAddNotes: true,
    canEscalateAppointment: false,
    canResetRecords: false,
    canLockRecords: true,
    canUnlockRecords: true,
    canSendEmails: true,
    canSendSms: true,
    canDeleteRoles: false,
    canResetSettings: false,
    canManageIntakeOptions: false,
    canManageForms: false,
    canSubmitForms: true,
    canAccessLocationManagement: false,
  },
};

type PermissionsContextType = {
  rolePermissions: RolePermissionsMap;
  ensureRolePermissions: (role: string) => void;
  updateRolePermission: (role: string, key: keyof PermissionSet, value: boolean) => void;
  replaceRolePermissions: (role: string, permissions: PermissionSet) => void;
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// Roles whose permissions are enforced from code and cannot be changed via the UI
export const LOCKED_SYSTEM_ROLES: ReadonlySet<string> = new Set(["Primary Admin"]);

function applyLockedRoles(map: RolePermissionsMap): RolePermissionsMap {
  let result = map;
  LOCKED_SYSTEM_ROLES.forEach((role) => {
    if (systemRoleDefaults[role]) {
      result = { ...result, [role]: { ...systemRoleDefaults[role] } };
    }
  });
  return result;
}

const PERMISSIONS_CACHE_KEY = "moduserv:rolePermissions";

function cachePermissions(map: RolePermissionsMap) {
  localStorage.setItem(PERMISSIONS_CACHE_KEY, JSON.stringify(map));
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>(() => {
    const stored = localStorage.getItem(PERMISSIONS_CACHE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as RolePermissionsMap;
        return applyLockedRoles({ ...systemRoleDefaults, ...parsed });
      } catch {}
    }
    return { ...systemRoleDefaults };
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    cachePermissions(rolePermissions);
  }, [rolePermissions]);

  // Fetch from backend on mount (non-blocking — cached value used immediately)
  useEffect(() => {
    authFetch(`${API_BASE}/role-permissions`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Record<string, PermissionSet>) => {
        setRolePermissions((prev) => {
          const merged = applyLockedRoles({ ...systemRoleDefaults, ...prev, ...data });
          cachePermissions(merged);
          return merged;
        });
      })
      .catch(() => { /* backend unavailable — cached value stands */ });
  }, []);

  // Debounced sync: push a single role's permissions to backend 800ms after last change
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSync(roleName: string, permissions: PermissionSet) {
    if (LOCKED_SYSTEM_ROLES.has(roleName)) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      authFetch(`${API_BASE}/role-permissions/${encodeURIComponent(roleName)}`, {
        method: "PUT",
        body: JSON.stringify({ permissions }),
      }).catch(() => {});
    }, 800);
  }

  function ensureRolePermissions(role: string) {
    const cleanRole = role.trim();
    if (!cleanRole) return;
    setRolePermissions((prev) => {
      if (prev[cleanRole]) return prev;
      return { ...prev, [cleanRole]: { ...defaultPermissionTemplate } };
    });
  }

  function updateRolePermission(role: string, key: keyof PermissionSet, value: boolean) {
    const cleanRole = role.trim();
    if (!cleanRole || LOCKED_SYSTEM_ROLES.has(cleanRole)) return;
    setRolePermissions((prev) => {
      const updated: PermissionSet = {
        ...defaultPermissionTemplate,
        ...(prev[cleanRole] || {}),
        [key]: value,
      };
      scheduleSync(cleanRole, updated);
      return { ...prev, [cleanRole]: updated };
    });
  }

  function replaceRolePermissions(role: string, permissions: PermissionSet) {
    const cleanRole = role.trim();
    if (!cleanRole || LOCKED_SYSTEM_ROLES.has(cleanRole)) return;
    setRolePermissions((prev) => {
      const updated: PermissionSet = { ...defaultPermissionTemplate, ...permissions };
      scheduleSync(cleanRole, updated);
      return { ...prev, [cleanRole]: updated };
    });
  }

  const value = useMemo(
    () => ({
      rolePermissions,
      ensureRolePermissions,
      updateRolePermission,
      replaceRolePermissions,
    }),
    [rolePermissions]
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used inside PermissionsProvider");
  }
  return context;
}

