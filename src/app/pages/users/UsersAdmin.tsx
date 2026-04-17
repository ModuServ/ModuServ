import "./UsersAdmin.css";
import { Eye, EyeOff, Pencil, ShieldCheck, Trash2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { useAuth, PRIMARY_ADMIN_ID } from "../../../context/AuthContext";
import { usePermissions, defaultPermissionTemplate, systemRoleDefaults, LOCKED_SYSTEM_ROLES, type PermissionSet } from "../../../context/PermissionsContext";
import { useRoleRegistry } from "../../../context/RoleRegistryContext";
import PermissionGate from "../../components/auth/PermissionGate";

type UserRole = string;
type ModalType = "view" | "edit" | "auth" | "delete-role" | null;

type SafeUser = {
  id: string;
  username: string;
  password: string;
  role: string;
  createdAt: string;
  status: "Active" | "Disabled";
};

const permissionLabels: Record<keyof PermissionSet, string> = {
  accessDashboard: "Access Dashboard",
  accessCustomerSearch: "Access Customer Search",
  accessCustomerIntake: "Access Customer Intake",
  accessCalendar: "Access Calendar",
  accessAppointmentManagement: "Access Appointment Management",
  accessRepairTracking: "Access Repair Tracking",
  accessUserManagement: "Access User Management",
  accessSyncQueue: "Access Sync Queue",
  accessSettings: "Access Settings",
  createUsers: "Create Users",
  editUsers: "Edit Users",
  deleteUsers: "Delete Users",
  editRepairStatus: "Edit Repair Status",
  editTechnicianNotes: "Edit Technician Notes",
  editPostRepairChecks: "Edit Post-Repair Checks",
  createAppointments: "Create Appointments",
  canBlockCalendarSlots: "Block Calendar Slots",
  canUnblockCalendarSlots: "Unblock Calendar Slots",
  canEditCheckInCondition: "Edit Check In Condition",
  canAccessSiteSwitcher: "Access Site Switcher",
  canExportAuditLog: "Export Audit Log",
  canClearAuditLog: "Clear Audit Log",
  canDeleteRecords: "Delete Records",
  canArchiveJobs: "Archive Jobs",
  canRestoreJobs: "Restore Archived Jobs",
  canAddNotes: "Add Job Notes",
  canEscalateAppointment: "Escalate Appointment to Job",
  canResetRecords: "Reset Workflow Records",
  canLockRecords: "Lock Records",
  canUnlockRecords: "Unlock Records",
  canSendEmails: "Send Emails",
  canSendSms: "Send SMS",
  canDeleteRoles: "Delete Roles",
  canResetSettings: "Reset System Settings",
};

const permissionGroups: Array<{
  title: string;
  keys: Array<keyof PermissionSet>;
}> = [
  {
    title: "Module Access",
    keys: [
      "accessDashboard",
      "accessCustomerSearch",
      "accessCustomerIntake",
      "accessCalendar",
      "accessAppointmentManagement",
      "accessRepairTracking",
      "accessUserManagement",
      "accessSyncQueue",
      "accessSettings",
    ],
  },
  {
    title: "User Management",
    keys: ["createUsers", "editUsers", "deleteUsers"],
  },
  {
    title: "Repair & Workflow",
    keys: [
      "editRepairStatus",
      "editTechnicianNotes",
      "editPostRepairChecks",
      "createAppointments",
      "canEditCheckInCondition",
    ],
  },
  {
    title: "Calendar & Site Controls",
    keys: [
      "canBlockCalendarSlots",
      "canUnblockCalendarSlots",
      "canAccessSiteSwitcher",
    ],
  },
  {
    title: "Audit & Compliance",
    keys: [
      "canExportAuditLog",
      "canClearAuditLog",
      "canDeleteRecords",
    ],
  },
  {
    title: "Job Management",
    keys: [
      "canArchiveJobs",
      "canRestoreJobs",
      "canAddNotes",
    ],
  },
  {
    title: "Workflow Controls",
    keys: [
      "canEscalateAppointment",
      "canResetRecords",
      "canLockRecords",
      "canUnlockRecords",
    ],
  },
  {
    title: "Communication",
    keys: [
      "canSendEmails",
      "canSendSms",
    ],
  },
  {
    title: "System Administration",
    keys: [
      "canDeleteRoles",
      "canResetSettings",
    ],
  },
];

type RoleTier = { tier: string; label: string; className: string };

const roleTierMap: Record<string, RoleTier> = {
  "Primary Admin": { tier: "Tier 1", label: "Root platform owner", className: "ms-users-tier ms-users-tier--1" },
  Administrator:   { tier: "Tier 2", label: "Operational administrator", className: "ms-users-tier ms-users-tier--2" },
  Technician:      { tier: "Tier 3", label: "Technical operations", className: "ms-users-tier ms-users-tier--3" },
  "Sales Assistant": { tier: "Tier 3", label: "Customer-facing operations", className: "ms-users-tier ms-users-tier--3" },
  Receptionist:    { tier: "Tier 3", label: "Customer-facing operations", className: "ms-users-tier ms-users-tier--3" },
};

export default function UsersAdmin() {
  const { canCreateUsers, canEditUsers, canDeleteUsers, canDeleteRoles, selectedRole } = useRolePermissions();
  const auth = useAuth();
  const permissions = usePermissions();
  const roleRegistry = useRoleRegistry();

  const users = (auth.users || []) as SafeUser[];
  const addUser = auth.addUser;
  const updateUser = auth.updateUser;
  const deleteUser = auth.deleteUser;

  const rolePermissions = permissions.rolePermissions || {};
  const updateRolePermission = permissions.updateRolePermission;
  const replaceRolePermissions = permissions.replaceRolePermissions;
  const ensureRolePermissions = permissions.ensureRolePermissions;
  const deleteRole = roleRegistry.deleteRole;

  const SYSTEM_ROLES = new Set(["Primary Admin", "Administrator", "Technician", "Sales Assistant", "Receptionist"]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [role, setRole] = useState<UserRole>("Sales Assistant");
  const [newRoleName, setNewRoleName] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  const [activeUser, setActiveUser] = useState<SafeUser | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);

  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editRole, setEditRole] = useState<UserRole>("Sales Assistant");
  const [editStatus, setEditStatus] = useState<"Active" | "Disabled">("Active");
  const [authRole, setAuthRole] = useState<UserRole>("Sales Assistant");
  const [confirmDeleteRoleName, setConfirmDeleteRoleName] = useState("");
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState("");

  const availableRoles = useMemo(() => {
    const fromRegistry = roleRegistry.roleNames;
    const fromUsers = users.map((u) => (u.role || "").trim()).filter(Boolean);
    return Array.from(new Set([...fromRegistry, ...fromUsers]));
  }, [roleRegistry.roleNames, users]);

  const customRoles = useMemo(() => {
    return roleRegistry.roles.filter((roleRecord) => roleRecord.kind === "custom");
  }, [roleRegistry.roles]);

  const roleUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    users.forEach((user) => {
      const roleName = (user.role || "").trim();
      if (!roleName) return;
      counts[roleName] = (counts[roleName] || 0) + 1;
    });

    return counts;
  }, [users]);

  const activeCount = useMemo(() => users.filter((u) => u.status === "Active").length, [users]);
  const disabledCount = useMemo(() => users.filter((u) => u.status === "Disabled").length, [users]);

  const filteredUsers = useMemo(() => {
    const searchValue = userSearch.trim().toLowerCase();

    const filtered = users.filter((user) => {
      const matchesSearch =
        !searchValue ||
        user.username.toLowerCase().includes(searchValue) ||
        user.id.toLowerCase().includes(searchValue);

      const matchesRole =
        roleFilter === "ALL" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "username-asc":
          return a.username.localeCompare(b.username);
        case "username-desc":
          return b.username.localeCompare(a.username);
        case "role-asc":
          return a.role.localeCompare(b.role);
        case "role-desc":
          return b.role.localeCompare(a.role);
        case "oldest":
          return a.id.localeCompare(b.id);
        case "newest":
        default:
          return b.id.localeCompare(a.id);
      }
    });

    return sorted;
  }, [users, userSearch, roleFilter, statusFilter, sortBy]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  function openView(user: SafeUser) {
    setActiveUser(user);
    setModalType("view");
  }

  function openEdit(user: SafeUser) {
    if (!canEditUsers) return;
    setActiveUser(user);
    setEditUsername(user.username || "");
    setEditPassword(user.password || "");
    setEditRole(user.role || "Sales Assistant");
    setEditStatus(user.status);
    setModalType("edit");
  }

  function openAuthorisation(user: SafeUser) {
    if (!canEditUsers) return;
    ensureRolePermissions(user.role || "Sales Assistant");
    setActiveUser(user);
    setAuthRole(user.role || "Sales Assistant");
    setModalType("auth");
  }

  function openDeleteRoleModal() {
    if (!canCreateUsers) return;
    setConfirmDeleteRoleName("");
    setModalType("delete-role");
  }

  function closeModal() {
    setModalType(null);
    setActiveUser(null);
    setConfirmDeleteRoleName("");
    setConfirmDeleteUserId("");
  }

  async function handleCreateRole() {
    if (!canCreateUsers) return;

    setFormError("");
    setSuccessMessage("");

    const result = await roleRegistry.createRole(newRoleName);

    if (!result.success) {
      setFormError(result.error || "Unable to create role.");
      return;
    }

    const newRole = newRoleName.trim();
    ensureRolePermissions(newRole);
    setRole(newRole);
    setNewRoleName("");
    setFormError("");
    setSuccessMessage(`Role "${newRole}" created successfully.`);
  }

  async function handleDeleteRole(roleName: string) {
    if (!canDeleteRoles) return;

    setFormError("");
    setSuccessMessage("");

    const assignedCount = roleUsageCounts[roleName] || 0;
    if (assignedCount > 0) {
      setFormError(`Cannot delete "${roleName}" because it is assigned to ${assignedCount} user(s).`);
      setSuccessMessage("");
      return;
    }

    const result = await deleteRole(roleName);

    if (!result.success) {
      setFormError(result.error || "Unable to delete role.");
      return;
    }

    if (role === roleName) setRole("Sales Assistant");
    if (editRole === roleName) setEditRole("Sales Assistant");
    if (authRole === roleName) setAuthRole("Sales Assistant");

    setConfirmDeleteRoleName("");
    setFormError("");
    setSuccessMessage(`Role "${roleName}" deleted successfully.`);
  }

  async function handleCreateUser(event: React.FormEvent) {
    event.preventDefault();
    if (!canCreateUsers) return;

    setFormError("");
    setSuccessMessage("");

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const cleanRole = role.trim();

    if (!cleanUsername || !cleanPassword || !cleanRole) {
      setFormError("Username, password, and role are required.");
      return;
    }

    ensureRolePermissions(cleanRole);

    const result = await addUser({
      username: cleanUsername,
      password: cleanPassword,
      role: cleanRole,
    });

    if (!result?.success) {
      setFormError(result?.error || "Unable to create user.");
      return;
    }

    setUsername("");
    setPassword("");
    setSuccessMessage(`User "${cleanUsername}" created successfully.`);
  }

  async function handleSaveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!canEditUsers || !activeUser) return;

    setFormError("");
    setSuccessMessage("");

    const protectedAdmin = activeUser.id === PRIMARY_ADMIN_ID;
    const nextRole = protectedAdmin ? "Administrator" : (editRole.trim() || activeUser.role);
    const nextStatus = protectedAdmin ? "Active" : editStatus;

    ensureRolePermissions(nextRole);

    const result = await updateUser(activeUser.id, {
      username: editUsername.trim() || activeUser.username,
      password: editPassword.trim() || activeUser.password,
      role: nextRole,
      status: nextStatus,
    });

    if (!result?.success) {
      setFormError(result?.error || "Unable to update user.");
      return;
    }

    setSuccessMessage(`User "${editUsername.trim() || activeUser.username}" updated successfully.`);
    closeModal();
  }

  function handleDelete(id: string) {
    if (!canDeleteUsers) return;

    if (confirmDeleteUserId !== id) {
      setFormError("");
      setSuccessMessage("");
      setConfirmDeleteUserId(id);
      return;
    }

    const result = deleteUser(id);

    if (!result?.success) {
      setFormError(result?.error || "Unable to delete user.");
      return;
    }

    const deletedUser = users.find((u) => u.id === id);
    setSuccessMessage(`User "${deletedUser?.username || id}" deleted successfully.`);
    setConfirmDeleteUserId("");
  }

  async function handleQuickStatusToggle(targetUser: SafeUser) {
    if (!canEditUsers) return;
    if (targetUser.id === PRIMARY_ADMIN_ID) return;

    setFormError("");
    setSuccessMessage("");
    setConfirmDeleteUserId("");

    const nextStatus: "Active" | "Disabled" =
      targetUser.status === "Active" ? "Disabled" : "Active";

    const result = await updateUser(targetUser.id, { status: nextStatus });

    if (!result?.success) {
      setFormError(result?.error || "Unable to update user status.");
      return;
    }

    setSuccessMessage(
      `User "${targetUser.username}" ${nextStatus === "Active" ? "enabled" : "disabled"} successfully.`
    );
  }

  function togglePermission(permissionKey: keyof PermissionSet) {
    if (!canEditUsers) return;
    const currentValue = (rolePermissions[authRole] || defaultPermissionTemplate)[permissionKey];
    updateRolePermission(authRole, permissionKey, !currentValue);
  }

  function handleEnableGroupAll(keys: Array<keyof PermissionSet>) {
    if (!canEditUsers) return;
    keys.forEach((key) => updateRolePermission(authRole, key, true));
  }

  function handleDisableGroupAll(keys: Array<keyof PermissionSet>) {
    if (!canEditUsers) return;
    keys.forEach((key) => updateRolePermission(authRole, key, false));
  }

  function handleResetRoleToDefaults() {
    if (!canEditUsers) return;
    const defaults = systemRoleDefaults[authRole];
    replaceRolePermissions(authRole, defaults ?? { ...defaultPermissionTemplate });
  }

  const currentPermissions = useMemo(
    () => ({
      ...defaultPermissionTemplate,
      ...(rolePermissions[authRole] || {}),
    }),
    [rolePermissions, authRole]
  );

  const totalPermissionCount = Object.keys(defaultPermissionTemplate).length;
  const totalEnabledCount = useMemo(
    () => Object.values(currentPermissions).filter(Boolean).length,
    [currentPermissions]
  );

  return (
    <section className="ms-users-admin">
      <div className="ms-users-admin__header">
        <div>
          <h1>User Management</h1>
          <p>Current active role: <strong>{selectedRole}</strong></p>
        </div>
      </div>

      <div className="ms-users-admin__grid">
        <div className="ms-users-admin__card">
          <h2>Add User</h2>

          <PermissionGate
            allow={canCreateUsers}
            fallback={<div className="ms-users-admin__error">You do not have permission to create roles or users.</div>}
          >
            <div className="ms-users-admin__role-builder">
              <input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Create new role e.g. Construction Worker"
              />

              <div className="ms-users-admin__role-builder-actions">
                <button
                  type="button"
                  className="ms-users-admin__role-icon-button"
                  onClick={() => void handleCreateRole()}
                  title="Add role"
                  aria-label="Add role"
                >
                  <Plus size={16} />
                </button>

                <button
                  type="button"
                  className="ms-users-admin__role-icon-button ms-users-admin__role-icon-button--danger"
                  onClick={openDeleteRoleModal}
                  title="Delete roles"
                  aria-label="Delete roles"
                  disabled={!customRoles.length}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </PermissionGate>

          <form className="ms-users-admin__form" onSubmit={handleCreateUser}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              disabled={!canCreateUsers}
            />

            <div className="ms-users-admin__password-wrap">
              <input
                type={showCreatePassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={!canCreateUsers}
              />
              <button
                type="button"
                className="ms-users-admin__password-toggle"
                onClick={() => setShowCreatePassword((prev) => !prev)}
                disabled={!canCreateUsers}
                aria-label={showCreatePassword ? "Hide password" : "Show password"}
              >
                {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <select value={role} onChange={(e) => setRole(e.target.value)} disabled={!canCreateUsers}>
              {availableRoles.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>

            {formError ? <div className="ms-users-admin__error">{formError}</div> : null}
            {successMessage ? <div className="ms-users-admin__success">{successMessage}</div> : null}

            <button type="submit" disabled={!canCreateUsers}>
              {canCreateUsers ? "Create User" : "Administrator Only"}
            </button>
          </form>
        </div>

        <div className="ms-users-admin__card ms-users-admin__card--table">
          <div className="ms-users-admin__table-head">
            <div className="ms-users-admin__table-head-left">
              <h2>Existing Users</h2>

              <div className="ms-users-admin__status-summary">
                <span className="ms-users-admin__summary-item is-active">
                  Active: {activeCount}
                </span>
                <span className="ms-users-admin__summary-item is-disabled">
                  Disabled: {disabledCount}
                </span>
              </div>
            </div>

            <div className="ms-users-admin__filters">
              <input
                type="text"
                className="ms-users-admin__filter-input"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by username or ID"
              />

              <select
                className="ms-users-admin__filter-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                {availableRoles.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption}
                  </option>
                ))}
              </select>

              <select
                className="ms-users-admin__filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>

              <select
                className="ms-users-admin__filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="username-asc">Username A-Z</option>
                <option value="username-desc">Username Z-A</option>
                <option value="role-asc">Role A-Z</option>
                <option value="role-desc">Role Z-A</option>
              </select>
            </div>
          </div>

          {formError ? <div className="ms-users-admin__error ms-users-admin__feedback-inline">{formError}</div> : null}
          {successMessage ? <div className="ms-users-admin__success ms-users-admin__feedback-inline">{successMessage}</div> : null}

          <div className="ms-users-admin__table-wrap">
            <table className="ms-users-admin__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isPrimaryAdmin = user.id === PRIMARY_ADMIN_ID;

                  return (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>
                        <div className="ms-users-admin__identity">
                          <span>{user.username}</span>
                          {isPrimaryAdmin ? (
                            <span className="ms-users-admin__badge ms-users-admin__badge--primary">
                              Primary Admin
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="ms-users-admin__role-cell">
                          <span>{user.role}</span>
                          {isPrimaryAdmin ? (
                            <span className="ms-users-admin__badge ms-users-admin__badge--system">
                              Protected
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className={`ms-users-admin__status-badge ${user.status === "Active" ? "is-active" : "is-disabled"}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>{user.createdAt}</td>
                      <td>
                        <div className="ms-users-admin__actions">
                          <button type="button" onClick={() => openView(user)}>
                            <Eye size={14} />
                            <span>View</span>
                          </button>

                          <PermissionGate
                            allow={canEditUsers}
                            fallback={
                              <button type="button" disabled>
                                <Pencil size={14} />
                                <span>Edit</span>
                              </button>
                            }
                          >
                            <button type="button" onClick={() => openEdit(user)}>
                              <Pencil size={14} />
                              <span>Edit</span>
                            </button>
                          </PermissionGate>

                          <PermissionGate
                            allow={canEditUsers}
                            fallback={
                              <button type="button" disabled>
                                <ShieldCheck size={14} />
                                <span>Authorisation</span>
                              </button>
                            }
                          >
                            <button type="button" onClick={() => openAuthorisation(user)}>
                              <ShieldCheck size={14} />
                              <span>Authorisation</span>
                            </button>
                          </PermissionGate>

                          <PermissionGate
                            allow={canEditUsers}
                            fallback={
                              <button type="button" disabled>
                                <span>{user.status === "Active" ? "Disable" : "Enable"}</span>
                              </button>
                            }
                          >
                            <button
                              type="button"
                              className={`ms-users-admin__status-action ${user.status === "Active" ? "is-disable" : "is-enable"}`}
                              onClick={() => handleQuickStatusToggle(user)}
                              disabled={isPrimaryAdmin}
                              title={
                                isPrimaryAdmin
                                  ? "Main administrator cannot be disabled"
                                  : user.status === "Active"
                                  ? `Disable ${user.username}`
                                  : `Enable ${user.username}`
                              }
                            >
                              <span>{user.status === "Active" ? "Disable" : "Enable"}</span>
                            </button>
                          </PermissionGate>

                          <PermissionGate
                            allow={canDeleteUsers}
                            fallback={
                              <button type="button" className="ms-users-admin__delete-icon" disabled>
                                <Trash2 size={14} />
                              </button>
                            }
                          >
                            {isPrimaryAdmin ? (
                              <button
                                type="button"
                                className="ms-users-admin__delete-icon"
                                aria-label={`Delete ${user.username}`}
                                title="Main administrator cannot be deleted"
                                disabled
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : confirmDeleteUserId === user.id ? (
                              <div className="ms-users-admin__delete-confirm">
                                <button
                                  type="button"
                                  className="ms-users-admin__delete-cancel"
                                  onClick={() => setConfirmDeleteUserId("")}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className="ms-users-admin__delete-final"
                                  onClick={() => handleDelete(user.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="ms-users-admin__delete-icon"
                                onClick={() => handleDelete(user.id)}
                                aria-label={`Delete ${user.username}`}
                                title={`Delete ${user.username}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filteredUsers.length ? (
                  <tr>
                    <td colSpan={6} className="ms-users-admin__table-empty">
                      No users match the current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalType === "view" && activeUser ? (
        <div className="ms-users-modal__backdrop">
          <div className="ms-users-modal">
            <div className="ms-users-modal__header">
              <div>
                <h2>View User</h2>
                <p>User profile and account details.</p>
              </div>
              <button type="button" className="ms-users-modal__close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="ms-users-modal__body">
              <div className="ms-users-modal__info-row"><span>ID</span><strong>{activeUser.id}</strong></div>
              <div className="ms-users-modal__info-row"><span>Username</span><strong>{activeUser.username}</strong></div>
              <div className="ms-users-modal__info-row"><span>Password</span><strong>{activeUser.password ? "Set" : "Not set"}</strong></div>
              <div className="ms-users-modal__info-row">
                <span>Role</span>
                <strong className="ms-users-admin__view-badges">
                  {activeUser.role}
                  {activeUser.id === PRIMARY_ADMIN_ID ? (
                    <>
                      <span className="ms-users-admin__badge ms-users-admin__badge--primary">Primary Admin</span>
                      <span className="ms-users-admin__badge ms-users-admin__badge--system">Protected</span>
                    </>
                  ) : null}
                </strong>
              </div>
              <div className="ms-users-modal__info-row">
                <span>Status</span>
                <strong className="ms-users-admin__view-badges">
                  {activeUser.status}
                  {activeUser.id === PRIMARY_ADMIN_ID ? (
                    <span className="ms-users-admin__badge ms-users-admin__badge--active">Locked Active</span>
                  ) : null}
                </strong>
              </div>
              <div className="ms-users-modal__info-row"><span>Created</span><strong>{activeUser.createdAt}</strong></div>
            </div>

            <div className="ms-users-modal__actions">
              <button type="button" className="ms-users-modal__primary" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      ) : null}

      {modalType === "edit" && activeUser && canEditUsers ? (
        <div className="ms-users-modal__backdrop">
          <div className="ms-users-modal">
            <div className="ms-users-modal__header">
              <div>
                <h2>Edit User</h2>
                <p>Update username, password, role, and status.</p>
              </div>
              <button type="button" className="ms-users-modal__close" onClick={closeModal}>
                ×
              </button>
            </div>

            <form className="ms-users-modal__body ms-users-modal__form" onSubmit={handleSaveEdit}>
              <div className="ms-users-modal__field">
                <label>Username</label>
                <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
              </div>

              <div className="ms-users-modal__field">
                <label>Password</label>
                <div className="ms-users-admin__password-wrap">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="ms-users-admin__password-toggle"
                    onClick={() => setShowEditPassword((prev) => !prev)}
                    aria-label={showEditPassword ? "Hide password" : "Show password"}
                  >
                    {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="ms-users-modal__field">
                <label>Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  disabled={activeUser.id === PRIMARY_ADMIN_ID}
                >
                  {availableRoles.map((roleOption) => (
                    <option key={roleOption} value={roleOption}>
                      {roleOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ms-users-modal__field">
                <label>Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as "Active" | "Disabled")}
                  disabled={activeUser.id === PRIMARY_ADMIN_ID}
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              {activeUser.id === PRIMARY_ADMIN_ID ? (
                <div className="ms-users-admin__error">
                  The primary administrator cannot be disabled, deleted, or demoted from Primary Admin.
                </div>
              ) : null}

              <div className="ms-users-modal__actions">
                <button type="button" className="ms-users-modal__secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="ms-users-modal__primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {modalType === "auth" && activeUser && canEditUsers ? (
        <div className="ms-users-modal__backdrop">
          <div className="ms-users-modal ms-users-modal--auth">
            <div className="ms-users-modal__header">
              <div>
                <h2>Authorisation</h2>
                <p>Configure module access and action permissions per role.</p>
              </div>
              <button type="button" className="ms-users-modal__close" onClick={closeModal}>×</button>
            </div>

            <div className="ms-users-modal__body">
              {/* Role selector + summary row */}
              <div className="ms-users-auth-role-bar">
                <div className="ms-users-modal__field ms-users-auth-role-bar__field">
                  <label>Editing permissions for role</label>
                  <select
                    value={authRole}
                    onChange={(e) => {
                      const nextRole = e.target.value;
                      ensureRolePermissions(nextRole);
                      setAuthRole(nextRole);
                    }}
                  >
                    {availableRoles.map((roleOption) => (
                      <option key={roleOption} value={roleOption}>{roleOption}</option>
                    ))}
                  </select>
                </div>

                <div className="ms-users-auth-role-bar__meta">
                  {roleTierMap[authRole] ? (
                    <span className={roleTierMap[authRole].className}>
                      <strong>{roleTierMap[authRole].tier}</strong>
                      <span className="ms-users-tier__label">{roleTierMap[authRole].label}</span>
                    </span>
                  ) : (
                    <span className="ms-users-auth-role-kind ms-users-auth-role-kind--custom">
                      Custom Role
                    </span>
                  )}
                  <span className="ms-users-auth-summary">
                    <strong>{totalEnabledCount}</strong> / {totalPermissionCount} enabled
                  </span>
                </div>
              </div>

              {/* Locked role notice */}
              {LOCKED_SYSTEM_ROLES.has(authRole) ? (
                <div className="ms-users-auth-locked-notice">
                  <strong>{authRole}</strong> permissions are hardcoded and cannot be changed. This role always has full system access.
                </div>
              ) : (
                <p className="ms-users-auth-scope-note">
                  Changes to <strong>{authRole}</strong> apply to every user assigned this role.
                </p>
              )}

              {/* Permission groups */}
              {permissionGroups.map((group) => {
                const groupEnabled = group.keys.filter((k) => currentPermissions[k]).length;
                const allOn = groupEnabled === group.keys.length;
                const allOff = groupEnabled === 0;

                return (
                  <section key={group.title} className="ms-users-auth-section">
                    <div className="ms-users-auth-section__header">
                      <h3 className="ms-users-auth-section__title">{group.title}</h3>
                      <span className="ms-users-auth-section__count">
                        {groupEnabled} / {group.keys.length}
                      </span>
                      <div className="ms-users-auth-section__actions">
                        <button
                          type="button"
                          className="ms-users-auth-section__bulk-btn"
                          onClick={() => handleEnableGroupAll(group.keys)}
                          disabled={allOn || !canEditUsers || LOCKED_SYSTEM_ROLES.has(authRole)}
                          title="Enable all in this group"
                        >
                          Enable All
                        </button>
                        <button
                          type="button"
                          className="ms-users-auth-section__bulk-btn ms-users-auth-section__bulk-btn--off"
                          onClick={() => handleDisableGroupAll(group.keys)}
                          disabled={allOff || !canEditUsers || LOCKED_SYSTEM_ROLES.has(authRole)}
                          title="Disable all in this group"
                        >
                          Disable All
                        </button>
                      </div>
                    </div>

                    <div className="ms-users-auth-grid">
                      {group.keys.map((key) => {
                        const isOn = currentPermissions[key];
                        return (
                          <div
                            key={key}
                            className={`ms-users-auth-toggle ${isOn ? "is-on" : ""} ${LOCKED_SYSTEM_ROLES.has(authRole) ? "is-locked" : ""}`}
                            onClick={() => !LOCKED_SYSTEM_ROLES.has(authRole) && togglePermission(key)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !LOCKED_SYSTEM_ROLES.has(authRole)) togglePermission(key); }}
                            aria-pressed={isOn}
                          >
                            <div className="ms-users-auth-toggle__meta">
                              <span className="ms-users-auth-toggle__title">{permissionLabels[key]}</span>
                              <span className={`ms-users-auth-toggle__state ${isOn ? "is-enabled" : ""}`}>
                                {isOn ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                            <button
                              type="button"
                              className={`ms-users-auth-toggle__switch ${isOn ? "is-on" : "is-off"}`}
                              onClick={(e) => { e.stopPropagation(); if (!LOCKED_SYSTEM_ROLES.has(authRole)) togglePermission(key); }}
                              disabled={LOCKED_SYSTEM_ROLES.has(authRole)}
                              aria-label={`${permissionLabels[key]}: ${isOn ? "enabled" : "disabled"}`}
                            >
                              <span />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="ms-users-modal__actions">
              {!LOCKED_SYSTEM_ROLES.has(authRole) && (
                <button
                  type="button"
                  className="ms-users-modal__secondary ms-users-auth-reset-btn"
                  onClick={handleResetRoleToDefaults}
                  title={
                    SYSTEM_ROLES.has(authRole)
                      ? `Reset ${authRole} to system-defined defaults`
                      : `Clear all permissions for ${authRole}`
                  }
                >
                  {SYSTEM_ROLES.has(authRole) ? "Reset to Defaults" : "Clear All Permissions"}
                </button>
              )}
              <button type="button" className="ms-users-modal__primary" onClick={closeModal}>Done</button>
            </div>
          </div>
        </div>
      ) : null}

      {modalType === "delete-role" ? (
        <div className="ms-users-modal__backdrop">
          <div className="ms-users-modal">
            <div className="ms-users-modal__header">
              <div>
                <h2>Delete Roles</h2>
                <p>Delete custom roles from the system.</p>
              </div>
              <button type="button" className="ms-users-modal__close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="ms-users-modal__body">
              {customRoles.length ? (
                <div className="ms-users-admin__role-list">
                  {customRoles.map((roleRecord) => (
                    <div key={roleRecord.name} className="ms-users-admin__role-item">
                      <div className="ms-users-admin__role-meta">
                        <span className="ms-users-admin__role-name">{roleRecord.name}</span>

                        {(roleUsageCounts[roleRecord.name] || 0) > 0 ? (
                          <span className="ms-users-admin__role-usage">
                            Assigned to {roleUsageCounts[roleRecord.name]} user(s)
                          </span>
                        ) : (
                          <span className="ms-users-admin__role-usage ms-users-admin__role-usage--free">
                            Not assigned
                          </span>
                        )}
                      </div>

                      {(roleUsageCounts[roleRecord.name] || 0) > 0 ? (
                        <button
                          type="button"
                          className="ms-users-admin__role-delete"
                          disabled
                          title="Role is assigned to users"
                        >
                          Delete
                        </button>
                      ) : confirmDeleteRoleName === roleRecord.name ? (
                        <div className="ms-users-admin__role-confirm">
                          <span className="ms-users-admin__role-confirm-text">
                            Delete "{roleRecord.name}"?
                          </span>

                          <button
                            type="button"
                            className="ms-users-admin__role-cancel"
                            onClick={() => setConfirmDeleteRoleName("")}
                            disabled={!canCreateUsers}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            className="ms-users-admin__role-delete-final"
                            onClick={() => void handleDeleteRole(roleRecord.name)}
                            disabled={!canDeleteRoles}
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="ms-users-admin__role-delete"
                          onClick={() => setConfirmDeleteRoleName(roleRecord.name)}
                          disabled={!canCreateUsers}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ms-users-admin__empty-state">No custom roles available.</div>
              )}
            </div>

            <div className="ms-users-modal__actions">
              <button type="button" className="ms-users-modal__primary" onClick={closeModal}>Done</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}







