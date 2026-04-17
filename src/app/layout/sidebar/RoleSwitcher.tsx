import "./RoleSwitcher.css";
import { ChevronDown, Shield, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useRole } from "../../../context/RoleContext";
import { useAuth } from "../../../context/AuthContext";

export default function RoleSwitcher() {
  const { roles, selectedRole } = useRole();
  const { users, switchSessionToUser } = useAuth();

  const [open, setOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const visibleRoles = useMemo(() => {
    const activeRoleNames = new Set(
      (users || [])
        .filter((u) => u.status === "Active")
        .map((u) => u.role)
    );

    return roles.filter((role) => activeRoleNames.has(role));
  }, [roles, users]);

  function handleSelect(role: string) {
    if (role === selectedRole) return;
    setPendingRole(role);
    setOpen(false);
    setUsername("");
    setPassword("");
    setError("");
  }

  async function handleConfirm(event: React.FormEvent) {
    event.preventDefault();
    if (!pendingRole) return;

    const result = await switchSessionToUser(username.trim(), password, pendingRole);

    if (!result.success) {
      setError(result.error || "Unable to switch role.");
      return;
    }

    setPendingRole(null);
    setUsername("");
    setPassword("");
    setError("");
  }

  function handleCancel() {
    setPendingRole(null);
    setUsername("");
    setPassword("");
    setError("");
  }

  return (
    <>
      <div className="ms-role-switcher">
        <button
          type="button"
          className="ms-role-switcher__toggle"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="ms-role-switcher__left">
            <Shield size={16} />
            <span>{selectedRole}</span>
          </span>
          <ChevronDown size={16} className={open ? "is-open" : ""} />
        </button>

        {open ? (
          <div className="ms-role-switcher__menu">
            {visibleRoles.map((role) => (
              <button
                key={role}
                type="button"
                className={`ms-role-switcher__item ${selectedRole === role ? "is-active" : ""}`}
                onClick={() => handleSelect(role)}
              >
                {role}
                {selectedRole === role ? " · Active" : ""}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {pendingRole ? (
        <div className="ms-role-modal__backdrop">
          <div className="ms-role-modal">
            <div className="ms-role-modal__header">
              <div>
                <h2>Switch Role</h2>
                <p>Enter the user credentials for <strong>{pendingRole}</strong>.</p>
              </div>

              <button type="button" className="ms-role-modal__close" onClick={handleCancel}>
                <X size={18} />
              </button>
            </div>

            <form className="ms-role-modal__form" onSubmit={handleConfirm}>
              <div className="ms-role-modal__field">
                <label>Role</label>
                <input value={pendingRole} readOnly />
              </div>

              <div className="ms-role-modal__field">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="ms-role-modal__field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              {error ? <div className="ms-role-modal__error">{error}</div> : null}

              <div className="ms-role-modal__actions">
                <button type="button" className="ms-role-modal__secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="ms-role-modal__primary">
                  Confirm Switch
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
