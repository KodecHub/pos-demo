import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();

  useEffect(() => {
    const lockedPaths = ["/qr-menu", "/staff", "/attendance", "/crm", "/branches"];
    if (!lockedPaths.includes(location.pathname)) {
      sessionStorage.setItem("lastUnlockedRoute", location.pathname || "/");
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
};
