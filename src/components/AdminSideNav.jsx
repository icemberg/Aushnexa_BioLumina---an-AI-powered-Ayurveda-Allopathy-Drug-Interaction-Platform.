import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

export default function AdminSideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAppStore();

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const navItems = [
    { label: 'Data Ingestion Status', icon: 'dashboard', path: '/dashboard' },
    { label: 'Institutional Access Logs', icon: 'history', path: '/admin/logs' },
    { label: 'Return to App', icon: 'arrow_back', path: '/checker' },
  ];

  return (
    <aside 
      className="fixed left-0 top-0 h-[100vh] w-[240px] bg-[#0C1526] z-50 flex flex-col border-r border-[#1C2E47]"
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <img 
          alt="Logo" 
          className="w-10 h-10" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDH1RHEm2Z_FwVSKtXM1uGtiw_rUt3Ab7X0BfyGNqucI_c_orOXxpA9JLa686AwutkhkWKuxNbwVKpumInHrRzXexvxZU_7EhVzf-d1ug1M7lRt1gFVZhPuMXbMLFlLe95_-CaDlr4IIw0-Oq57qxEI4sJE0lHF0Ln6nYIxXzNVV-KLt5t-N3fPmoXM-5zGjWJUKzUUc5BRzNjKSnODCSofENWUafUPQT2-hXvX0MuIuvrw_C91OhKPCFTUGoG0faB_DIFP1aNp_zk"
        />
        <div className="flex flex-col" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          <span className="text-[16px] font-bold leading-tight text-[#EDF2F8]">Aushnexa</span>
          <span className="text-[16px] font-bold leading-tight text-[#0ecfb8]">BioLumina</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-4 mt-4 flex-1">
        {navItems.map(item => (
          <Link 
            key={item.label}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
              location.pathname === item.path
                ? 'text-[#EDF2F8] bg-[#111E33]' 
                : 'text-[#637A94] hover:text-[#EDF2F8] hover:bg-[#111E33]/50'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom Profile */}
      <div className="p-4 border-t border-[#1C2E47] mb-0 mt-auto">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-[#1C2E47] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#EDF2F8] text-[18px]">person</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[14px] text-[#EDF2F8] font-medium whitespace-nowrap">{user?.full_name || "Admin User"}</span>
            <span className="text-[12px] text-[#637A94] truncate">{user?.email || "admin@system.io"}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 rounded border border-[#1C2E47] text-[#637A94] hover:text-[#EDF2F8] hover:border-[#637A94] transition-colors text-[14px] font-medium">
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
