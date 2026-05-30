import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { logoutUser } from '../services/api';
import { AnimatePresence, motion } from 'framer-motion';

export default function TopNavBar() {
  const { isAuthenticated, user, clearAuth } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    }
    clearAuth();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const handleScrollTo = (e, id) => {
    setIsMobileMenuOpen(false);
    if (window.location.pathname !== '/') {
      navigate(`/#${id}`);
      return;
    }
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const NavLinks = ({ mobile }) => {
    const baseClass = mobile 
      ? "block w-full text-left py-3 px-4 font-label-lg text-on-surface-variant hover:bg-surface-variant hover:text-on-surface rounded-lg transition-colors"
      : "font-label-lg text-on-surface-variant dark:text-on-surface-variant hover:text-emerald-light transition-colors duration-300";

    if (isAuthenticated) {
      return (
        <>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/" className={baseClass}>Molecular Search</Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/trials" className={baseClass}>Clinical Trials</Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/checker" className={baseClass}>Interaction Matrix</Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/ai" className={baseClass}>Aushnexa AI</Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/knowledge-graph" className={baseClass}>Knowledge Base</Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/history" className={mobile ? baseClass : "hidden"}>Recent Scans</Link>
        </>
      );
    }
    
    return (
      <>
        <Link onClick={() => setIsMobileMenuOpen(false)} to="/" className={baseClass}>Molecular Search</Link>
        <a href="#clinical-trials" onClick={(e) => handleScrollTo(e, 'clinical-trials')} className={baseClass}>Clinical Trials</a>
        <a href="#interaction-matrix" onClick={(e) => handleScrollTo(e, 'interaction-matrix')} className={baseClass}>Interaction Matrix</a>
        <a href="#aushnexa-ai" onClick={(e) => handleScrollTo(e, 'aushnexa-ai')} className={baseClass}>Aushnexa AI</a>
        <a href="#knowledge-base" onClick={(e) => handleScrollTo(e, 'knowledge-base')} className={baseClass}>Knowledge Base</a>
      </>
    );
  };

  return (
    <>
      <header className="docked full-width top-0 sticky z-50 bg-surface/80 backdrop-blur-3xl dark:bg-surface/80 border-b border-outline-variant/30 shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center w-full px-4 md:px-8 py-3 max-w-container-max mx-auto">
        
        {/* Brand */}
        <Link to="/" className="flex items-center gap-4 group">
          <img 
            alt="Logo" 
            className="h-12 w-12 md:h-14 md:w-14 rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:shadow-primary/20" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDH1RHEm2Z_FwVSKtXM1uGtiw_rUt3Ab7X0BfyGNqucI_c_orOXxpA9JLa686AwutkhkWKuxNbwVKpumInHrRzXexvxZU_7EhVzf-d1ug1M7lRt1gFVZhPuMXbMLFlLe95_-CaDlr4IIw0-Oq57qxEI4sJE0lHF0Ln6nYIxXzNVV-KLt5t-N3fPmoXM-5zGjWJUKzUUc5BRzNjKSnODCSofENWUafUPQT2-hXvX0MuIuvrw_C91OhKPCFTUGoG0faB_DIFP1aNp_zk"
          />
          <div className="flex flex-col">
            <span className="font-headline-sm text-title-md md:text-title-lg font-bold tracking-tight text-on-surface leading-tight">
              Aushnexa
            </span>
            <span className="font-headline-sm text-title-md md:text-title-lg font-bold tracking-tight text-primary leading-tight">
              BioLumina
            </span>
          </div>
        </Link>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden xl:flex items-center gap-6 lg:gap-8">
          <NavLinks mobile={false} />
        </nav>

        {/* Trailing Action */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="hidden xl:flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2 text-on-surface-variant hover:text-emerald-light transition-colors">
                <span className="material-symbols-outlined text-[20px]">account_circle</span>
                <span className="font-technical-sm text-sm truncate max-w-[120px]">{user?.full_name || 'User'}</span>
              </Link>
              <button onClick={handleLogout} className="flex items-center justify-center px-5 py-2 rounded-full border border-outline-variant text-on-surface hover:border-error-red hover:text-error-red transition-all duration-300 font-label-caps text-label-caps group">
                <span className="material-symbols-outlined mr-2 text-[18px] group-hover:text-error-red transition-colors">logout</span>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden xl:flex items-center justify-center px-6 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary/90 shadow-md transition-all duration-300 font-label-lg group">
              <span className="material-symbols-outlined mr-2 text-[18px]">login</span>
              Physician Login
            </Link>
          )}
          
          <button 
            className="xl:hidden text-on-surface p-2 hover:bg-surface-variant rounded-full transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="material-symbols-outlined text-3xl">menu</span>
          </button>
        </div>
      </div>
    </header>

    {/* Mobile Sidebar Overlay */}
    <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-80 h-[100dvh] bg-surface-container-high border-l border-outline-variant/30 shadow-2xl z-50 xl:hidden flex flex-col"
            >
              <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
                <span className="font-headline-sm text-title-lg font-bold text-on-surface">Menu</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                <NavLinks mobile={true} />
              </div>

              <div className="p-4 border-t border-outline-variant/20 flex flex-col gap-3 bg-surface-variant/20">
                {isAuthenticated ? (
                  <>
                    <Link onClick={() => setIsMobileMenuOpen(false)} to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-variant transition-all duration-300">
                      <span className="material-symbols-outlined text-2xl text-primary">account_circle</span>
                      <div className="flex flex-col truncate">
                        <span className="font-technical-sm text-sm text-on-surface">{user?.full_name || 'User'}</span>
                        <span className="text-xs text-outline">{user?.email || 'Physician Account'}</span>
                      </div>
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-outline-variant text-on-surface hover:text-error-red hover:border-error-red transition-all duration-300 font-label-lg"
                    >
                      <span className="material-symbols-outlined">logout</span>
                      Logout
                    </button>
                  </>
                ) : (
                  <Link 
                    onClick={() => setIsMobileMenuOpen(false)}
                    to="/login" 
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 shadow-md transition-all duration-300 font-label-lg"
                  >
                    <span className="material-symbols-outlined">login</span>
                    Physician Login
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
