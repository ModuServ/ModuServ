import type { ReactNode } from "react";
import { useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { TopNav } from "./TopNav";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (isLoginPage) {
    return <main className="login-shell">{children}</main>;
  }

  return (
    <div className="app-shell app-shell--fixed">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="ms-sidebar-overlay" onClick={closeSidebar} />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="app-main app-main--fixed">
        <TopNav onMenuToggle={toggleSidebar} />
        <main className="app-content app-content--scrollable">{children}</main>
      </div>
    </div>
  );
}
