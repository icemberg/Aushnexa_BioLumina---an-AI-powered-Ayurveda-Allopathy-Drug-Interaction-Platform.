import RiskBadge from './RiskBadge'
import EvidenceAccordion from './EvidenceAccordion'
import MechanismPath from './MechanismPath'
import { formatConfidence } from '../utils/riskHelpers'

export default function InteractionCard({ interaction }) {
  const {
    item_a,
    item_b,
    severity,
    severity_score,
    confidence,
    mechanism,
    recommendation,
    compounds_involved,
    evidence,
    mechanism_path,
    low_evidence_warning
  } = interaction

  return (
    <div className="glass-panel overflow-hidden hover:shadow-[0_0_30px_rgba(207,188,255,0.05)] transition-shadow">
      {/* Header */}
      <div className="p-5 border-b border-outline-variant/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low/50">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {item_a} <span className="text-on-surface-variant font-normal mx-2">+</span> {item_b}
            </h3>
          </div>
          <span className="font-technical-sm text-[12px] text-on-surface-variant mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">radar</span>
            {formatConfidence(confidence)}
          </span>
        </div>
        <RiskBadge severity={severity} score={severity_score} className="scale-110 sm:scale-100 origin-left" />
      </div>

      {/* Body */}
      <div className="p-5 space-y-6">
        
        {/* Recommendation (Highlighted) */}
        <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
          <h4 className="font-technical-sm text-technical-sm text-primary flex items-center gap-2 mb-2 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">prescriptions</span> Clinical Directive
          </h4>
          <p className="font-body-md text-body-md text-on-surface">{recommendation}</p>
        </div>

        {/* Mechanism */}
        <div>
          <h4 className="font-headline-sm text-headline-sm text-on-surface mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-outline text-[20px]">science</span>
            Mechanism of Interaction
          </h4>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{mechanism}</p>
          
          {compounds_involved?.length > 0 && (
            <div className="mt-4 flex items-center flex-wrap gap-2">
              <span className="font-technical-sm text-[11px] text-outline-variant uppercase tracking-widest">Active Compounds:</span>
              {compounds_involved.map((compound, idx) => (
                <span key={idx} className="bg-surface-container-high border border-outline-variant/50 text-on-surface-variant font-technical-sm text-[11px] px-2 py-1 rounded-md">
                  {compound}
                </span>
              ))}
            </div>
          )}
          
          {/* Mechanism Path Visualization */}
          {mechanism_path?.length > 0 && (
            <MechanismPath path={mechanism_path} />
          )}
        </div>

        {/* Low Evidence Warning */}
        {low_evidence_warning && (
          <div className="flex items-start gap-3 p-4 bg-saffron/10 rounded-xl border border-saffron/30 text-saffron font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[20px] flex-shrink-0">warning</span>
            <p>
              <strong className="font-technical-sm tracking-wide">LIMITED CLINICAL EVIDENCE:</strong> This interaction is primarily based on theoretical mechanisms, in-vitro data, or computational models. Real-world human effects require clinical validation.
            </p>
          </div>
        )}

        {/* Evidence Citations */}
        {evidence?.length > 0 && (
          <EvidenceAccordion evidence={evidence} />
        )}
        
      </div>
    </div>
  )
}
