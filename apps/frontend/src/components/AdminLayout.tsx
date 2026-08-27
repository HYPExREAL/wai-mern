import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  onReportClick?: (lat: number, lng: number) => void;
}

export default function AdminLayout({ title, subtitle, children, onReportClick }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="flex h-svh w-full bg-gray-100 overflow-hidden relative">

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden animate-backdrop-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
        fixed inset-y-0 left-0 z-40 h-full transition-all duration-300 ease-in-out overflow-hidden shadow-2xl md:shadow-none
        ${sidebarOpen ? 'w-[85vw] md:w-[380px] translate-x-0 bg-white' : 'w-[85vw] md:w-[72px] -translate-x-full md:translate-x-0 bg-white md:border-r border-gray-200'}
        md:relative
      `}
      >
        <AdminSidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          onReportClick={onReportClick}
        />
      </div>

      <main className="flex-1 flex flex-col p-4 md:p-10 z-10 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-start md:items-center mb-6 md:mb-8 max-w-6xl w-full mx-auto">
          <div className="flex items-start md:items-center gap-3 md:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-3 bg-white rounded-xl shadow-xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all shrink-0 mt-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <div className="flex flex-col gap-0.5 md:gap-1">
              <h1 className="text-[#005a9e] text-xl md:text-4xl font-black tracking-tight">{title}</h1>
              <p className="text-xs md:text-sm text-gray-500 font-medium">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="group flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-3 bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all font-bold text-xs md:text-sm uppercase tracking-wider shrink-0"
          >
            <span className="hidden sm:inline">Logout</span>
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {children}
      </main>
    </div>
  );
}
