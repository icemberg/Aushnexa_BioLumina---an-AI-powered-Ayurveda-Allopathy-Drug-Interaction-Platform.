export default function MechanismPath({ path = [] }) {
  if (!path || path.length < 2) return null

  return (
    <div className="mt-6 p-4 bg-surface-container-low/50 rounded-xl border border-outline-variant/30 overflow-x-auto relative">
      <h5 className="font-technical-sm text-[11px] text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[14px]">route</span>
        Biological Mechanism Path
      </h5>
      <div className="flex items-center min-w-max">
        {path.map((node, index) => (
          <div key={index} className="flex items-center">
            {/* Node */}
            <div className="px-4 py-2 bg-surface-container-high border border-outline-variant/50 rounded-lg shadow-sm font-body-sm text-on-surface">
              {node}
            </div>
            
            {/* Arrow (don't show after last node) */}
            {index < path.length - 1 && (
              <div className="flex flex-col items-center px-3">
                <span className="material-symbols-outlined text-outline-variant text-[20px]">arrow_forward</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="font-technical-sm text-[11px] text-on-surface-variant/70 mt-4 italic">
        This path traces how the herb/drug interacts through active compounds and biological targets.
      </p>
    </div>
  )
}
