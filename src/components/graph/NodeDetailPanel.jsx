import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NodeDetailPanel({ 
  node, 
  comparisonNode,
  onClose,
  onNodeSelect,
  onTracePathway
}) {
  const navigate = useNavigate();

  if (!node) return null;

  const renderSingleNode = (n, isComparison = false) => {
    // Determine colors based on node type
    let colorClass = "text-primary border-primary/30 bg-primary/15";
    if (n.type === 'Drug') colorClass = "text-error border-error/30 bg-error/15";
    else if (n.type === 'BiologicalTarget' || n.type === 'Mechanism') colorClass = "text-[#0ecfb8] border-[#0ecfb8]/30 bg-[#0ecfb8]/15";

    return (
      <div className={`p-6 ${isComparison ? 'flex-1' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 rounded font-label-caps text-label-caps ${colorClass}`}>
            {n.type || 'Entity'}
          </span>
          {!isComparison && (
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
        <h2 className="font-headline-md text-headline-md text-primary-fixed mb-1">{n.id}</h2>
        {n.properties?.scientific_name && (
          <p className="font-technical-sm text-technical-sm text-on-surface-variant">{n.properties.scientific_name}</p>
        )}
        {n.properties?.description && (
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-3 line-clamp-3">
            {n.properties.description}
          </p>
        )}
        
        {n.primary_targets && n.primary_targets.length > 0 && (
          <div className="mt-4">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-2">Primary Targets</h3>
            <div className="flex flex-wrap gap-2">
              {n.primary_targets.map((target, idx) => (
                <button 
                  key={idx}
                  onClick={() => onNodeSelect(target)}
                  className="px-2 py-1 border border-outline-variant/30 rounded hover:bg-surface-container-highest transition-colors text-technical-sm text-on-surface"
                >
                  {target}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {n.confidence_score && (
          <div className="mt-4">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-2">Confidence Score</h3>
            <div className="w-full bg-surface-container-highest rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${n.confidence_score}%` }}></div>
            </div>
            <div className="text-right mt-1 font-technical-sm text-technical-sm text-primary">{n.confidence_score}%</div>
          </div>
        )}
        
        <div className="mt-6 flex flex-col gap-2">
          <button 
            onClick={() => navigate(`/knowledge/compound/${encodeURIComponent(n.id)}`)}
            className="w-full py-2 border border-primary text-primary rounded-lg font-technical-sm text-technical-sm hover:bg-primary/10 transition-colors"
          >
            View Full Report
          </button>
          
          {comparisonNode && !isComparison && (
            <button 
              onClick={() => onTracePathway(n.id, comparisonNode.id)}
              className="w-full py-2 bg-primary text-on-primary rounded-lg font-technical-sm text-technical-sm hover:bg-primary/90 transition-colors"
            >
              Trace Pathway
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`absolute top-24 left-8 bg-surface-container/90 backdrop-blur-2xl border border-outline-variant/30 rounded-xl shadow-2xl z-20 overflow-hidden flex transition-all duration-300 ${comparisonNode ? 'w-[600px] divide-x divide-outline-variant/20' : 'w-80'}`}>
      {renderSingleNode(node)}
      
      {comparisonNode && (
        <div className="relative flex flex-col">
          <div className="absolute top-4 right-4 z-10">
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          {renderSingleNode(comparisonNode, true)}
          
          {/* Shared Targets Section could go here if computed */}
        </div>
      )}
    </div>
  );
}
