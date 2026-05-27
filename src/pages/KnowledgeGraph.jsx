import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getKnowledgeGraph, getKnowledgeNode, tracePathway } from '../services/api';
import useGraphLayout from '../hooks/useGraphLayout';
import GraphCanvas from '../components/graph/GraphCanvas';
import NodeDetailPanel from '../components/graph/NodeDetailPanel';
import GraphControls from '../components/graph/GraphControls';
import SearchFilterBar from '../components/graph/SearchFilterBar';

export default function KnowledgeGraph() {
  const navigate = useNavigate();
  const [rawData, setRawData] = useState({ nodes: [], edges: [] });
  const [filters, setFilters] = useState({
    Phytochemical: true,
    Drug: true,
    Mechanism: true,
    BiologicalTarget: true
  });
  const [evidenceMode, setEvidenceMode] = useState(false);
  
  // Viewport State
  const [zoom, setZoom] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // Selection State
  const [selectedNode, setSelectedNode] = useState(null);
  const [comparisonNode, setComparisonNode] = useState(null);
  const [pathwayNodes, setPathwayNodes] = useState([]);
  
  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch Initial Graph Data
  useEffect(() => {
    getKnowledgeGraph()
      .then(data => {
        setRawData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load graph", err);
        setIsLoading(false);
      });
  }, []);

  // 2. Apply Layout Algorithm
  const { nodes, edges, isLayoutComplete } = useGraphLayout(rawData, filters);

  // 3. Handlers
  const handleNodeSelect = async (nodeId, isShiftKey = false) => {
    try {
      const nodeDetails = await getKnowledgeNode(nodeId);
      
      if (isShiftKey && selectedNode && selectedNode.id !== nodeId) {
        setComparisonNode(nodeDetails);
      } else {
        setSelectedNode(nodeDetails);
        setComparisonNode(null);
        setPathwayNodes([]); // Clear pathways on new selection
      }
    } catch (err) {
      console.error("Failed to fetch node details", err);
    }
  };

  const handleTracePathway = async (fromId, toId) => {
    try {
      const pathData = await tracePathway(fromId, toId);
      setPathwayNodes(pathData.nodes || []);
    } catch (err) {
      console.error("Failed to trace pathway", err);
    }
  };

  const handleCanvasNodeClick = (e, nodeId) => {
    handleNodeSelect(nodeId, e.shiftKey);
  };

  const handleCanvasNodeRightClick = (e, nodeId) => {
    if (selectedNode && selectedNode.id !== nodeId) {
      handleTracePathway(selectedNode.id, nodeId);
    }
  };

  const resetView = () => {
    setZoom(1);
    setTranslate({ x: 0, y: 0 });
  };

  return (
    <main className="flex-1 relative matrix-bg w-full h-[calc(100vh-80px)] overflow-hidden">
      {isLoading || !isLayoutComplete ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d0e15] z-50">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
            <span className="text-on-surface-variant font-body-md text-body-md animate-pulse">Initializing Knowledge Graph...</span>
          </div>
        </div>
      ) : null}

      {/* Navigation Controls */}
      <div className="absolute top-8 left-8 z-30">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 px-4 py-2 rounded-full hover:bg-surface-container-highest transition-colors shadow-lg text-on-surface"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="font-label-md text-label-md">Back</span>
        </button>
      </div>

      <SearchFilterBar 
        filters={filters}
        setFilters={setFilters}
        evidenceMode={evidenceMode}
        setEvidenceMode={setEvidenceMode}
        onNodeSelect={(id) => handleNodeSelect(id, false)}
      />

      <GraphCanvas 
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNode?.id}
        comparisonNodeId={comparisonNode?.id}
        pathwayNodeIds={pathwayNodes}
        evidenceMode={evidenceMode}
        onNodeClick={handleCanvasNodeClick}
        onNodeRightClick={handleCanvasNodeRightClick}
        zoom={zoom}
        setZoom={setZoom}
        translate={translate}
        setTranslate={setTranslate}
      />

      <GraphControls 
        zoomIn={() => setZoom(z => Math.min(3, z + 0.2))}
        zoomOut={() => setZoom(z => Math.max(0.3, z - 0.2))}
        resetView={resetView}
      />

      <NodeDetailPanel 
        node={selectedNode}
        comparisonNode={comparisonNode}
        onClose={() => {
          setSelectedNode(null);
          setComparisonNode(null);
          setPathwayNodes([]);
        }}
        onNodeSelect={(id) => handleNodeSelect(id, false)}
        onTracePathway={handleTracePathway}
      />
    </main>
  );
}
