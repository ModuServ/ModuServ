import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type ModuServRole = string;

type RoleContextType = {
  roles: ModuServRole[];
  selectedRole: ModuServRole;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { users, user } = useAuth();

  const roles = useMemo(() => {
    const unique = Array.from(
      new Set(
        (users || [])
          .filter((u) => u.status === "Active")
          .map((u) => (u.role || "").trim())
          .filter(Boolean)
      )
    );

    return unique.length > 0 ? unique : ["Administrator"];
  }, [users]);

  const selectedRole = user?.role || "Administrator";

  const value = useMemo(
    () => ({
      roles,
      selectedRole,
    }),
    [roles, selectedRole]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used inside RoleProvider");
  }
  return context;
}

