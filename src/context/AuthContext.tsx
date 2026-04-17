import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE, authFetch, setToken, clearToken } from "../lib/api";
import { hashPassword, verifyPassword, isHashed } from "../lib/passwordUtils";

export type AuthUser = {
  id: string;
  username: string;
  password: string;
  role: string;
  createdAt: string;
  status: "Active" | "Disabled";
  avatar?: string;
};

export type SessionUser = {
  id: string;
  username: string;
  role: string;
  avatar?: string;
};

export const PRIMARY_ADMIN_ID = "USR-001";

type AuthContextType = {
  user: SessionUser | null;
  users: AuthUser[];
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchSessionToUser: (username: string, password: string, targetRole: string) => Promise<{ success: boolean; error?: string }>;
  addUser: (input: Omit<AuthUser, "id" | "createdAt" | "status">) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, updates: Partial<Pick<AuthUser, "username" | "password" | "role" | "status" | "avatar">>) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: { username?: string; currentPassword?: string; newPassword?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: string) => { success: boolean; error?: string };
};

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_USERS: AuthUser[] = [
  {
    id: "USR-001",
    username: "admin",
    password: "admin123",
    role: "Primary Admin",
    createdAt: new Date().toLocaleString(),
    status: "Active",
  },
];

function toSessionUser(user: AuthUser): SessionUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    avatar: user.avatar,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [users, setUsers] = useState<AuthUser[]>(() => {
    const stored = localStorage.getItem("moduserv:users");

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser[];
        // Normalise primary admin — fix stale id/role from older builds
        return parsed.map((u) =>
          u.id === PRIMARY_ADMIN_ID || u.username === "admin"
            ? { ...u, id: PRIMARY_ADMIN_ID, role: "Primary Admin", status: "Active" }
            : u
        );
      } catch {
        return DEFAULT_USERS;
      }
    }

    return DEFAULT_USERS;
  });

  // Lock primary admin fields
  useEffect(() => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === PRIMARY_ADMIN_ID
          ? { ...u, role: "Primary Admin", status: "Active" }
          : u
      )
    );
  }, []);

  // Migrate plaintext passwords to PBKDF2 on first load
  useEffect(() => {
    async function migratePasswords() {
      const needsMigration = users.some((u) => !isHashed(u.password));
      if (!needsMigration) return;

      const migrated = await Promise.all(
        users.map(async (u) => {
          if (isHashed(u.password)) return u;
          return { ...u, password: await hashPassword(u.password) };
        })
      );

      setUsers(migrated);
    }

    migratePasswords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist users to localStorage
  useEffect(() => {
    localStorage.setItem("moduserv:users", JSON.stringify(users));
  }, [users]);

  // Background sync — pull users from backend after login
  useEffect(() => {
    if (!user) return;
    async function syncUsers() {
      try {
        const res = await authFetch(`${API_BASE}/users`);
        if (!res.ok) return;
        const remote = await res.json() as Array<{ id: string; username: string; role: string; status: string; createdAt: string }>;
        setUsers((prev) =>
          remote.map((ru) => {
            // Match by ID first, fall back to username — guards against ID format drift
            const local = prev.find((u) => u.id === ru.id)
              ?? prev.find((u) => u.username === ru.username);
            // Preserve local password hash and avatar — backend doesn't expose them
            return {
              id: ru.id,
              username: ru.username,
              password: local?.password ?? "",
              role: ru.role,
              status: (ru.status as AuthUser["status"]) || "Active",
              createdAt: ru.createdAt,
              avatar: local?.avatar,
            };
          })
        );
      } catch { /* backend offline */ }
    }
    syncUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Restore session from sessionStorage — clears when browser/tab is closed
  useEffect(() => {
    const stored = sessionStorage.getItem("moduserv:user");

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SessionUser;
        const live = users.find((u) => u.id === parsed.id || u.username === parsed.username);
        const refreshed = live ? toSessionUser(live) : parsed;
        sessionStorage.setItem("moduserv:user", JSON.stringify(refreshed));
        setUser(refreshed);
      } catch {
        sessionStorage.removeItem("moduserv:user");
        setUser(null);
      }
    }

    window.dispatchEvent(new CustomEvent("moduserv:ready"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(username: string, password: string) {
    await new Promise((res) => setTimeout(res, 150));

    const candidate = users.find(
      (u) => u.username === username && u.status === "Active"
    );

    if (!candidate) {
      return { success: false, error: "Invalid credentials" };
    }

    const ok = await verifyPassword(password, candidate.password);
    if (!ok) {
      return { success: false, error: "Invalid credentials" };
    }

    const session = toSessionUser(candidate);
    sessionStorage.setItem("moduserv:user", JSON.stringify(session));
    localStorage.setItem("moduserv:returningUser", candidate.username);
    setUser(session);

    // Acquire JWT from backend (non-blocking — app works offline without it).
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json() as { token?: string };
        if (data.token) {
          setToken(data.token);
        }
      }
    } catch {
      // Backend offline — continue in local-only mode without JWT.
    }

    return { success: true };
  }

  async function switchSessionToUser(username: string, password: string, targetRole: string) {
    const candidate = users.find(
      (u) => u.username === username && u.role === targetRole && u.status === "Active"
    );

    if (!candidate) {
      return { success: false, error: "Invalid credentials." };
    }

    const ok = await verifyPassword(password, candidate.password);
    if (!ok) {
      return { success: false, error: "Invalid credentials." };
    }

    const session = toSessionUser(candidate);
    sessionStorage.setItem("moduserv:user", JSON.stringify(session));
    setUser(session);

    return { success: true };
  }

  function logout() {
    sessionStorage.removeItem("moduserv:user");
    clearToken();
    setUser(null);
    window.location.href = "/login";
  }

  async function addUser(input: Omit<AuthUser, "id" | "createdAt" | "status">) {
    const cleanUsername = input.username.trim();
    const cleanPassword = input.password.trim();
    const cleanRole = input.role.trim();

    if (!cleanUsername || !cleanPassword || !cleanRole) {
      return { success: false, error: "All fields are required." };
    }

    // Try backend first
    try {
      const res = await authFetch(`${API_BASE}/users`, {
        method: "POST",
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword, role: cleanRole }),
      });
      if (res.ok) {
        const data = await res.json() as { user: { id: string; username: string; role: string; status: string; createdAt: string } };
        const nextUser: AuthUser = {
          id: data.user.id,
          username: data.user.username,
          password: await hashPassword(cleanPassword), // keep local copy hashed
          role: data.user.role,
          createdAt: data.user.createdAt,
          status: (data.user.status as AuthUser["status"]) || "Active",
        };
        setUsers((prev) => [...prev, nextUser]);
        return { success: true };
      }
      const err = await res.json() as { error?: string };
      return { success: false, error: err.error || "Failed to create user." };
    } catch {
      // Backend offline — create locally
    }

    if (users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      return { success: false, error: "Username already exists." };
    }
    const hashedPassword = await hashPassword(cleanPassword);
    const nextUser: AuthUser = {
      id: `USR-${String(users.length + 1).padStart(3, "0")}`,
      username: cleanUsername,
      password: hashedPassword,
      role: cleanRole,
      createdAt: new Date().toLocaleString(),
      status: "Active",
    };
    setUsers((prev) => [...prev, nextUser]);
    return { success: true };
  }

  async function updateUser(id: string, updates: Partial<Pick<AuthUser, "username" | "password" | "role" | "status" | "avatar">>) {
    const existing = users.find((u) => u.id === id);

    if (!existing) {
      return { success: false, error: "User not found." };
    }

    if (id === PRIMARY_ADMIN_ID) {
      if (updates.status && updates.status !== "Active") {
        return { success: false, error: "The primary administrator cannot be disabled." };
      }
      if (updates.role && updates.role !== "Primary Admin") {
        return { success: false, error: "The primary administrator role cannot be changed." };
      }
    }

    // Hash any plaintext password before persisting locally
    const finalUpdates = { ...updates };
    if (updates.password && !isHashed(updates.password)) {
      finalUpdates.password = await hashPassword(updates.password);
    }

    // Sync to backend (best-effort, non-blocking for avatar-only updates)
    if (updates.username || updates.role || updates.status || updates.password) {
      try {
        const payload: Record<string, string> = {
          username: updates.username ?? existing.username,
          role: updates.role ?? existing.role,
          status: updates.status ?? existing.status,
        };
        if (updates.password && !isHashed(updates.password)) {
          payload.password = updates.password; // send plaintext — backend will bcrypt
        }
        await authFetch(`${API_BASE}/users/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } catch { /* backend offline — update locally only */ }
    }

    let nextSessionUser: SessionUser | null = null;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const updated = {
          ...u,
          ...finalUpdates,
          ...(u.id === PRIMARY_ADMIN_ID ? { role: "Primary Admin", status: "Active" } : {}),
        };
        if (user && u.id === user.id) {
          nextSessionUser = toSessionUser(updated);
        }
        return updated;
      })
    );

    if (nextSessionUser) {
      sessionStorage.setItem("moduserv:user", JSON.stringify(nextSessionUser));
      setUser(nextSessionUser);
    }

    return { success: true };
  }

  async function updateProfile(updates: { username?: string; currentPassword?: string; newPassword?: string; avatar?: string }) {
    if (!user) return { success: false, error: "Not logged in." };

    const existing = users.find((u) => u.id === user.id);
    if (!existing) return { success: false, error: "User not found." };

    if (updates.newPassword) {
      if (!updates.currentPassword) {
        return { success: false, error: "Current password is incorrect." };
      }

      const currentOk = await verifyPassword(updates.currentPassword, existing.password);
      if (!currentOk) {
        return { success: false, error: "Current password is incorrect." };
      }

      if (updates.newPassword.trim().length < 3) {
        return { success: false, error: "New password must be at least 3 characters." };
      }
    }

    if (updates.username !== undefined) {
      const clean = updates.username.trim();
      if (!clean) return { success: false, error: "Username cannot be empty." };
      if (users.some((u) => u.id !== user.id && u.username.toLowerCase() === clean.toLowerCase())) {
        return { success: false, error: "That username is already taken." };
      }
    }

    return updateUser(user.id, {
      ...(updates.username !== undefined ? { username: updates.username.trim() } : {}),
      ...(updates.newPassword ? { password: updates.newPassword } : {}),
      ...(updates.avatar !== undefined ? { avatar: updates.avatar } : {}),
    });
  }

  function deleteUser(id: string) {
    if (id === PRIMARY_ADMIN_ID) {
      return { success: false, error: "The main administrator cannot be deleted." };
    }

    // Fire-and-forget backend delete
    authFetch(`${API_BASE}/users/${id}`, { method: "DELETE" }).catch(() => {});

    const deletingCurrentUser = user?.id === id;
    setUsers((prev) => prev.filter((u) => u.id !== id));

    if (deletingCurrentUser) {
      localStorage.removeItem("moduserv:user");
      setUser(null);
      window.location.href = "/login";
    }

    return { success: true };
  }

  const value = useMemo(
    () => ({
      user,
      users,
      login,
      logout,
      switchSessionToUser,
      addUser,
      updateUser,
      updateProfile,
      deleteUser,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, users]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return ctx;
}
