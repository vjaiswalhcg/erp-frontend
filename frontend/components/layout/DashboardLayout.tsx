import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
