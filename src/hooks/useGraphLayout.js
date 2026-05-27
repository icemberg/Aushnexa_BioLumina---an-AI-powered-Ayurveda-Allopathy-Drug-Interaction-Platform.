import { useState, useEffect } from 'react';

// A simple implementation of Fruchterman-Reingold algorithm
export default function useGraphLayout(graphData, filters) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLayoutComplete, setIsLayoutComplete] = useState(false);

  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      setNodes([]);
      setEdges([]);
      setIsLayoutComplete(false);
      return;
    }

    // Filter nodes and edges based on active filters
    // If a filter is inactive, we'll still keep the node but mark it as faded (opacity)
    // For layout, we include all nodes.
    
    const maxIterations = 100;
    const width = 1200;
    const height = 800;
    const center = { x: width / 2, y: height / 2 };
    
    // Initialize node positions
    let workingNodes = graphData.nodes.map((n, i) => {
      // Fix primary nodes (like herbs/drugs with high degree) near center initially
      const isPrimary = n.type === 'Phytochemical' || n.type === 'Drug';
      return {
        ...n,
        x: isPrimary ? center.x + (Math.random() * 100 - 50) : Math.random() * width,
        y: isPrimary ? center.y + (Math.random() * 100 - 50) : Math.random() * height,
        vx: 0,
        vy: 0,
        isFixed: isPrimary && i === 0, // Fix the very first node exactly to center
        isVisible: filters ? filters[n.type] !== false : true
      };
    });
    
    if (workingNodes.length > 0 && workingNodes[0].isFixed) {
      workingNodes[0].x = center.x;
      workingNodes[0].y = center.y;
    }

    const workingEdges = graphData.edges.map(e => ({...e}));
    
    // Fruchterman-Reingold constants
    const k = Math.sqrt((width * height) / workingNodes.length) * 0.5;
    const repulsion = k * k;
    let temperature = width / 10;
    const coolingFactor = 0.95;

    // Iterative simulation
    for (let iter = 0; iter < maxIterations; iter++) {
      // Repulsion
      for (let i = 0; i < workingNodes.length; i++) {
        for (let j = 0; j < workingNodes.length; j++) {
          if (i === j) continue;
          
          const n1 = workingNodes[i];
          const n2 = workingNodes[j];
          
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const distance = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
          
          const force = repulsion / distance;
          n1.vx += (dx / distance) * force;
          n1.vy += (dy / distance) * force;
        }
      }

      // Attraction
      for (let e of workingEdges) {
        const sourceNode = workingNodes.find(n => n.id === e.source);
        const targetNode = workingNodes.find(n => n.id === e.target);
        
        if (!sourceNode || !targetNode) continue;
        
        const dx = sourceNode.x - targetNode.x;
        const dy = sourceNode.y - targetNode.y;
        const distance = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
        
        const force = (distance * distance) / k;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        sourceNode.vx -= fx;
        sourceNode.vy -= fy;
        targetNode.vx += fx;
        targetNode.vy += fy;
      }

      // Update positions
      for (let n of workingNodes) {
        if (n.isFixed) continue;
        
        const forceMagnitude = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (forceMagnitude > 0) {
          const limitedForce = Math.min(forceMagnitude, temperature);
          n.x += (n.vx / forceMagnitude) * limitedForce;
          n.y += (n.vy / forceMagnitude) * limitedForce;
        }
        
        // Boundaries
        n.x = Math.max(50, Math.min(width - 50, n.x));
        n.y = Math.max(50, Math.min(height - 50, n.y));
        
        // Reset velocity
        n.vx = 0;
        n.vy = 0;
      }
      
      temperature *= coolingFactor;
    }

    // After layout is complete, set the state
    setNodes(workingNodes);
    setEdges(workingEdges);
    setIsLayoutComplete(true);

  }, [graphData, filters]);

  return { nodes, edges, isLayoutComplete };
}
