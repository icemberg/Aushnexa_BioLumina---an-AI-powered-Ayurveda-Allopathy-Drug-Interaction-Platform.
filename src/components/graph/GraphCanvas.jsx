import React, { useRef, useState } from 'react';

export default function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  comparisonNodeId,
  pathwayNodeIds,
  evidenceMode,
  onNodeClick,
  onNodeRightClick,
  zoom,
  setZoom,
  translate,
  setTranslate
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Pan handlers
  const handleMouseDown = (e) => {
    // Only pan on left click background or middle click
    if (e.target.tagName !== 'svg' && e.target.tagName !== 'div') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setTranslate({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newZoom = Math.min(Math.max(0.3, zoom + delta), 3.0);
    setZoom(newZoom);
  };

  // Helper to determine node visual classes
  const getNodeClasses = (n) => {
    let classes = "absolute rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 ";
    
    const isSelected = n.id === selectedNodeId || n.id === comparisonNodeId;
    const isPathway = pathwayNodeIds.includes(n.id);
    
    // Base styles
    if (n.type === 'Phytochemical') {
      classes += "bg-surface-container-high border-2 border-primary w-24 h-24 ";
    } else if (n.type === 'Drug') {
      classes += "bg-surface-container-high border-2 border-error w-20 h-20 ";
    } else {
      classes += "bg-surface-container-high border-2 border-[#0ecfb8] w-16 h-16 ";
    }

    // Evidence Mode sizing/glow
    if (evidenceMode) {
      const sizeMultiplier = n.evidence_count ? Math.min(3, 1 + n.evidence_count * 0.1) : 1;
      // In a real implementation we would apply inline styles for size based on multiplier
      if (n.evidence_count > 5) classes += "shadow-[0_0_15px_rgba(207,188,255,0.6)] ";
      else if (!n.evidence_count) classes += "border-dashed ";
    }

    // Pathway Mode opacity
    if (pathwayNodeIds.length > 0) {
      if (!isPathway) classes += "opacity-15 ";
      else classes += "glow-pulse shadow-[0_0_20px_rgba(207,188,255,0.8)] ";
    }

    if (isSelected) {
      classes += "ring-4 ring-primary/50 shadow-xl ";
    }

    return classes;
  };

  return (
    <div 
      className="absolute inset-0 overflow-hidden bg-[#0d0e15]"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div 
        className="w-full h-full transform origin-top-left"
        style={{ 
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoom})`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {/* SVG layer for edges */}
        <svg className="absolute inset-0 w-[4000px] h-[4000px] pointer-events-none" style={{ overflow: 'visible' }}>
          {edges.map((e, idx) => {
            const sourceNode = nodes.find(n => n.id === e.source);
            const targetNode = nodes.find(n => n.id === e.target);
            if (!sourceNode || !targetNode) return null;

            const isPathwayEdge = pathwayNodeIds.includes(e.source) && pathwayNodeIds.includes(e.target);
            
            let stroke = "rgba(207, 188, 255, 0.2)";
            let strokeWidth = "1";
            let classes = "";
            
            if (isPathwayEdge) {
              stroke = "rgba(207, 188, 255, 0.8)";
              strokeWidth = "3";
              classes = "animate-pulse"; // In a real implementation, a flowing gradient dash
            }

            return (
              <line 
                key={idx}
                x1={sourceNode.x} 
                y1={sourceNode.y} 
                x2={targetNode.x} 
                y2={targetNode.y} 
                stroke={stroke} 
                strokeWidth={strokeWidth}
                className={classes}
              >
                <title>{e.label || 'Interaction'}</title>
              </line>
            );
          })}
        </svg>

        {/* HTML layer for nodes */}
        {nodes.map(n => {
          if (!n.isVisible && !n.isFixed) return null;
          
          return (
            <div 
              key={n.id}
              className={getNodeClasses(n)}
              style={{ left: n.x, top: n.y }}
              onClick={(e) => { e.stopPropagation(); onNodeClick(e, n.id); }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onNodeRightClick(e, n.id); }}
              title={n.id}
            >
              <div className="text-center px-2 pointer-events-none">
                <div className="font-technical-sm text-technical-sm text-on-surface truncate w-full">{n.label || n.id}</div>
                {n.type === 'Phytochemical' && (
                  <div className="font-label-caps text-[9px] text-on-surface-variant mt-0.5">Primary</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
