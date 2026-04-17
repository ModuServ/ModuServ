import "./SettingsPage.css";
import { useEffect, useRef, useState } from "react";
import { Camera, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useSettings } from "../../../context/SettingsContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { API_BASE } from "../../../lib/api";

function resizeToBase64(file: File, maxSize = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas unavailable")); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { autoSync, aiSuggestions, setAutoSync, setAiSuggestions, resetSettings } = useSettings();
  const { canResetSettings } = useRolePermissions();

  const [username, setUsername] = useState(user?.username ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatar);
  const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [connStatus, setConnStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [clearConfirm, setClearConfirm] = useState(false);

  // Re-sync local form state whenever the active user identity changes (role switch / login as different user)
  useEffect(() => {
    setUsername(user?.username ?? "");
    setAvatarPreview(user?.avatar);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setProfileStatus(null);
  }, [user?.id]);

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeToBase64(file);
      setAvatarPreview(base64);
    } catch {
      setProfileStatus({ type: "error", message: "Could not process image. Try a different file." });
    }
    e.target.value = "";
  }

  function handleRemoveAvatar() {
    setAvatarPreview(undefined);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileStatus(null);

    const changingPassword = newPassword.trim().length > 0;

    if (changingPassword) {
      if (!currentPassword) {
        setProfileStatus({ type: "error", message: "Enter your current password to set a new one." });
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileStatus({ type: "error", message: "New passwords do not match." });
        return;
      }
      if (newPassword.trim().length < 3) {
        setProfileStatus({ type: "error", message: "New password must be at least 3 characters." });
        return;
      }
    }

    const result = await updateProfile({
      username: username !== user?.username ? username : undefined,
      currentPassword: changingPassword ? currentPassword : undefined,
      newPassword: changingPassword ? newPassword : undefined,
      avatar: avatarPreview !== user?.avatar ? avatarPreview : undefined,
    });

    if (!result.success) {
      setProfileStatus({ type: "error", message: result.error ?? "Update failed." });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setProfileStatus({ type: "success", message: "Profile updated successfully." });
  }

  const [connDbType, setConnDbType] = useState<"postgresql" | "sqlite" | null>(null);

  async function handleTestConnection() {
    setConnStatus("checking");
    setConnDbType(null);
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json() as { status: string; db?: string };
        setConnDbType(data.db === "postgresql" ? "postgresql" : "sqlite");
        setConnStatus("ok");
      } else {
        setConnStatus("error");
      }
    } catch {
      setConnStatus("error");
    }
  }

  function handleClearCache() {
    if (!clearConfirm) { setClearConfirm(true); return; }
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("moduserv"));
    keys.forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  }

  const initials = (user?.username?.slice(0, 2) ?? "??").toUpperCase();

  return (
    <section className="ms-settings">
      <div className="ms-settings__header">
        <h1 className="ms-settings__title">Settings</h1>
        <p className="ms-settings__subtitle">Manage your profile and system preferences.</p>
      </div>

      {/* ── My Profile ──────────────────────────────────────── */}
      <form className="ms-settings__card ms-settings__profile-card" onSubmit={(e) => void handleSaveProfile(e)}>
        <h2 className="ms-settings__card-title">My Profile</h2>
        <p className="ms-settings__card-sub">Update your display name, password, and profile photo.</p>

        {/* Avatar row */}
        <div className="ms-settings__avatar-row">
          <div className="ms-settings__avatar-wrap">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="ms-settings__avatar-img" />
            ) : (
              <span className="ms-settings__avatar-initials">{initials}</span>
            )}
            <button
              type="button"
              className="ms-settings__avatar-edit"
              onClick={handleAvatarClick}
              title="Change profile photo"
            >
              <Camera size={13} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => void handleFileChange(e)}
          />
          <div className="ms-settings__avatar-info">
            <p className="ms-settings__avatar-name">{user?.username ?? "Unknown"}</p>
            <p className="ms-settings__avatar-role">{user?.role ?? ""}</p>
            <div className="ms-settings__avatar-actions">
              <button type="button" className="ms-settings__link-btn" onClick={handleAvatarClick}>
                Change photo
              </button>
              {avatarPreview && (
                <button type="button" className="ms-settings__link-btn ms-settings__link-btn--danger" onClick={handleRemoveAvatar}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Account fields — two-column grid */}
        <div className="ms-settings__form-grid">
          <div className="ms-settings__field ms-settings__field--full">
            <label className="ms-settings__label" htmlFor="profile-username">Username</label>
            <input
              id="profile-username"
              type="text"
              className="ms-settings__input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password section */}
        <div className="ms-settings__section-divider" />
        <div className="ms-settings__field-group-label">Change Password</div>
        <p className="ms-settings__hint ms-settings__hint--spaced">Leave all three blank to keep your current password.</p>

        <div className="ms-settings__form-grid">
          <div className="ms-settings__field ms-settings__field--full">
            <label className="ms-settings__label" htmlFor="profile-current-pw">Current Password</label>
            <div className="ms-settings__input-wrap">
              <input
                id="profile-current-pw"
                type={showCurrent ? "text" : "password"}
                className="ms-settings__input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Required to set a new password"
              />
              <button
                type="button"
                className="ms-settings__eye"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="ms-settings__field">
            <label className="ms-settings__label" htmlFor="profile-new-pw">New Password</label>
            <div className="ms-settings__input-wrap">
              <input
                id="profile-new-pw"
                type={showNew ? "text" : "password"}
                className="ms-settings__input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="New password"
              />
              <button
                type="button"
                className="ms-settings__eye"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="ms-settings__field">
            <label className="ms-settings__label" htmlFor="profile-confirm-pw">Confirm New Password</label>
            <div className="ms-settings__input-wrap">
              <input
                id="profile-confirm-pw"
                type={showConfirm ? "text" : "password"}
                className="ms-settings__input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat new password"
              />
              <button
                type="button"
                className="ms-settings__eye"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {profileStatus && (
          <p className={`ms-settings__status ms-settings__status--${profileStatus.type}`}>
            {profileStatus.message}
          </p>
        )}

        <div className="ms-settings__form-footer">
          <button type="submit" className="ms-settings__save-btn">
            Save Profile
          </button>
        </div>
      </form>

      {/* ── Application Preferences ─────────────────────────── */}
      <div className="ms-settings__card">
        <h2 className="ms-settings__card-title">Application</h2>
        <p className="ms-settings__card-sub">Preferences that apply to your current session.</p>

        <label className="ms-settings__toggle-row">
          <div>
            <span className="ms-settings__toggle-label">Enable AI suggestions</span>
            <p className="ms-settings__hint">Shows AI-based priority and category suggestions during job intake.</p>
          </div>
          <input
            type="checkbox"
            checked={aiSuggestions}
            onChange={(e) => setAiSuggestions(e.target.checked)}
          />
        </label>

        <label className="ms-settings__toggle-row">
          <div>
            <span className="ms-settings__toggle-label">Enable automatic sync</span>
            <p className="ms-settings__hint">Syncs the job queue to the server every 30 seconds when connected.</p>
          </div>
          <input
            type="checkbox"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
          />
        </label>
      </div>

      {/* ── Database connection ─────────────────────────────── */}
      <div className="ms-settings__card">
        <h2 className="ms-settings__card-title">Database</h2>
        <p className="ms-settings__card-sub">Check the connection to the cloud database (Neon PostgreSQL).</p>

        <div className="ms-settings__reset-zone">
          <div className="ms-settings__reset-text">
            <span className="ms-settings__toggle-label">Connection status</span>
            {connStatus === "idle" && <p>Click to ping the server.</p>}
            {connStatus === "checking" && <p className="ms-settings__conn ms-settings__conn--checking"><Loader2 size={14} className="ms-settings__spin" /> Checking…</p>}
            {connStatus === "ok" && <p className="ms-settings__conn ms-settings__conn--ok"><CheckCircle size={14} /> Connected — {connDbType === "postgresql" ? "Neon PostgreSQL (cloud)" : "SQLite (local)"}</p>}
            {connStatus === "error" && <p className="ms-settings__conn ms-settings__conn--error"><XCircle size={14} /> Cannot reach the server — running in offline mode.</p>}
          </div>
          <button
            type="button"
            className="ms-settings__reset-button ms-settings__reset-button--neutral"
            onClick={() => void handleTestConnection()}
            disabled={connStatus === "checking"}
          >
            Test Connection
          </button>
        </div>
      </div>

      {/* ── Reset (admin only) ──────────────────────────────── */}
      {canResetSettings && (
        <div className="ms-settings__card">
          <h2 className="ms-settings__card-title">Reset</h2>
          <p className="ms-settings__card-sub">Danger zone — these actions cannot be undone.</p>

          <div className="ms-settings__reset-zone">
            <div className="ms-settings__reset-text">
              <span className="ms-settings__toggle-label">Restore default settings</span>
              <p>Resets all application preferences (AI suggestions, auto-sync) to their factory defaults.</p>
            </div>
            <button
              type="button"
              className="ms-settings__reset-button"
              onClick={resetSettings}
            >
              Reset to Defaults
            </button>
          </div>

          <div className="ms-settings__section-divider" />

          <div className="ms-settings__reset-zone">
            <div className="ms-settings__reset-text">
              <span className="ms-settings__toggle-label">Clear local cache</span>
              <p>Wipes all locally cached data from this browser. On next load, everything will be re-fetched from the cloud database.</p>
            </div>
            <button
              type="button"
              className={`ms-settings__reset-button${clearConfirm ? " ms-settings__reset-button--confirm" : ""}`}
              onClick={handleClearCache}
            >
              {clearConfirm ? "Tap again to confirm" : "Clear Cache"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
