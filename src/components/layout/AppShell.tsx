import { ChevronRight, LogOut, Mail, MapPin, Settings, Shield, Smartphone, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type SiteOption = {
  id: string;
  name: string;
  address: string;
};

const sites: SiteOption[] = [
  { id: "site-1", name: "Downtown Store", address: "123 Main Street, City Center" },
  { id: "site-2", name: "North Branch", address: "456 Oak Avenue, North District" },
  { id: "site-3", name: "East Location", address: "789 Elm Road, East Side" },
  { id: "site-4", name: "West Mall Outlet", address: "321 Pine Boulevard, West Mall" },
];

export default function AppShell() {
  const { user, users, logout, loadUsers, switchAccount } = useAuth();
  const navigate = useNavigate();

  const [selectedSiteId, setSelectedSiteId] = useState("site-1");
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [targetUsername, setTargetUsername] = useState("");
  const [switchPassword, setSwitchPassword] = useState("");
  const [switchError, setSwitchError] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const selectedSite = useMemo(
    () => sites.find((site) => site.id === selectedSiteId) ?? sites[0],
    [selectedSiteId]
  );

  const availableAccounts = useMemo(() => {
    return users.filter((item) => item.username !== user?.username);
  }, [users, user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openSwitchModal = (username: string) => {
    setTargetUsername(username);
    setSwitchPassword("");
    setSwitchError("");
    setRoleMenuOpen(false);
    setSwitchModalOpen(true);
  };

  const handleSwitch = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSwitching(true);
    setSwitchError("");

    const result = await switchAccount(targetUsername, switchPassword);

    setIsSwitching(false);

    if (!result.success) {
      setSwitchError(result.error ?? "Unable to switch account.");
      return;
    }

    setSwitchModalOpen(false);
    navigate("/dashboard");
  };

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar sidebar--enhanced">
          <div className="sidebar-brand">
            <div className="topnav__brand">
              <div className="topnav__brand-mark">M</div>
              <span className="topnav__brand-name">ModuServ</span>
            </div>
            <p>Service operations platform</p>
          </div>

          <div className="sidebar-site-switcher">
            <button
              type="button"
              className="sidebar-site-button"
              onClick={() => setSiteMenuOpen((prev) => !prev)}
            >
              <span className="sidebar-site-button__left">
                <MapPin size={18} />
                <span>{selectedSite.name}</span>
              </span>
              <ChevronRight size={18} className={`sidebar-chevron ${siteMenuOpen ? "sidebar-chevron--open" : ""}`} />
            </button>

            {siteMenuOpen ? (
              <div className="sidebar-popover">
                <div className="sidebar-popover__header">Select Site</div>
                <div className="sidebar-popover__body">
                  {sites.map((site) => (
                    <button
                      key={site.id}
                      type="button"
                      className="sidebar-popover__item"
                      onClick={() => {
                        setSelectedSiteId(site.id);
                        setSiteMenuOpen(false);
                      }}
                    >
                      <div className="sidebar-popover__item-top">
                        <strong>{site.name}</strong>
                        {site.id === selectedSite.id ? (
                          <span className="sidebar-popover__badge">Active</span>
                        ) : null}
                      </div>
                      <div className="sidebar-popover__item-text">{site.address}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <nav className="sidebar-nav">
            <NavLink to="/dashboard" className="sidebar-link">
              <Wrench size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/jobs" className="sidebar-link">
              <Smartphone size={18} />
              <span>Jobs</span>
            </NavLink>

            <NavLink to="/sync" className="sidebar-link">
              <Wrench size={18} />
              <span>Sync</span>
            </NavLink>

            {user?.role === "Admin" ? (
              <NavLink to="/settings" className="sidebar-link">
                <Settings size={18} />
                <span>Settings</span>
              </NavLink>
            ) : null}

            {user?.role === "Admin" ? (
              <NavLink to="/users" className="sidebar-link">
                <Mail size={18} />
                <span>Users</span>
              </NavLink>
            ) : null}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-role-switcher">
              <button
                type="button"
                className="sidebar-role-button"
                onClick={() => setRoleMenuOpen((prev) => !prev)}
              >
                <span className="sidebar-role-button__left">
                  <Shield size={18} />
                  <span>{user?.role ?? "Unknown Role"}</span>
                </span>
                <ChevronRight size={18} className={`sidebar-chevron ${roleMenuOpen ? "sidebar-chevron--open" : ""}`} />
              </button>

              {roleMenuOpen ? (
                <div className="sidebar-popover sidebar-popover--footer">
                  <div className="sidebar-popover__header">Switch Account</div>
                  <div className="sidebar-popover__body">
                    {availableAccounts.length === 0 ? (
                      <div className="sidebar-popover__empty">No other accounts available.</div>
                    ) : (
                      availableAccounts.map((account) => (
                        <button
                          key={account.id}
                          type="button"
                          className="sidebar-popover__item"
                          onClick={() => openSwitchModal(account.username)}
                        >
                          <div className="sidebar-popover__item-top">
                            <strong>{account.username}</strong>
                            <span className="sidebar-popover__badge sidebar-popover__badge--role">
                              {account.role}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="sidebar-user-card">
              <div className="sidebar-user-avatar">
                {(user?.username?.slice(0, 2) || "US").toUpperCase()}
              </div>
              <div className="sidebar-user-meta">
                <div className="sidebar-user-name">{user?.username || "Unknown User"}</div>
                <div className="sidebar-user-subtitle">{user?.role || "Unknown Role"}</div>
              </div>
            </div>

            <button type="button" className="topnav__logout sidebar-logout" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <div className="app-main">
          <header className="topnav topnav--minimal">
            <div className="topnav__left">
              <div className="topnav__brand">
                <div className="topnav__brand-mark">M</div>
                <span className="topnav__brand-name">ModuServ</span>
              </div>
            </div>
          </header>

          <main className="app-content">
            <Outlet />
          </main>
        </div>
      </div>

      {switchModalOpen ? (
        <div className="switch-modal-backdrop">
          <div className="switch-modal">
            <h2 className="switch-modal__title">Switch Account</h2>
            <p className="switch-modal__text">
              Sign in to <strong>{targetUsername}</strong> to switch roles.
            </p>

            <form onSubmit={handleSwitch} className="switch-modal__form">
              <div className="form-field">
                <label>Username</label>
                <input value={targetUsername} readOnly />
              </div>

              <div className="form-field">
                <label>Password</label>
                <input
                  type="password"
                  value={switchPassword}
                  onChange={(e) => setSwitchPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              {switchError ? <div className="login-error">{switchError}</div> : null}

              <div className="switch-modal__actions">
                <button
                  type="button"
                  className="button-link button-link--button button-link--secondary"
                  onClick={() => {
                    setSwitchModalOpen(false);
                    setTargetUsername("");
                    setSwitchPassword("");
                    setSwitchError("");
                  }}
                >
                  Cancel
                </button>

                <button type="submit" className="button-link button-link--button" disabled={isSwitching}>
                  {isSwitching ? "Switching..." : "Switch Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

