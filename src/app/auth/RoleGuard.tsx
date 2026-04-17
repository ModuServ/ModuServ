import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type Props = {
  allow: boolean;
  children: ReactNode;
};

export default function RoleGuard({ allow, children }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allow) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
