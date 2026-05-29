import React, { useState } from 'react';
import { useInteractionCheck } from '../hooks/useInteractionCheck';
import { useAppStore } from '../store/appStore';
import { useHistory } from '../hooks/useHistory';
import { formatDate } from '../utils/formatters';
import LanguageSelector from '../components/LanguageSelector';

export default function Checker() {
  const [herb, setHerb] = useState('');
  const [drug, setDrug] = useState('');
  const { selectedLanguage, isAuthenticated } = useAppStore();
  const mutation = useInteractionCheck();
  
  // Fetch recent history if authenticated
  const { data: historyData, isLoading: historyLoading } = useHistory(1, 3);

  const handleScan = () => {
    if (!herb.trim() || !drug.trim()) return;
    mutation.mutate({ items: [herb.trim(), drug.trim()], language: selectedLanguage });
  };

  const restoreScan = (h, d) => {
    if (!h || !d) return;
    setHerb(h);
    setDrug(d);
    mutation.mutate({ items: [h, d], language: selectedLanguage });
  };

  const getRiskStyles = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'alta':
      case 'high':
        return {
          card: 'hover:border-error/30',
          badgeBg: 'bg-error-container',
          badgeText: 'text-on-error-container',
          icon: 'warning',
          iconStyle: { fontVariationSettings: "'FILL' 1" },
          line: 'border-error-red',
          arrowHover: 'group-hover:text-error-red',
          label: 'High Risk',
          summary: 'Critical interaction detected'
        };
      case 'moderada':
      case 'moderate':
        return {
          card: 'hover:border-tertiary-container/30',
          badgeBg: 'bg-tertiary-container/20 border-tertiary-container/30 border',
          badgeText: 'text-tertiary-fixed',
          icon: 'info',
          iconStyle: {},
          line: 'border-tertiary-container',
          arrowHover: 'group-hover:text-tertiary-container',
          label: 'Monitor',
          summary: 'Potential interaction detected'
        };
      case 'baja':
      case 'low':
      case 'seguro':
      case 'safe':
        return {
          card: 'hover:border-primary/30',
          badgeBg: 'bg-surface-variant',
          badgeText: 'text-on-surface-variant',
          icon: 'check_circle',
          iconStyle: {},
          line: 'border-outline-variant',
          arrowHover: 'group-hover:text-primary',
          label: 'Negligible',
          summary: 'No critical pathways overlap'
        };
      default:
        return {
          card: 'hover:border-outline/30',
          badgeBg: 'bg-surface-variant',
          badgeText: 'text-on-surface-variant',
          icon: 'help',
          iconStyle: {},
          line: 'border-outline-variant',
          arrowHover: 'group-hover:text-on-surface',
          label: 'Unknown',
          summary: 'Interaction unknown'
        };
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-surface-container-lowest text-on-surface font-body-md selection:bg-primary/30 selection:text-primary-fixed">
      {/* Ambient Background Texture */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-organic-matrix"></div>

      {/* Main Canvas */}
      <main className="relative z-10 pt-[104px] pb-24 px-gutter max-w-container-max mx-auto flex flex-col gap-12">
        {/* Header Area */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-max mb-2">
              <span className="material-symbols-outlined text-primary text-sm">analytics</span>
              <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase">Real-Time Diagnostic</span>
            </div>
            <h1 className="font-display-lg text-display-lg text-on-surface">
              Interaction <span className="text-primary-fixed-dim">Checker</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              Analyze complex polypharmacy interactions bridging traditional Ayurvedic compounds and modern Allopathic interventions.
            </p>
          </div>
          <div className="shrink-0 mb-2">
            <LanguageSelector />
          </div>
        </header>

        {/* Central Diagnostic Input Card (Hero Feature) */}
        <section className="glass-panel rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group">
          {/* Decorative Glow within card */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-8 items-center">
            {/* Input A: Ayurvedic */}
            <div className="flex flex-col gap-4">
              <label className="font-technical-sm text-technical-sm text-tertiary-container flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">spa</span>
                Target Compound A (Botanical)
              </label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline">search</span>
                </div>
                <input 
                  className="w-full bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-high border border-outline-variant/30 focus:border-tertiary-container text-on-surface font-body-lg text-body-lg rounded-xl pl-12 pr-4 py-4 transition-all outline-none shadow-inner" 
                  placeholder="Enter herb or compound..." 
                  type="text" 
                  value={herb}
                  onChange={(e) => setHerb(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-technical-sm text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded">Withania somnifera</div>
              </div>
            </div>

            {/* Nexus Icon */}
            <div className="flex justify-center items-center py-4 md:py-0 relative">
              <div className="absolute inset-0 flex items-center justify-center pulse-ring">
                <div className="w-12 h-12 bg-primary/20 rounded-full"></div>
              </div>
              <button className="w-14 h-14 rounded-full bg-surface-container-highest border border-outline-variant/40 flex items-center justify-center text-primary-fixed hover:bg-primary hover:text-on-primary hover:scale-105 transition-all shadow-lg relative z-10 group/btn">
                <span className="material-symbols-outlined text-2xl group-hover/btn:rotate-180 transition-transform duration-500">compare_arrows</span>
              </button>
            </div>

            {/* Input B: Allopathic */}
            <div className="flex flex-col gap-4">
              <label className="font-technical-sm text-technical-sm text-secondary-fixed flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">medication</span>
                Target Compound B (Synthetic)
              </label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline">search</span>
                </div>
                <input 
                  className="w-full bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-high border border-outline-variant/30 focus:border-secondary-fixed text-on-surface font-body-lg text-body-lg rounded-xl pl-12 pr-4 py-4 transition-all outline-none shadow-inner" 
                  placeholder="Enter drug or molecule..." 
                  type="text" 
                  value={drug}
                  onChange={(e) => setDrug(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-technical-sm text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded">C4H11N5</div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {mutation.isError && (
            <div className="mt-6 p-4 rounded-xl bg-error-container/20 border border-error-red/30 text-error-red font-technical-sm text-technical-sm flex items-center gap-2 relative z-10">
              <span className="material-symbols-outlined text-sm">error</span>
              {mutation.error?.response?.data?.message || mutation.error?.response?.data?.detail || 'Scan failed. Backend may be offline. Please try again.'}
            </div>
          )}

          {/* Action Area */}
          <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-outline-variant/20 pt-8 relative z-10">
            <div className="flex items-center gap-3 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-primary text-base">info</span>
              Database updated: 2 hours ago. Cross-referencing 14M+ clinical nodes.
            </div>
            <button 
              onClick={handleScan}
              disabled={mutation.isPending}
              className="w-full md:w-auto bg-primary text-on-primary font-technical-sm text-technical-sm px-10 py-4 rounded-xl flex items-center justify-center gap-3 hover:scale-[1.02] hover:bg-primary-fixed transition-all shadow-[0_0_20px_rgba(207,188,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {mutation.isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  Scanning Matrix...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
                  Initialize Scan Matrix
                </>
              )}
            </button>
          </div>
        </section>

        {/* Recent Scans Bento Grid */}
        <section className="flex flex-col gap-6">
          <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary-container">history</span>
            Recent Scans
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!isAuthenticated ? (
              <div className="col-span-full py-12 text-center text-on-surface-variant bg-surface-container rounded-2xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-4xl mb-3 opacity-50">lock</span>
                <p>Please log in to view your scan history.</p>
              </div>
            ) : historyLoading ? (
              <div className="col-span-full py-12 text-center text-on-surface-variant bg-surface-container rounded-2xl border border-outline-variant/10">
                <span className="material-symbols-outlined animate-spin text-4xl mb-3">progress_activity</span>
                <p>Loading recent scans...</p>
              </div>
            ) : historyData?.items?.length === 0 ? (
              <div className="col-span-full py-12 text-center text-on-surface-variant bg-surface-container rounded-2xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-4xl mb-3 opacity-50">search</span>
                <p>No recent scans found. Start by entering a compound above.</p>
              </div>
            ) : (
              historyData?.items?.map((scan) => {
                const styles = getRiskStyles(scan.overall_risk);
                const herbName = scan.items[0] || 'Unknown';
                const drugName = scan.items[1] || 'Unknown';
                
                return (
                  <div 
                    key={scan.id} 
                    onClick={() => restoreScan(herbName, drugName)}
                    className={`bg-surface-container rounded-2xl p-6 border border-outline-variant/10 transition-colors cursor-pointer group flex flex-col h-full ${styles.card}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-label-caps text-label-caps uppercase ${styles.badgeBg} ${styles.badgeText}`}>
                        <span className="material-symbols-outlined text-sm" style={styles.iconStyle}>{styles.icon}</span>
                        {styles.label}
                      </div>
                      <span className="text-on-surface-variant text-xs">{formatDate(scan.created_at)}</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-on-surface font-technical-sm">{herbName}</span>
                      </div>
                      <div className={`pl-2 border-l-2 my-2 ml-4 h-4 opacity-50 ${styles.line}`}></div>
                      <div className="flex items-center gap-3">
                        <span className="text-on-surface font-technical-sm">{drugName}</span>
                      </div>
                    </div>
                    
                    <div className={`pt-4 border-t border-outline-variant/10 mt-auto flex items-center text-sm text-on-surface-variant transition-colors ${styles.arrowHover}`}>
                      {styles.summary} <span className="material-symbols-outlined ml-auto text-base">arrow_forward</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
