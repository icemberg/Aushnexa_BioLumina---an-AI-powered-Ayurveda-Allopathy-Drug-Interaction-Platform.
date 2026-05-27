import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-grow flex items-center justify-center relative p-margin-mobile md:p-margin-desktop overflow-hidden min-h-screen bg-surface-lowest font-body-md">
          {/* Ambient Background */}
          <div className="absolute inset-0 z-0 hex-bg pointer-events-none"></div>
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.03) 1px, rgba(255,255,255,0.03) 2px)', backgroundSize: '100% 4px' }}></div>
          
          <div className="relative z-10 max-w-2xl w-full text-center flex flex-col items-center gap-12">
            <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto flex items-center justify-center glow-effect rounded-full">
              <img 
                alt="Fractured Node Visual" 
                className="w-full h-full object-cover rounded-full opacity-80 mix-blend-screen" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmFRPNBjcf0MIC4eU5fNmHb1HgKNXLe-SaGQAm5hI2VVImGx0UBOrErIHX-iGmD6b7XBbV-DLyiiWPCNjw6wTACXTLIGUmbBwcEjjPZL1jB_zViaGCX5oL9fe9BKPGo4Bj0dzmLUT0_ERKIykkL18jbcxuCLvncysdKa0tZSeEbb-lEDQ4MNuXwP0SJMho8RV6289eT05jPt5_GPTqeBPRFXADYZGG1UqUztTCOJP4peeQMkJ-X1jmVNnN27fzAUeuyosdlvaV-ZU"
              />
              <div className="absolute inset-0 border border-error-red/20 rounded-full animate-[spin_60s_linear_infinite]"></div>
              <div className="absolute inset-4 border border-dashed border-error-red/40 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
            </div>
            
            <div className="flex flex-col gap-6 items-center">
              <div className="inline-flex items-center gap-2 bg-error-container/20 border border-error-red/30 px-4 py-1.5 rounded-full text-error-red font-technical-sm text-technical-sm">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
                SYSTEM ANOMALY
              </div>
              <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-error-red">Critical Failure</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mx-auto">
                The intelligence matrix experienced an unexpected anomaly. The diagnostic protocol has been recorded.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
              <button 
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-on-primary font-technical-sm text-technical-sm rounded-lg hover:scale-105 transition-transform duration-300"
              >
                <span className="material-symbols-outlined">refresh</span>
                Re-initialize Matrix
              </button>
            </div>
          </div>
          
          <div className="absolute bottom-8 right-8 text-error-red/30 font-technical-sm text-[10px] hidden md:block text-right">
            SYSTEM_STATUS: ERROR_STATE<br/>
            TRACE: {this.state.error?.message?.substring(0, 50) || "UNKNOWN_EXCEPTION"}<br/>
            MATRIX_ID: AUSH-500
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
