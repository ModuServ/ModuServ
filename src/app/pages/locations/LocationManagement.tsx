import "./LocationManagement.css";
import { MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useSite, type SiteOption } from "../../../context/SiteContext";
import { useAuth } from "../../../context/AuthContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { API_BASE, authFetch } from "../../../lib/api";

const ACCESS_CACHE_KEY = "moduserv:location-access";

function loadAccessCache(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(ACCESS_CACHE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string[]>;
  } catch { /* ignore */ }
  return {};
}

function saveAccessCache(map: Record<string, string[]>) {
  localStorage.setItem(ACCESS_CACHE_KEY, JSON.stringify(map));
}

export default function LocationManagement() {
  const { sites, addSite, renameSite, deleteSite } = useSite();
  const { users } = useAuth();
  const { canAccessLocationManagement } = useRolePermissions();

  // locationId → userIds[]
  const [accessMap, setAccessMap] = useState<Record<string, string[]>>(loadAccessCache);
  const [loadingAccess, setLoadingAccess] = useState(false);

  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(
    () => sites[0]?.id ?? null
  );

  const [newLocationName, setNewLocationName] = useState("");
  const [addError, setAddError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");

  // Fetch access for selected location from backend
  useEffect(() => {
    if (!selectedSiteId) return;
    setLoadingAccess(true);
    authFetch(`${API_BASE}/locations/${selectedSiteId}/access`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { locationId: string; userIds: string[] }) => {
        setAccessMap((prev) => {
          const updated = { ...prev, [data.locationId]: data.userIds };
          saveAccessCache(updated);
          return updated;
        });
      })
      .catch(() => { /* stay on cached */ })
      .finally(() => setLoadingAccess(false));
  }, [selectedSiteId]);

  const selectedSite = useMemo(
    () => sites.find((s) => s.id === selectedSiteId) ?? null,
    [sites, selectedSiteId]
  );

  const usersWithAccess = useMemo(() => {
    if (!selectedSiteId) return [];
    const allowed = accessMap[selectedSiteId] ?? [];
    return users.map((u) => ({ ...u, hasAccess: allowed.includes(u.id) }));
  }, [users, accessMap, selectedSiteId]);

  async function handleAddLocation() {
    const name = newLocationName.trim();
    if (!name) { setAddError("Location name is required."); return; }
    if (sites.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setAddError("A location with that name already exists.");
      return;
    }
    const created = await addSite(name);
    setNewLocationName("");
    setAddError("");
    setSelectedSiteId(created.id);
  }

  function startEdit(site: SiteOption) {
    setEditingId(site.id);
    setEditName(site.name);
    setEditError("");
  }

  async function commitEdit() {
    const name = editName.trim();
    if (!name) { setEditError("Name cannot be empty."); return; }
    if (sites.some((s) => s.id !== editingId && s.name.toLowerCase() === name.toLowerCase())) {
      setEditError("A location with that name already exists.");
      return;
    }
    if (editingId) await renameSite(editingId, name);
    setEditingId(null);
    setEditError("");
  }

  async function handleDelete(id: string) {
    const site = sites.find((s) => s.id === id);
    if (!site) return;
    if (sites.length === 1) { alert("You must have at least one location."); return; }
    if (!window.confirm(`Delete location "${site.name}"? This cannot be undone.`)) return;
    await deleteSite(id);
    if (selectedSiteId === id) {
      setSelectedSiteId(sites.find((s) => s.id !== id)?.id ?? null);
    }
  }

  async function toggleUserAccess(userId: string) {
    if (!selectedSiteId) return;
    const current = accessMap[selectedSiteId] ?? [];
    const updated = current.includes(userId)
      ? current.filter((uid) => uid !== userId)
      : [...current, userId];

    // Optimistic update
    setAccessMap((prev) => {
      const next = { ...prev, [selectedSiteId]: updated };
      saveAccessCache(next);
      return next;
    });

    try {
      await authFetch(`${API_BASE}/locations/${selectedSiteId}/access`, {
        method: "PUT",
        body: JSON.stringify({ userIds: updated }),
      });
    } catch {
      // Roll back on failure
      setAccessMap((prev) => {
        const next = { ...prev, [selectedSiteId]: current };
        saveAccessCache(next);
        return next;
      });
    }
  }

  if (!canAccessLocationManagement) {
    return (
      <section className="ms-location__page">
        <div className="ms-location__empty-state">
          <h1>Location Management</h1>
          <p>You do not have permission to access location management.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ms-location__page">
      <div className="ms-location__header">
        <div>
          <h1>Location Management</h1>
          <p>Create and manage your service locations, and control which users have access to each site.</p>
        </div>
      </div>

      <div className="ms-location__layout">
        {/* ── Locations list ─────────────────────────────────── */}
        <div className="ms-location__panel">
          <div className="ms-location__panel-head">
            <MapPin size={16} />
            <h2>Locations</h2>
            <span className="ms-location__count">{sites.length}</span>
          </div>

          <div className="ms-location__add-row">
            <input
              type="text"
              className="ms-location__add-input"
              placeholder="New location name&hellip;"
              value={newLocationName}
              onChange={(e) => { setNewLocationName(e.target.value); setAddError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") void handleAddLocation(); }}
            />
            <button type="button" className="ms-location__add-btn" onClick={() => void handleAddLocation()}>
              <Plus size={16} />
              Add
            </button>
          </div>
          {addError ? <p className="ms-location__field-error">{addError}</p> : null}

          <div className="ms-location__list">
            {sites.map((site) => (
              <div
                key={site.id}
                className={`ms-location__item${selectedSiteId === site.id ? " is-selected" : ""}`}
                onClick={() => { setSelectedSiteId(site.id); setEditingId(null); }}
              >
                {editingId === site.id ? (
                  <div className="ms-location__edit-row" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      className="ms-location__edit-input"
                      value={editName}
                      autoFocus
                      onChange={(e) => { setEditName(e.target.value); setEditError(""); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void commitEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button type="button" className="ms-location__save-btn" onClick={() => void commitEdit()}>Save</button>
                    <button type="button" className="ms-location__cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
                    {editError ? <p className="ms-location__field-error">{editError}</p> : null}
                  </div>
                ) : (
                  <>
                    <div className="ms-location__item-icon"><MapPin size={14} /></div>
                    <span className="ms-location__item-name">{site.name}</span>
                    <div className="ms-location__item-actions">
                      <button
                        type="button"
                        className="ms-location__icon-btn"
                        title="Rename location"
                        onClick={(e) => { e.stopPropagation(); startEdit(site); }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        className="ms-location__icon-btn ms-location__icon-btn--danger"
                        title="Delete location"
                        onClick={(e) => { e.stopPropagation(); void handleDelete(site.id); }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {sites.length === 0 ? <p className="ms-location__empty">No locations yet. Add one above.</p> : null}
          </div>
        </div>

        {/* ── User access ────────────────────────────────────── */}
        <div className="ms-location__panel">
          <div className="ms-location__panel-head">
            <Users size={16} />
            <h2>User Access</h2>
            {selectedSite ? (
              <span className="ms-location__panel-site-label">{selectedSite.name}</span>
            ) : null}
          </div>

          {selectedSite ? (
            <>
              <p className="ms-location__access-hint">
                Toggle which users can access <strong>{selectedSite.name}</strong>.
                Users without access will not see data from this location.
              </p>

              {loadingAccess ? (
                <p className="ms-location__empty">Loading access&hellip;</p>
              ) : (
                <div className="ms-location__user-list">
                  {usersWithAccess.length === 0 ? (
                    <p className="ms-location__empty">No users in the system yet.</p>
                  ) : (
                    usersWithAccess.map((u) => (
                      <label key={u.id} className="ms-location__user-row">
                        <div className="ms-location__user-avatar">
                          {(u.username?.slice(0, 2) || "??").toUpperCase()}
                        </div>
                        <div className="ms-location__user-info">
                          <strong>{u.username}</strong>
                          <span>{u.role}</span>
                        </div>
                        <div className="ms-location__toggle-wrap">
                          <input
                            type="checkbox"
                            className="ms-location__toggle"
                            checked={u.hasAccess}
                            onChange={() => void toggleUserAccess(u.id)}
                          />
                          <span className="ms-location__toggle-track" />
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="ms-location__empty">Select a location to manage user access.</p>
          )}
        </div>
      </div>
    </section>
  );
}
