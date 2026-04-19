import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePermissions, defaultPermissionTemplate } from "./PermissionsContext";
import { API_BASE, authFetch } from "../lib/api";
import { useAuth } from "./AuthContext";

export type RoleRecord = {
  name: string;
  kind: "system" | "custom";
};

type RoleRegistryContextType = {
  roles: RoleRecord[];
  roleNames: string[];
  createRole: (roleName: string) => Promise<{ success: boolean; error?: string }>;
  deleteRole: (roleName: string) => Promise<{ success: boolean; error?: string }>;
  hasRole: (roleName: string) => boolean;
};

const DEFAULT_ROLES: RoleRecord[] = [
  { name: "Primary Admin", kind: "system" },
  { name: "Administrator", kind: "system" },
  { name: "Technician", kind: "system" },
  { name: "Sales Assistant", kind: "system" },
  { name: "Receptionist", kind: "system" },
];

const CACHE_KEY = "moduserv:roleRegistry";

function loadCached(): RoleRecord[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) as RoleRecord[];
  } catch { /* ignore */ }
  return DEFAULT_ROLES;
}

function cache(roles: RoleRecord[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(roles));
}

const RoleRegistryContext = createContext<RoleRegistryContextType | undefined>(undefined);

export function RoleRegistryProvider({ children }: { children: ReactNode }) {
  const { ensureRolePermissions } = usePermissions();
  const { user } = useAuth();

  const [roles, setRoles] = useState<RoleRecord[]>(loadCached);

  // Fetch from backend when logged in; poll every 30s so role changes propagate
  useEffect(() => {
    if (!user) return;
    function fetchRoles() {
      authFetch(`${API_BASE}/roles`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data: Array<{ name: string; kind: string }>) => {
          const loaded: RoleRecord[] = data.map((d) => ({
            name: d.name,
            kind: d.kind === "system" ? "system" : "custom",
          }));
          const names = new Set(loaded.map((r) => r.name));
          for (const def of DEFAULT_ROLES) {
            if (!names.has(def.name)) loaded.push(def);
          }
          setRoles(loaded);
          cache(loaded);
        })
        .catch(() => { /* stay on cached */ });
    }
    fetchRoles();
    const poll = setInterval(fetchRoles, 2_000);
    return () => clearInterval(poll);
  }, [user?.id]);

  // Seed any new system roles that were added after localStorage was first written
  useEffect(() => {
    setRoles((prev) => {
      const existing = new Set(prev.map((r) => r.name));
      const missing = DEFAULT_ROLES.filter((r) => !existing.has(r.name));
      if (missing.length === 0) return prev;
      const updated = [...prev, ...missing];
      cache(updated);
      return updated;
    });
  }, []);

  useEffect(() => {
    roles.forEach((role) => ensureRolePermissions(role.name));
  }, [roles, ensureRolePermissions]);

  const roleNames = useMemo(() => roles.map((r) => r.name), [roles]);

  function hasRole(roleName: string) {
    const clean = roleName.trim().toLowerCase();
    return roles.some((r) => r.name.trim().toLowerCase() === clean);
  }

  async function createRole(roleName: string): Promise<{ success: boolean; error?: string }> {
    const clean = roleName.trim();
    if (!clean) return { success: false, error: "Role name is required." };
    if (hasRole(clean)) return { success: false, error: "Role already exists." };

    // Optimistic update
    const newRole: RoleRecord = { name: clean, kind: "custom" };
    setRoles((prev) => { const u = [...prev, newRole]; cache(u); return u; });
    ensureRolePermissions(clean);

    try {
      const res = await authFetch(`${API_BASE}/roles`, {
        method: "POST",
        body: JSON.stringify({ name: clean }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        // Roll back
        setRoles((prev) => { const u = prev.filter((r) => r.name !== clean); cache(u); return u; });
        return { success: false, error: err.error ?? "Failed to create role." };
      }
    } catch {
      // Offline — optimistic update stands
    }

    return { success: true };
  }

  async function deleteRole(roleName: string): Promise<{ success: boolean; error?: string }> {
    const clean = roleName.trim();
    const target = roles.find((r) => r.name === clean);
    if (!target) return { success: false, error: "Role not found." };
    if (target.kind === "system") return { success: false, error: "System roles cannot be deleted." };

    // Optimistic update
    setRoles((prev) => { const u = prev.filter((r) => r.name !== clean); cache(u); return u; });

    try {
      const res = await authFetch(`${API_BASE}/roles/${encodeURIComponent(clean)}`, { method: "DELETE" });
      if (!res.ok) {
        // Roll back
        setRoles((prev) => { const u = [...prev, target]; cache(u); return u; });
        return { success: false, error: "Failed to delete role on server." };
      }
    } catch {
      // Offline — optimistic update stands
    }

    return { success: true };
  }

  const value = useMemo(
    () => ({ roles, roleNames, createRole, deleteRole, hasRole }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roles, roleNames]
  );

  return (
    <RoleRegistryContext.Provider value={value}>
      {children}
    </RoleRegistryContext.Provider>
  );
}

export function useRoleRegistry() {
  const context = useContext(RoleRegistryContext);
  if (!context) throw new Error("useRoleRegistry must be used inside RoleRegistryProvider");
  return context;
}
