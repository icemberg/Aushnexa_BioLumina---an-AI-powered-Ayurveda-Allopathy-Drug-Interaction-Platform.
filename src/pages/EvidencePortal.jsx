import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEvidenceData } from '../hooks/useEvidenceData'
import { BeakerIcon, DocumentTextIcon, ChartBarIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
      active
        ? 'bg-primary text-on-primary shadow-lg'
        : 'bg-dark/40 text-gray-400 hover:bg-dark/60 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </button>
)

export default function EvidencePortal() {
  const [activeTab, setActiveTab] = useState('trials')
  const { evidenceData, isLoadingEvidence, evidenceError, herbProfile, herbCanonical, drugCanonical } = useEvidenceData()

  const tabs = [
    { id: 'trials', label: 'Clinical Trials', icon: BeakerIcon },
    { id: 'papers', label: 'Published Research', icon: DocumentTextIcon },
    { id: 'summary', label: 'Evidence Summary', icon: ChartBarIcon },
  ]

  const formatSourceBadge = (source) => {
    switch (source) {
      case 'CTRI India':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">🇮🇳 CTRI India</span>
      case 'ClinicalTrials.gov':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">🇺🇸 CT.gov</span>
      case 'PubMed':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">📚 PubMed</span>
      case 'Semantic Scholar':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">🧠 Semantic Scholar</span>
      case 'OpenAlex':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">🌐 OpenAlex</span>
      case 'WHO ICTRP (India)':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">🇮🇳 ICTRP India</span>
      case 'WHO ICTRP (China)':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-500/20 text-red-400 border border-red-500/30">🇨🇳 ICTRP China</span>
      default:
        if (source && source.startsWith('WHO ICTRP')) {
          return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-400/20 text-blue-300 border border-blue-400/30">🏥 {source}</span>
        }
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">{source}</span>
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-darkBase text-white font-sans pt-20">
      
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-primary/20 to-darkBase border-b border-white/10 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Evidence Portal
            </h1>
            <p className="mt-2 text-gray-400 text-lg">
              Live aggregation of global registries and literature for{' '}
              <span className="text-primary font-semibold">{herbCanonical || 'Selected Herb'}</span> 
              {drugCanonical && <span> + <span className="text-red-400 font-semibold">{drugCanonical}</span></span>}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar: Heritage Mapping */}
        <div className="col-span-1 space-y-6">
          <div className="bg-dark/40 border border-white/10 rounded-xl p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
              <InformationCircleIcon className="w-6 h-6 mr-2 text-primary" />
              Heritage Mapping
            </h3>
            
            {herbProfile ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Botanical Name</p>
                  <p className="text-md text-white font-medium italic">{herbProfile.scientific_name || herbCanonical}</p>
                </div>

                {herbProfile.description && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Description</p>
                    <div className="bg-dark/60 p-3 rounded-lg border border-white/5 text-sm text-gray-300 leading-relaxed">
                      {herbProfile.description}
                    </div>
                  </div>
                )}

                {herbProfile.ayurvedic_properties && typeof herbProfile.ayurvedic_properties === 'object' && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Ayurvedic Properties</p>
                    <div className="bg-dark/60 p-3 rounded-lg border border-white/5 space-y-2">
                      {Object.entries(herbProfile.ayurvedic_properties).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-gray-400 capitalize">{key}</span>
                          <span className="text-white font-medium text-right ml-2">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {herbProfile.aliases && herbProfile.aliases.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Also Known As</p>
                    <div className="flex flex-wrap gap-2">
                      {herbProfile.aliases.map(a => (
                        <span key={a} className="px-2 py-1 bg-white/5 text-gray-300 text-xs rounded-full border border-white/10">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {herbProfile.compounds && herbProfile.compounds.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Active Compounds</p>
                    <div className="flex flex-wrap gap-2">
                      {herbProfile.compounds.map(c => (
                        <span key={c} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">Select a herb in the Interaction Matrix to view its heritage profile.</p>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-span-1 lg:col-span-3">
          
          {/* Tabs */}
          <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <TabButton 
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                icon={tab.icon}
                label={tab.label}
              />
            ))}
          </div>

          {/* Content */}
          <div className="bg-dark/20 border border-white/5 rounded-2xl p-6 min-h-[500px]">
            {isLoadingEvidence ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 mt-20">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="text-gray-400 animate-pulse">Aggregating evidence from 7 global sources...</p>
              </div>
            ) : evidenceError ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 mt-20 text-red-400">
                <p>Failed to load evidence. Please try again later.</p>
              </div>
            ) : !evidenceData ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 mt-20 text-gray-500">
                <p>No active interaction query found. Please check an interaction first.</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'trials' && (
                  <motion.div
                    key="trials"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold">Clinical Trials ({evidenceData.total_trials})</h2>
                    </div>
                    {evidenceData.trials.length === 0 ? (
                      <p className="text-gray-400">No trials found for this combination.</p>
                    ) : (
                      evidenceData.trials.map((trial, idx) => (
                        <div key={idx} className="bg-dark/40 border border-white/10 rounded-xl p-5 hover:bg-dark/60 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-medium text-white pr-4">
                              {trial.url ? (
                                <a href={trial.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline decoration-primary/30 underline-offset-4">
                                  {trial.title}
                                </a>
                              ) : (
                                trial.title
                              )}
                            </h3>
                            <div className="flex-shrink-0">
                              {formatSourceBadge(trial.source_registry)}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                            <div>
                              <p className="text-gray-500">Status</p>
                              <p className={`font-semibold ${trial.status.toUpperCase().includes('RECRUITING') ? 'text-green-400' : 'text-gray-300'}`}>
                                {trial.status || 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Phase</p>
                              <p className="text-gray-300">{trial.phase || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-500">Conditions</p>
                              <p className="text-gray-300 truncate">{trial.condition || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === 'papers' && (
                  <motion.div
                    key="papers"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                     <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold">Published Research ({evidenceData.total_papers})</h2>
                    </div>
                    {evidenceData.papers.length === 0 ? (
                      <p className="text-gray-400">No papers found for this combination.</p>
                    ) : (
                      evidenceData.papers.map((paper, idx) => (
                        <div key={idx} className="bg-dark/40 border border-white/10 rounded-xl p-5 hover:bg-dark/60 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-medium text-white pr-4">
                              {paper.url ? (
                                <a href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline decoration-primary/30 underline-offset-4">
                                  {paper.title}
                                </a>
                              ) : (
                                paper.title
                              )}
                            </h3>
                            <div className="flex-shrink-0 flex flex-col items-end gap-2">
                              {formatSourceBadge(paper.source_registry)}
                              {paper.citation_count > 0 && (
                                <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center">
                                  <ChartBarIcon className="w-3 h-3 mr-1" />
                                  {paper.citation_count} Citations
                                </span>
                              )}
                              {paper.is_oa && paper.url && (
                                <a href={paper.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs font-semibold rounded bg-green-500/20 text-green-400 border border-green-500/30 flex items-center hover:bg-green-500/30 transition-colors">
                                  Free PDF (OA)
                                </a>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-primary/80 mt-1">{paper.authors}</p>
                          <div className="flex gap-4 mt-3 text-sm text-gray-400">
                            <span><strong className="text-gray-300">Journal:</strong> {paper.journal || 'Unknown'}</span>
                            <span><strong className="text-gray-300">Year:</strong> {paper.year || 'Unknown'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === 'summary' && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <ChartBarIcon className="w-24 h-24 text-primary/20 mb-6" />
                    <h2 className="text-2xl font-semibold mb-2">Evidence Synthesis</h2>
                    <p className="text-gray-400 max-w-lg text-center">
                      We found {evidenceData.total_trials} clinical trials and {evidenceData.total_papers} published papers discussing this combination. 
                    </p>

                    {evidenceData.ai_summary && (
                      <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-6 w-full max-w-2xl text-left shadow-lg">
                        <h4 className="text-lg font-medium mb-3 flex items-center gap-2 text-primary">
                          <span className="material-symbols-outlined">auto_awesome</span>
                          AI Clinical Summary
                        </h4>
                        <p className="text-gray-300 leading-relaxed text-body-md">
                          {evidenceData.ai_summary}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 bg-dark/40 border border-white/10 rounded-xl p-6 w-full max-w-2xl">
                      <h4 className="text-lg font-medium mb-4">Relevance Breakdown</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">High Relevance (Direct Interaction)</span>
                            <span className="text-primary font-bold">
                              {evidenceData.trials.filter(t => t.relevance_score >= 2).length + evidenceData.papers.filter(p => p.relevance_score >= 2).length}
                            </span>
                          </div>
                          <div className="w-full bg-dark rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: '35%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">Medium Relevance (Individual Mentions)</span>
                            <span className="text-yellow-400 font-bold">
                              {evidenceData.trials.filter(t => t.relevance_score == 1).length + evidenceData.papers.filter(p => p.relevance_score == 1).length}
                            </span>
                          </div>
                          <div className="w-full bg-dark rounded-full h-2">
                            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
