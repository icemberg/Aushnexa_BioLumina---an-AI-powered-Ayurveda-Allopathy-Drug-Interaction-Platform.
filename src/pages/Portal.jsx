import React from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../hooks/useAuth';
import { useAppStore } from '../store/appStore';

export default function Portal() {
  const { data: profile, isLoading } = useProfile();
  const user = useAppStore(s => s.user);

  return (
    <main className="w-full flex-grow flex flex-col relative px-margin-mobile md:px-margin-desktop py-8" style={{ backgroundColor: '#0f0e11' }}>
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none mix-blend-screen"></div>
      
      <div className="max-w-6xl w-full mx-auto relative z-10 flex flex-col gap-10">
        
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant/30 pb-8">
          <div>
            <h1 className="font-display-lg text-4xl md:text-5xl text-on-surface tracking-tight mb-2">
              Welcome back, <span className="text-primary">{user?.full_name || 'Node Operator'}</span>
            </h1>
            <p className="font-technical-sm text-sm text-on-surface-variant flex items-center gap-3">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              SESSION_ACTIVE // {user?.role} NODE
            </p>
          </div>
          
          {/* Profile Stats Mini-Card */}
          {!isLoading && profile && (
            <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-4 flex gap-6 items-center shadow-lg">
              <div className="flex flex-col">
                <span className="font-technical-sm text-[10px] text-outline uppercase">Total Analysis Queries</span>
                <span className="font-headline-md text-2xl text-on-surface font-semibold">{profile.total_queries}</span>
              </div>
              <div className="w-px h-10 bg-outline-variant/30"></div>
              <div className="flex flex-col">
                <span className="font-technical-sm text-[10px] text-outline uppercase">Status</span>
                <span className="font-technical-sm text-sm text-primary">VERIFIED</span>
              </div>
            </div>
          )}
        </section>

        {/* Matrix Navigation Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <Link to="/checker" className="group bg-surface-container border border-outline-variant/40 rounded-xl p-6 hover:border-primary/50 hover:bg-surface-container-high transition-all shadow-md hover:shadow-primary/10 relative overflow-hidden flex flex-col gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">compare_arrows</span>
            </div>
            <div>
              <h2 className="font-headline-md text-lg text-on-surface mb-1">Interaction Checker</h2>
              <p className="font-body-md text-sm text-on-surface-variant">Analyze drug-herb molecular interference.</p>
            </div>
            <span className="material-symbols-outlined absolute top-6 right-6 text-outline/30 group-hover:text-primary/50 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all">arrow_outward</span>
          </Link>

          <Link to="/knowledge-graph" className="group bg-surface-container border border-outline-variant/40 rounded-xl p-6 hover:border-primary/50 hover:bg-surface-container-high transition-all shadow-md hover:shadow-primary/10 relative overflow-hidden flex flex-col gap-4">
            <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">hub</span>
            </div>
            <div>
              <h2 className="font-headline-md text-lg text-on-surface mb-1">Knowledge Graph</h2>
              <p className="font-body-md text-sm text-on-surface-variant">Explore the Neo4j botanical intelligence matrix.</p>
            </div>
            <span className="material-symbols-outlined absolute top-6 right-6 text-outline/30 group-hover:text-tertiary/50 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all">arrow_outward</span>
          </Link>

          <Link to="/trials" className="group bg-surface-container border border-outline-variant/40 rounded-xl p-6 hover:border-[#18C96A]/50 hover:bg-surface-container-high transition-all shadow-md hover:shadow-[#18C96A]/10 relative overflow-hidden flex flex-col gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#18C96A]/10 flex items-center justify-center text-[#18C96A] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">science</span>
            </div>
            <div>
              <h2 className="font-headline-md text-lg text-on-surface mb-1">Evidence Portal</h2>
              <p className="font-body-md text-sm text-on-surface-variant">Access PubMed & OpenFDA clinical literature.</p>
            </div>
            <span className="material-symbols-outlined absolute top-6 right-6 text-outline/30 group-hover:text-[#18C96A]/50 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all">arrow_outward</span>
          </Link>

          <Link to="/ai" className="group bg-surface-container border border-outline-variant/40 rounded-xl p-6 hover:border-[#0ECFB8]/50 hover:bg-surface-container-high transition-all shadow-md hover:shadow-[#0ECFB8]/10 relative overflow-hidden flex flex-col gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#0ECFB8]/10 flex items-center justify-center text-[#0ECFB8] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">memory</span>
            </div>
            <div>
              <h2 className="font-headline-md text-lg text-on-surface mb-1">AI Assistant</h2>
              <p className="font-body-md text-sm text-on-surface-variant">Query the LLM orchestrator directly.</p>
            </div>
            <span className="material-symbols-outlined absolute top-6 right-6 text-outline/30 group-hover:text-[#0ECFB8]/50 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all">arrow_outward</span>
          </Link>

        </section>

      </div>
    </main>
  );
}
