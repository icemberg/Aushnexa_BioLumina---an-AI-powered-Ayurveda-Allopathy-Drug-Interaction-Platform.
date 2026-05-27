import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

export default function SideNavBar() {
  const { isAuthenticated, user, clearAuth } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const NavItem = ({ to, icon, label, onClick }) => {
    const isActive = location.pathname === to;
    
    if (onClick) {
      return (
        <a 
          href={`#${to.replace('/', '')}`} 
          onClick={onClick} 
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-on-surface-variant hover:bg-surface-variant hover:text-on-surface font-label-lg group"
        >
          <span className="material-symbols-outlined text-xl group-hover:text-primary transition-colors">{icon}</span>
          <span>{label}</span>
        </a>
      );
    }

    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-label-lg group ${
          isActive 
            ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
            : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
        }`}
      >
        <span className={`material-symbols-outlined text-xl ${isActive ? 'text-primary' : 'group-hover:text-primary'} transition-colors`}>{icon}</span>
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-72 h-screen flex flex-col bg-surface/40 backdrop-blur-3xl border-r border-outline-variant/30 shadow-2xl transition-all duration-300 flex-shrink-0 z-50">
      
      {/* Brand Section */}
      <div className="p-6 pb-8 border-b border-outline-variant/20 flex flex-col items-center justify-center text-center">
        <Link to="/" className="flex flex-col items-center gap-4 group">
          <img 
            alt="Logo" 
            className="h-16 w-16 rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:shadow-primary/20" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDH1RHEm2Z_FwVSKtXM1uGtiw_rUt3Ab7X0BfyGNqucI_c_orOXxpA9JLa686AwutkhkWKuxNbwVKpumInHrRzXexvxZU_7EhVzf-d1ug1M7lRt1gFVZhPuMXbMLFlLe95_-CaDlr4IIw0-Oq57qxEI4sJE0lHF0Ln6nYIxXzNVV-KLt5t-N3fPmoXM-5zGjWJUKzUUc5BRzNjKSnODCSofENWUafUPQT2-hXvX0MuIuvrw_C91OhKPCFTUGoG0faB_DIFP1aNp_zk"
          />
          <div className="flex flex-col">
            <span className="font-headline-sm text-title-lg font-bold tracking-tight text-on-surface leading-tight">
              Aushnexa
            </span>
            <span className="font-headline-sm text-title-lg font-bold tracking-tight text-primary leading-tight">
              BioLumina
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 scrollbar-thin">
        <NavItem to="/" icon="search" label="Molecular Search" />
        
        {isAuthenticated ? (
          <>
            <NavItem to="/trials" icon="science" label="Clinical Trials" />
            <NavItem to="/checker" icon="grid_view" label="Interaction Matrix" />
            <NavItem to="/ai" icon="smart_toy" label="Aushnexa AI" />
            <NavItem to="/knowledge-graph" icon="account_tree" label="Knowledge Base" />
            <NavItem to="/history" icon="history" label="Recent Scans" />
          </>
        ) : (
          <>
            <div className="mt-4 mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-outline">Public Tools</div>
            <NavItem to="/checker" icon="grid_view" label="Interaction Matrix" />
            <NavItem to="/ai" icon="smart_toy" label="Aushnexa AI" />
          </>
        )}
      </nav>

      {/* Footer / User Actions */}
      <div className="p-4 border-t border-outline-variant/20 flex flex-col gap-3 bg-surface-variant/30">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-all duration-300">
              <span className="material-symbols-outlined text-2xl text-primary">account_circle</span>
              <div className="flex flex-col truncate">
                <span className="font-technical-sm text-sm truncate w-full text-on-surface">{user?.full_name || 'User'}</span>
                <span className="text-xs text-outline truncate w-full">{user?.email || 'Physician Account'}</span>
              </div>
            </Link>
            <button 
              onClick={handleLogout} 
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-outline-variant text-on-surface hover:border-error-red hover:text-error-red hover:bg-error-container/10 transition-all duration-300 font-label-md group"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:text-error-red transition-colors">logout</span>
              Logout
            </button>
          </>
        ) : (
          <Link 
            to="/login" 
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 shadow-md transition-all duration-300 font-label-lg group"
          >
            <span className="material-symbols-outlined text-[20px]">login</span>
            Physician Login
          </Link>
        )}
      </div>
    </aside>
  );
}
