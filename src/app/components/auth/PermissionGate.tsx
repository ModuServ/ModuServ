import type { ReactNode } from "react";

type Props = {
  allow: boolean;
  children: ReactNode;
  fallback?: ReactNode;
};

export default function PermissionGate({ allow, children, fallback = null }: Props) {
  return <>{allow ? children : fallback}</>;
}
