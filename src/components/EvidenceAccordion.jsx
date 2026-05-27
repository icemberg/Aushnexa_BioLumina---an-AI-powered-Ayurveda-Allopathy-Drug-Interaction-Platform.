import { useState } from 'react'
import { EVIDENCE_LABELS } from '../constants'

export default function EvidenceAccordion({ evidence = [] }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!evidence || evidence.length === 0) return null

  return (
    <div className="mt-6 border border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-surface-container-low hover:bg-surface-container transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant">library_books</span>
          <h4 className="font-headline-sm text-headline-sm text-on-surface">
            Scientific Evidence ({evidence.length})
          </h4>
        </div>
        <span className={`material-symbols-outlined text-outline transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 bg-surface/50 border-t border-outline-variant/30">
          {evidence.map((item, idx) => {
            const levelInfo = item.evidence_level 
              ? EVIDENCE_LABELS[item.evidence_level] 
              : { label: item.study_type || 'Unknown study type', certainty: 'Unknown', icon: '📄' }

            return (
              <div key={idx} className="pb-4 border-b border-outline-variant/20 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h5 className="font-body-md font-medium text-on-surface leading-snug">
                      {item.title || 'Study details not available'}
                    </h5>
                    
                    {item.conclusion && (
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 bg-surface-container-low p-3 rounded-lg border border-outline-variant/30 italic">
                        "{item.conclusion}"
                      </p>
                    )}
                    
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-3 font-technical-sm text-[11px] text-outline-variant uppercase tracking-wide">
                      <span className="flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant">
                        <span className="text-[14px]">{levelInfo.icon}</span> {levelInfo.label}
                      </span>
                      {item.year && <span>Published: {item.year}</span>}
                      {item.source && <span>Source: {item.source}</span>}
                    </div>
                  </div>

                  {item.pmid && (
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${item.pmid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 flex items-center gap-1 font-technical-sm text-[12px] text-primary hover:text-primary-fixed bg-primary/10 px-3 py-1.5 rounded-lg transition-colors border border-primary/20"
                    >
                      PubMed <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
