import React from 'react';

export default function GraphControls({ zoomIn, zoomOut, resetView }) {
  return (
    <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-20">
      <button 
        onClick={zoomIn}
        className="bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 p-3 rounded-full hover:bg-surface-container-highest transition-colors shadow-lg"
      >
        <span className="material-symbols-outlined text-on-surface">add</span>
      </button>
      <button 
        onClick={zoomOut}
        className="bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 p-3 rounded-full hover:bg-surface-container-highest transition-colors shadow-lg"
      >
        <span className="material-symbols-outlined text-on-surface">remove</span>
      </button>
      <button 
        onClick={resetView}
        className="bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 p-3 rounded-full hover:bg-surface-container-highest transition-colors shadow-lg mt-2"
      >
        <span className="material-symbols-outlined text-on-surface">my_location</span>
      </button>
    </div>
  );
}
