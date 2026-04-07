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
    <div className="flex h-svh min-h-0 w-full overflow-hidden bg-background">
      <Sidebar />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};
