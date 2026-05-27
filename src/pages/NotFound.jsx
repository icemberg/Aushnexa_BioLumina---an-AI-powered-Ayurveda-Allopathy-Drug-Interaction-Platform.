import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="flex-grow flex items-center justify-center relative p-margin-mobile md:p-margin-desktop overflow-hidden min-h-[80vh]">
      {/* Ambient Background */}
      <div className="absolute inset-0 z-0 hex-bg pointer-events-none"></div>
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.03) 1px, rgba(255,255,255,0.03) 2px)', backgroundSize: '100% 4px' }}></div>
      
      {/* Main 404 Container */}
      <div className="relative z-10 max-w-2xl w-full text-center flex flex-col items-center gap-12">
        {/* Visual Element */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto flex items-center justify-center glow-effect rounded-full">
          <img 
            alt="Fractured Node Visual" 
            className="w-full h-full object-cover rounded-full opacity-80 mix-blend-screen" 
            data-alt="A highly detailed 3D rendering of a fractured hexagonal molecular node floating in a dark void. The node emits a strong, bioluminescent teal and deep blue glow, illuminating the shattered, crystalline fragments breaking away from its core. The aesthetic is strictly clinical, futuristic, and authoritative, matching a high-end AI pharmacopeia interface. Deep blacks and sophisticated atmospheric lighting enhance the dramatic, technological sense of a broken connection." 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmFRPNBjcf0MIC4eU5fNmHb1HgKNXLe-SaGQAm5hI2VVImGx0UBOrErIHX-iGmD6b7XBbV-DLyiiWPCNjw6wTACXTLIGUmbBwcEjjPZL1jB_zViaGCX5oL9fe9BKPGo4Bj0dzmLUT0_ERKIykkL18jbcxuCLvncysdKa0tZSeEbb-lEDQ4MNuXwP0SJMho8RV6289eT05jPt5_GPTqeBPRFXADYZGG1UqUztTCOJP4peeQMkJ-X1jmVNnN27fzAUeuyosdlvaV-ZU"
          />
          {/* Overlay technical elements */}
          <div className="absolute inset-0 border border-surface-tint/20 rounded-full animate-[spin_60s_linear_infinite]"></div>
          <div className="absolute inset-4 border border-dashed border-primary/30 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
        </div>
        
        {/* Text Content */}
        <div className="flex flex-col gap-6 items-center">
          <div className="inline-flex items-center gap-2 bg-error-container/20 border border-error-red/30 px-4 py-1.5 rounded-full text-error-red font-technical-sm text-technical-sm">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
            ERROR 404
          </div>
          <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary">Node Disconnected</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mx-auto">
            The clinical pathway you are looking for does not exist in our current matrix. The designated molecular or analytical portal may have been re-sequenced.
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
          <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-on-primary font-technical-sm text-technical-sm rounded-lg hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined">grid_3x3</span>
            Return to Matrix
          </Link>
          <div className="flex gap-4 w-full sm:w-auto">
            <Link to="/" className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 border border-outline-variant text-on-surface hover:text-primary hover:border-primary/50 font-technical-sm text-technical-sm rounded-lg transition-colors bg-surface-container/50">
              <span className="material-symbols-outlined">home</span>
              Home
            </Link>
            <button onClick={() => navigate(-1)} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 border border-outline-variant text-on-surface hover:text-primary hover:border-primary/50 font-technical-sm text-technical-sm rounded-lg transition-colors bg-surface-container/50">
              <span className="material-symbols-outlined">science</span>
              Research
            </button>
          </div>
        </div>
      </div>
      
      {/* Decorative UI elements typical of the brand */}
      <div className="absolute bottom-8 right-8 text-on-surface-variant/30 font-technical-sm text-[10px] hidden md:block">
        SYSTEM_STATUS: OFF-PATHWAY<br/>
        COORDINATES: NULL_VECTOR<br/>
        MATRIX_ID: AUSH-404
      </div>
    </main>
  );
}
