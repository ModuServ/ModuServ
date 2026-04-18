import logo from "../../assets/ModuServ_Version2.png";
import "./Sidebar.css";
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  ClipboardPlus,
  FileText,
  Gauge,
  ListTodo,
  LogOut,
  MapPin,
  RefreshCw,
  ScrollText,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSync } from "../../context/SyncContext";
import { useRolePermissions } from "../hooks/useRolePermissions";
import { useForms } from "../context/FormsContext";
import SiteSwitcher from "./sidebar/SiteSwitcher";
import RoleSwitcher from "./sidebar/RoleSwitcher";

type SidebarProps = { isOpen?: boolean; onClose?: () => void };

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { pendingCount, failedCount } = useSync();
  const permissions = useRolePermissions();
  const { forms } = useForms();

  const [intakeExpanded, setIntakeExpanded] = useState(false);
  const [expandedFormIds, setExpandedFormIds] = useState<Set<string>>(new Set());

  function toggleFormExpand(id: string) {
    setExpandedFormIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const visibleForms = forms.filter((f) => f.status !== "Archived");
  const canSeeForms = permissions.canSubmitForms || permissions.canManageForms;

  function renderFormEntries(location: "system" | "customers" | "scheduling") {
    if (!canSeeForms) return null;
    const locationForms = visibleForms.filter((f) => (f.location ?? "system") === location);
    if (locationForms.length === 0) return null;
    return locationForms.map((form) => (
      <div key={form.id}>
        <div className="ms-sidebar__link-row">
          <NavLink
            to={`/forms/${form.id}`}
            className="ms-sidebar__link ms-sidebar__link--grow"
          >
            <FileText size={18} />
            <span>{form.name}</span>
          </NavLink>
          {permissions.canManageForms ? (
            <button
              className={`ms-sidebar__expand-btn${expandedFormIds.has(form.id) ? " is-open" : ""}`}
              onClick={() => toggleFormExpand(form.id)}
              aria-label={`Toggle ${form.name} sub-menu`}
            >
              <ChevronDown size={14} />
            </button>
          ) : null}
        </div>
        {permissions.canManageForms && expandedFormIds.has(form.id) ? (
          <NavLink to={`/forms/${form.id}/manage`} className="ms-sidebar__sub-link">
            <span>Management</span>
          </NavLink>
        ) : null}
      </div>
    ));
  }

  return (
    <aside className={`ms-sidebar${isOpen ? " ms-sidebar--open" : ""}`}>
      <div className="ms-sidebar__top-fixed">
        <div className="ms-sidebar__brand-wrap">
          <Link to="/dashboard" className="ms-sidebar__brand-link" aria-label="Go to dashboard">
            <img src={logo} alt="ModuServ" className="ms-sidebar__logo" />
          </Link>
          {onClose && (
            <button className="ms-sidebar__close-btn" onClick={onClose} aria-label="Close menu">
              <X size={20} />
            </button>
          )}
        </div>
        <SiteSwitcher />
      </div>

      <div className="ms-sidebar__scroll">
        <nav className="ms-sidebar__nav" onClick={onClose}>

          {/* ── Customers ─────────────────────────────────────────────── */}
          <div className="ms-sidebar__group">
            <div className="ms-sidebar__group-label">Customers</div>
            {permissions.canAccessCustomerSearch ? (
              <NavLink to="/jobs" className="ms-sidebar__link">
                <Search size={18} />
                <span>Customer Search</span>
              </NavLink>
            ) : null}
            {renderFormEntries("customers")}
          </div>

          {/* ── Scheduling ────────────────────────────────────────────── */}
          <div className="ms-sidebar__group">
            <div className="ms-sidebar__group-label">Scheduling</div>

            {permissions.canAccessCustomerIntake ? (
              <>
                <div className="ms-sidebar__link-row">
                  <NavLink to="/customer-intake" className="ms-sidebar__link ms-sidebar__link--grow">
                    <ClipboardPlus size={18} />
                    <span>Customer Intake</span>
                  </NavLink>
                  {permissions.canManageIntakeOptions ? (
                    <button
                      className={`ms-sidebar__expand-btn${intakeExpanded ? " is-open" : ""}`}
                      onClick={() => setIntakeExpanded((v) => !v)}
                      aria-label="Toggle intake sub-menu"
                    >
                      <ChevronDown size={14} />
                    </button>
                  ) : null}
                </div>
                {permissions.canManageIntakeOptions && intakeExpanded ? (
                  <NavLink to="/customer-intake/manage" className="ms-sidebar__sub-link">
                    <span>Management</span>
                  </NavLink>
                ) : null}
              </>
            ) : null}

            {permissions.canAccessCalendar ? (
              <NavLink to="/calendar" className="ms-sidebar__link">
                <CalendarDays size={18} />
                <span>Calendar</span>
              </NavLink>
            ) : null}

            {permissions.canAccessAppointmentManagement ? (
              <NavLink to="/appointment-management" className="ms-sidebar__link">
                <ListTodo size={18} />
                <span>Appointment Management</span>
              </NavLink>
            ) : null}

            {permissions.canAccessRepairTracking ? (
              <NavLink to="/repair-tracking" className="ms-sidebar__link">
                <Gauge size={18} />
                <span>Repair Tracking</span>
              </NavLink>
            ) : null}
            {renderFormEntries("scheduling")}
          </div>

          {/* ── System ────────────────────────────────────────────────── */}
          <div className="ms-sidebar__group">
            <div className="ms-sidebar__group-label">System</div>

            {permissions.canAccessUserManagement ? (
              <NavLink to="/users" className="ms-sidebar__link">
                <Users size={18} />
                <span>User Management</span>
              </NavLink>
            ) : null}

            {permissions.canAccessUserManagement ? (
              <NavLink to="/audit" className="ms-sidebar__link">
                <ScrollText size={18} />
                <span>Audit Log</span>
              </NavLink>
            ) : null}

            {permissions.canAccessSyncQueue ? (
              <NavLink to="/sync" className="ms-sidebar__link">
                <RefreshCw size={18} />
                <span>Sync Queue</span>
                {failedCount > 0 ? (
                  <span className="ms-sidebar__badge ms-sidebar__badge--failed">{failedCount} failed</span>
                ) : pendingCount > 0 ? (
                  <span className="ms-sidebar__badge">{pendingCount}</span>
                ) : null}
              </NavLink>
            ) : null}

            {permissions.canAccessLocationManagement ? (
              <NavLink to="/location-management" className="ms-sidebar__link">
                <MapPin size={18} />
                <span>Location Management</span>
              </NavLink>
            ) : null}

            {canSeeForms ? (
              <NavLink to="/forms" className="ms-sidebar__link" end>
                <ClipboardList size={18} />
                <span>Forms</span>
                {visibleForms.length > 0 && (
                  <span className="ms-sidebar__forms-count">{visibleForms.length}</span>
                )}
              </NavLink>
            ) : null}
            {renderFormEntries("system")}

            {permissions.canAccessSettings ? (
              <NavLink to="/settings" className="ms-sidebar__link">
                <Settings size={18} />
                <span>Settings</span>
              </NavLink>
            ) : null}
          </div>

        </nav>
      </div>

      <div className="ms-sidebar__footer">
        <RoleSwitcher />

        <div className="ms-sidebar__user">
          <div className="ms-sidebar__avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} className="ms-sidebar__avatar-img" />
            ) : (
              (user?.username?.slice(0, 2) || "AD").toUpperCase()
            )}
          </div>
          <div className="ms-sidebar__user-meta">
            <div className="ms-sidebar__user-name">{user?.username || "admin"}</div>
            <div className="ms-sidebar__user-role">{user?.role || "Administrator"}</div>
          </div>
        </div>

        <button type="button" className="ms-sidebar__logout" onClick={logout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
