import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { AlertTriangle, CheckCircle, Info, Download, Edit3, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useEvidenceData } from '../hooks/useEvidenceData';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ProtocolPDFDocument } from '../components/ProtocolPDFDocument';

const AushnexaAI = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [error, setError] = useState('');
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifiers, setModifiers] = useState({
    age: '',
    pregnancy: false,
    conditions: '',
    dosage: 'standard',
    constraints: ''
  });

  const { aiHistory, addAiHistory, currentResults } = useAppStore();
  const { evidenceData } = useEvidenceData();

  const handleQuerySubmit = async (textToSubmit = query, additionalModifiers = null) => {
    if (!textToSubmit.trim()) return;
    setLoading(true);
    setError('');
    
    let finalQuery = textToSubmit;
    if (additionalModifiers) {
      finalQuery += ` [Parameters: Age ${additionalModifiers.age || 'N/A'}, Pregnant: ${additionalModifiers.pregnancy}, Conditions: ${additionalModifiers.conditions || 'None'}, Dosage: ${additionalModifiers.dosage}, Constraints: ${additionalModifiers.constraints || 'None'}]`;
    }

    try {
      const response = await axios.post('http://localhost:8000/v1/ai/query', { query: finalQuery });
      setAiData(response.data);
      if (response.data?.matrix?.edges?.length > 0) {
        setSelectedEdge(response.data.matrix.edges[0]);
      } else {
        setSelectedEdge(null);
      }
      // Only add to history if it's the main raw query
      if (!additionalModifiers) {
        addAiHistory(textToSubmit, response.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleModifySubmit = (e) => {
    e.preventDefault();
    setShowModifyModal(false);
    handleQuerySubmit(query, modifiers);
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return '#18C96A'; // emerald
      case 'moderate': return '#E8960C'; // amber
      case 'high': return '#F06A25'; // orange
      case 'critical': return '#E03E3E'; // red
      default: return '#0ECFB8'; // teal
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full bg-[#03070F] text-on-background font-body-md overflow-x-hidden selection:bg-primary/30 selection:text-primary-fixed">
      {/* Ambient Background Effect */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-matrix-teal/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-primary-fixed-dim/5 rounded-full blur-[150px] mix-blend-screen"></div>
      </div>

      <main className="relative z-10 pt-16 pb-24 px-margin-desktop max-w-container-max mx-auto flex flex-col gap-gutter">
        <header className="animate-fade-up-1 text-center mb-8">
          <h1 className="font-display-lg text-display-lg text-primary mb-2">Core Intelligence Interface</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            High-precision natural language integration for molecular mapping and generative protocol synthesis.
          </p>
        </header>

        {/* Command Prompt */}
        <section className="animate-fade-up-1 mb-8">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleQuerySubmit(); }}
            className="glass-panel rounded-xl p-2 max-w-4xl mx-auto flex items-center gap-4 glow-effect"
          >
            <div className="pl-4">
              {loading ? (
                <Loader2 className="text-matrix-teal animate-spin w-8 h-8" />
              ) : (
                <span className="material-symbols-outlined text-matrix-teal text-3xl">auto_awesome</span>
              )}
            </div>
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              className="flex-1 bg-transparent border-none text-on-surface font-body-lg focus:ring-0 placeholder:text-on-surface-variant/50 h-14" 
              placeholder="Enter clinical query, molecular compound, or symptom matrix..." 
              type="text" 
            />
            <button 
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-primary/10 hover:bg-primary/20 disabled:opacity-50 text-primary p-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>

          {error && <p className="text-center text-error-red mt-4">{error}</p>}
          
          <div className="flex flex-wrap justify-center items-center gap-4 mt-4">
            <span className="font-label-caps text-label-caps text-on-surface-variant/60">SUGGESTED:</span>
            <button 
              onClick={() => { setQuery("Analyze Hypericum (St. John's Wort) and Warfarin interaction"); handleQuerySubmit("Analyze Hypericum (St. John's Wort) and Warfarin interaction"); }}
              className="font-technical-sm text-technical-sm text-primary hover:underline"
            >
              Analyze Hypericum (St. John's Wort) and Warfarin interaction
            </button>
            <button 
              onClick={() => { setQuery("Generate Protocol: Type 2 Diabetes (Integrative)"); handleQuerySubmit("Generate Protocol: Type 2 Diabetes (Integrative)"); }}
              className="font-technical-sm text-technical-sm text-primary hover:underline"
            >
              Generate Protocol: Type 2 Diabetes (Integrative)
            </button>
          </div>

          {/* History Row */}
          {aiHistory.length > 0 && (
            <div className="mt-8 max-w-4xl mx-auto">
              <span className="font-label-caps text-label-caps text-on-surface-variant/60 block mb-3 text-center">SESSION HISTORY</span>
              <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide justify-center">
                {aiHistory.map((hist, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(hist.query);
                      setAiData(hist.response);
                      if (hist.response?.matrix?.edges?.length > 0) {
                        setSelectedEdge(hist.response.matrix.edges[0]);
                      }
                    }}
                    className="whitespace-nowrap px-4 py-2 rounded-full bg-surface-container border border-outline-variant/30 text-sm text-on-surface-variant hover:bg-surface-variant transition-colors"
                  >
                    {hist.query.length > 30 ? hist.query.substring(0, 30) + '...' : hist.query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Results Grid Layout */}
        {aiData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter flex-1 items-start">
            
            {/* Left Panel: Molecular Interaction Matrix */}
            <section className="lg:col-span-7 animate-fade-up-2 glass-panel rounded-xl p-6 flex flex-col h-full min-h-[600px]">
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">hub</span>
                  <h2 className="font-headline-md text-headline-md text-primary">Molecular Interaction Matrix</h2>
                </div>
              </div>
              
              <div className="flex-1 relative rounded-lg bg-surface-lowest overflow-hidden border border-outline-variant/20 flex flex-col items-center justify-center group min-h-[400px]">
                {/* SVG Visualizer */}
                {aiData.matrix?.nodes && (
                  <MatrixVisualizer 
                    matrix={aiData.matrix} 
                    onEdgeClick={setSelectedEdge}
                  />
                )}
                
                {/* Bottom Status Bar */}
                <div className="absolute bottom-4 left-4 right-4 bg-surface-container/90 backdrop-blur p-4 rounded-lg border border-outline-variant/30 flex justify-between items-center z-20">
                  <div>
                    <p className="font-technical-sm text-technical-sm text-on-surface-variant">Selected Interaction:</p>
                    <p className="font-body-md text-body-md font-bold text-on-surface">
                      {selectedEdge ? `${selectedEdge.from} + ${selectedEdge.to}` : aiData.matrix?.selected_interaction || 'None selected'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-technical-sm text-technical-sm text-on-surface-variant">Risk Level</p>
                    <div className="flex items-center gap-2">
                      <span 
                        className={`w-3 h-3 rounded-full ${selectedEdge?.risk?.toLowerCase() === 'critical' ? 'animate-pulse' : ''}`}
                        style={{ backgroundColor: getRiskColor(selectedEdge?.risk || aiData.matrix?.risk_level) }}
                      ></span>
                      <p 
                        className="font-label-caps text-label-caps"
                        style={{ color: getRiskColor(selectedEdge?.risk || aiData.matrix?.risk_level) }}
                      >
                        {(selectedEdge?.risk || aiData.matrix?.risk_level || 'UNKNOWN').toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Right Panel: Generative Protocol */}
            <section className="lg:col-span-5 animate-fade-up-3 flex flex-col gap-6">
              
              {/* Protocol Header Card */}
              {aiData.protocol && (
                <div className="glass-panel rounded-xl p-6 border-t-2 border-t-primary glow-effect">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="font-label-caps text-label-caps text-primary/70 bg-primary/10 px-2 py-1 rounded">AI GENERATED</span>
                      <h3 className="font-headline-md text-headline-md text-primary mt-2">{aiData.protocol.title || 'Integrative Protocol'}</h3>
                      <p className="font-technical-sm text-technical-sm text-on-surface-variant mt-1 font-mono opacity-80">Focus: {aiData.protocol.focus}</p>
                    </div>
                    <PDFDownloadLink
                      document={<ProtocolPDFDocument aiData={aiData} evidenceData={evidenceData} currentResults={currentResults} />}
                      fileName="Integrative_Protocol_Report.pdf"
                      className="p-2 bg-surface-variant rounded-full text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
                      title="Export Protocol"
                    >
                      {({ loading }) => (
                        loading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />
                      )}
                    </PDFDownloadLink>
                  </div>
                  
                  <div className="space-y-4">
                    {aiData.protocol.allopathic_base && (
                      <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/20">
                        <h4 className="font-technical-sm text-technical-sm text-on-surface mb-2 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-matrix-teal">science</span> Allopathic Base
                        </h4>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          <strong>{aiData.protocol.allopathic_base.name}</strong> - {aiData.protocol.allopathic_base.role}
                        </p>
                      </div>
                    )}
                    {aiData.protocol.ayurvedic_integration && (
                      <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/20">
                        <h4 className="font-technical-sm text-technical-sm text-on-surface mb-2 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-matrix-saffron">eco</span> Ayurvedic Integration
                        </h4>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          <strong>{aiData.protocol.ayurvedic_integration.name}</strong> - {aiData.protocol.ayurvedic_integration.role}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Insights */}
              {aiData.protocol?.insights && aiData.protocol.insights.length > 0 && (
                <div className="glass-panel rounded-xl p-6 flex-1 border border-outline-variant/30 flex flex-col">
                  <h3 className="font-technical-sm text-technical-sm text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">psychiatry</span> AI Insights & Precautions
                  </h3>
                  <ul className="space-y-4 font-body-md text-body-md text-on-surface-variant flex-1">
                    {aiData.protocol.insights.map((insight, idx) => {
                      let Icon = Info;
                      let colorClass = "text-primary";
                      if (insight.type === 'warning') { Icon = AlertTriangle; colorClass = "text-matrix-saffron"; }
                      if (insight.type === 'success') { Icon = CheckCircle; colorClass = "text-matrix-emerald"; }
                      
                      return (
                        <li key={idx} className="flex gap-3 items-start">
                          <Icon className={`${colorClass} w-5 h-5 mt-0.5 shrink-0`} />
                          <span><strong>{insight.title}:</strong> {insight.body}</span>
                        </li>
                      );
                    })}
                  </ul>
                  
                  <button 
                    onClick={() => setShowModifyModal(!showModifyModal)}
                    className="mt-6 w-full py-3 bg-surface-variant text-on-surface border border-outline-variant/50 rounded-lg font-technical-sm text-technical-sm hover:bg-surface-bright transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit3 size={18} /> Modify Parameters
                  </button>
                  
                  <AnimatePresence>
                    {showModifyModal && (
                      <motion.form 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleModifySubmit}
                        className="overflow-hidden mt-4 pt-4 border-t border-outline-variant/20 flex flex-col gap-3"
                      >
                        <div className="flex gap-4">
                          <input type="number" placeholder="Age" value={modifiers.age} onChange={e => setModifiers({...modifiers, age: e.target.value})} className="flex-1 bg-surface border border-outline-variant/50 rounded p-2 text-sm text-on-surface" />
                          <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                            <input type="checkbox" checked={modifiers.pregnancy} onChange={e => setModifiers({...modifiers, pregnancy: e.target.checked})} /> Pregnant
                          </label>
                        </div>
                        <input type="text" placeholder="Known Conditions (comma separated)" value={modifiers.conditions} onChange={e => setModifiers({...modifiers, conditions: e.target.value})} className="w-full bg-surface border border-outline-variant/50 rounded p-2 text-sm text-on-surface" />
                        <div className="flex gap-2 text-sm">
                          {['conservative', 'standard', 'aggressive'].map(lvl => (
                            <label key={lvl} className="flex items-center gap-1 text-on-surface-variant capitalize">
                              <input type="radio" name="dosage" checked={modifiers.dosage === lvl} onChange={() => setModifiers({...modifiers, dosage: lvl})} /> {lvl}
                            </label>
                          ))}
                        </div>
                        <textarea placeholder="Additional constraints..." value={modifiers.constraints} onChange={e => setModifiers({...modifiers, constraints: e.target.value})} className="w-full bg-surface border border-outline-variant/50 rounded p-2 text-sm text-on-surface h-20 resize-none"></textarea>
                        <button type="submit" className="w-full py-2 bg-primary text-on-primary rounded font-bold text-sm">Apply & Regenerate</button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

// Sub-component for SVG Visualization
const MatrixVisualizer = ({ matrix, onEdgeClick }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setDimensions({ width: clientWidth, height: clientHeight });
    }
  }, [matrix]);

  const nodes = matrix.nodes || [];
  const edges = matrix.edges || [];
  const cx = dimensions.width / 2;
  const cy = dimensions.height / 2;

  // Calculate Node Positions
  const positionedNodes = nodes.map((node, i) => {
    let x, y;
    if (nodes.length === 1) {
      x = cx; y = cy;
    } else if (nodes.length === 2) {
      x = i === 0 ? dimensions.width * 0.3 : dimensions.width * 0.7;
      y = cy;
    } else {
      const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
      const radius = Math.min(cx, cy) * 0.6;
      x = cx + radius * Math.cos(angle);
      y = cy + radius * Math.sin(angle);
    }
    return { ...node, x, y };
  });

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return '#18C96A'; 
      case 'moderate': return '#E8960C'; 
      case 'high': return '#F06A25'; 
      case 'critical': return '#E03E3E'; 
      default: return '#0ECFB8'; 
    }
  };

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full z-10">
      {/* Background Image Restored */}
      <div 
        className="absolute inset-0 w-full h-full opacity-10 bg-center bg-cover bg-no-repeat mix-blend-screen pointer-events-none"
        style={{ backgroundImage: "url('/bio-fusion.jpg')" }}
      />
      <svg width="100%" height="100%" className="relative z-10">
        <defs>
          <filter id="glowTeal" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glowAmber" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((edge, idx) => {
          const fromNode = positionedNodes.find(n => n.id === edge.from) || positionedNodes.find(n => n.label.toLowerCase() === edge.from.toLowerCase());
          const toNode = positionedNodes.find(n => n.id === edge.to) || positionedNodes.find(n => n.label.toLowerCase() === edge.to.toLowerCase());
          if (!fromNode || !toNode) return null;

          const color = getRiskColor(edge.risk);
          const isCritical = edge.risk?.toLowerCase() === 'critical';
          const isHigh = edge.risk?.toLowerCase() === 'high';

          return (
            <g key={idx} className="cursor-pointer" onClick={() => onEdgeClick(edge)}>
              <line 
                x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} 
                stroke="transparent" strokeWidth="20" // invisible thicker hit area
              />
              <line 
                x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} 
                stroke={color} 
                strokeWidth={isHigh || isCritical ? 2 : 1}
                strokeDasharray={isHigh ? "6,6" : isCritical ? "4,4" : "none"}
                className={isCritical ? "animate-[dash_1s_linear_infinite]" : ""}
              />
              {/* Optional label on line */}
              <text 
                x={(fromNode.x + toNode.x) / 2} y={(fromNode.y + toNode.y) / 2 - 10} 
                fill={color} fontSize="10" textAnchor="middle" className="pointer-events-none opacity-80"
              >
                {edge.risk.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {positionedNodes.map((node, idx) => {
          const isTeal = node.color === 'teal';
          const isAmber = node.color === 'amber';
          const fillCol = isTeal ? '#0ECFB8' : isAmber ? '#F59E0B' : '#9ca3af';
          
          return (
            <g key={idx} className="pointer-events-none">
              <circle 
                cx={node.x} cy={node.y} r="10" 
                fill={fillCol}
                filter={isTeal ? "url(#glowTeal)" : isAmber ? "url(#glowAmber)" : ""}
              />
              <rect x={node.x - 40} y={node.y + 15} width="80" height="24" rx="4" fill="#1C1F26" stroke={`${fillCol}40`} />
              <text x={node.x} y={node.y + 30} fill={fillCol} fontSize="12" textAnchor="middle" fontWeight="bold">
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default AushnexaAI;
