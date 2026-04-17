import { Navigate } from "react-router-dom";
import { useAuth, type UserRole } from "../../context/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
};

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

