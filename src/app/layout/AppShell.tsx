import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { TopNav } from "./TopNav";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  if (isLoginPage) {
    return <main className="login-shell">{children}</main>;
  }

  return (
    <div className="app-shell app-shell--fixed">
      <Sidebar />
      <div className="app-main app-main--fixed">
        <TopNav />
        <main className="app-content app-content--scrollable">{children}</main>
      </div>
    </div>
  );
}
