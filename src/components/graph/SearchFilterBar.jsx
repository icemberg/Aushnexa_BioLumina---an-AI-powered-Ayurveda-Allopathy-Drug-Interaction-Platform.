import React, { useState, useEffect } from 'react';
import { searchKnowledge } from '../../services/api';

export default function SearchFilterBar({ 
  filters, 
  setFilters, 
  evidenceMode, 
  setEvidenceMode,
  onNodeSelect 
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      searchKnowledge(query)
        .then(data => setResults(data))
        .catch(err => console.error(err))
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const toggleFilter = (type) => {
    setFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSelect = (nodeId) => {
    onNodeSelect(nodeId);
    setQuery('');
    setResults([]);
  };

  const filterTypes = [
    { id: 'Phytochemical', label: 'Phytochemicals' },
    { id: 'Drug', label: 'Drugs' },
    { id: 'Mechanism', label: 'Mechanisms' },
    { id: 'BiologicalTarget', label: 'Targets' }
  ];

  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-2xl flex flex-col gap-3">
      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center bg-surface-container/90 backdrop-blur-xl border border-outline-variant/50 rounded-full px-4 py-2 shadow-lg">
          <span className="material-symbols-outlined text-on-surface-variant mr-3">search</span>
          <input 
            type="text" 
            placeholder="Search compounds, drugs, or targets..."
            className="bg-transparent border-none outline-none text-on-surface flex-1 font-body-lg text-body-lg placeholder:text-on-surface-variant/50"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isSearching && (
            <span className="material-symbols-outlined animate-spin text-primary ml-2">sync</span>
          )}
        </div>
        
        {/* Dropdown */}
        {results.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-xl max-h-64 overflow-y-auto">
            {results.map((r, i) => (
              <button 
                key={i}
                className="w-full text-left px-4 py-3 hover:bg-surface-container-highest border-b border-outline-variant/10 flex items-center justify-between"
                onClick={() => handleSelect(r.id)}
              >
                <div>
                  <div className="font-body-md text-body-md text-on-surface">{r.name}</div>
                  <div className="font-technical-sm text-technical-sm text-on-surface-variant mt-1">{r.type}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {filterTypes.map(ft => (
          <button
            key={ft.id}
            onClick={() => toggleFilter(ft.id)}
            className={`px-3 py-1 rounded-full border text-label-sm font-label-sm transition-colors ${
              filters[ft.id] !== false 
                ? 'bg-primary/20 border-primary/30 text-primary' 
                : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'
            }`}
          >
            {ft.label}
          </button>
        ))}
        
        <div className="w-px h-6 bg-outline-variant/30 mx-2"></div>
        
        <button
          onClick={() => setEvidenceMode(!evidenceMode)}
          className={`px-3 py-1 rounded-full border text-label-sm font-label-sm flex items-center gap-1 transition-colors ${
            evidenceMode 
              ? 'bg-[#f59e0b]/20 border-[#f59e0b]/50 text-[#f59e0b]' 
              : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
          Evidence Mode
        </button>
      </div>
    </div>
  );
}
