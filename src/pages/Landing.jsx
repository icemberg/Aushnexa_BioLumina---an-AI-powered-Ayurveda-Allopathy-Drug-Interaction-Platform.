import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ParticleField = () => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const newParticles = [...Array(40)].map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 1.5,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div 
          key={p.id}
          className="absolute rounded-full bg-emerald-light/40 shadow-[0_0_10px_rgba(24,201,106,0.5)] animate-[particleFloat_infinite_ease-in-out]"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default function Landing() {
  const navigate = useNavigate();

  // Cursor Interaction & Scroll Reveal
  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, []);

  return (
    <main className="flex-grow relative z-10">
      {/* Cursor Radial Glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-[100] mix-blend-screen transition-opacity duration-300" 
        style={{ background: 'radial-gradient(600px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), rgba(24,201,106,0.06), transparent 40%)' }}
      ></div>
      {/* Deep Organic Background Elements */}
      <div className="fixed inset-0 z-0 bg-organic-gradient organic-bg pointer-events-none"></div>
      <div className="fixed top-0 left-1/4 w-3/4 h-3/4 bg-glow-saffron blur-3xl opacity-50 z-0 pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-3/4 h-3/4 bg-glow-emerald blur-3xl opacity-30 z-0 pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative min-h-[921px] flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop py-24 md:py-32 overflow-hidden">
        <ParticleField />
        {/* Decorative organic overlay for hero */}
        <div className="absolute inset-0 z-0 flex justify-center items-center opacity-20 pointer-events-none">
          <img 
            alt="Hero background" 
            className="w-full h-full object-cover mix-blend-screen" 
            data-alt="Intricate generative art showing glowing neural network connections intertwining with intricate, luminous plant roots in deep forest green and vibrant saffron colors. Set against a pitch-black void, creating a deep sense of biological mystery and advanced artificial intelligence. Ultra-high definition, cinematic lighting."
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtCKBVQ1C4pNhUYygU6fLyWV7xihV52piaf1HXMmYHwdP73z_HCGgB2yFJSix5s2wwoSqNZsf-wk5ibZhIZ9VAcduXLwQZmiBEzAwZw7eWV3rQe7SAukawK8HFOaC9o2X48Y1qS4KAfT0OWSzXbzmLd7i3UrngmEhK4ETWxwe-mXdvhwX-Qtlf29hqynYP8SE4sRjpdvHMPBJ_WitBx-arMQeiVQtpn1u__J58-o9PvC8SRrP1MNCk16VgfB3p-OI3QcfG8WSl2bs" 
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-light/10 border border-emerald-light/20">
            <span className="material-symbols-outlined text-emerald-light text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            <span className="font-label-caps text-label-caps text-emerald-light tracking-widest uppercase">Ancient Heritage, Modern Intelligence</span>
          </div>
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface">
            Bridge the Gap Between <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-light to-saffron">Science and Tradition</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Aushnexa AI maps centuries of Ayurvedic pharmacopeia against modern molecular structures, providing clinical-grade interaction matrices for precision integrative medicine.
          </p>

          {/* Center-aligned Search Bar */}
          <div className="w-full max-w-2xl mt-8 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-light/20 to-saffron/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-surface-container-high/80 backdrop-blur-md rounded-2xl border border-outline-variant/50 p-2 shadow-2xl">
              <span className="material-symbols-outlined text-on-surface-variant ml-4 mr-2">search</span>
              <input 
                className="w-full bg-transparent border-none text-on-surface focus:ring-0 font-body-md text-body-md placeholder:text-on-surface-variant/50 outline-none" 
                placeholder="Search molecules, herbs, or clinical protocols..." 
                type="text" 
              />
              <button 
                onClick={() => navigate('/checker')}
                className="ml-auto gradient-btn text-white px-8 py-3 rounded-xl font-label-caps text-label-caps flex items-center gap-2 shadow-[0_0_15px_rgba(24,201,106,0.3)]"
              >
                Analyze
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 opacity-60">
            <div className="flex items-center gap-2 font-technical-sm text-technical-sm text-on-surface">
              <span className="material-symbols-outlined text-[18px]">verified_user</span> ISO 27001 Compliant
            </div>
            <div className="flex items-center gap-2 font-technical-sm text-technical-sm text-on-surface">
              <span className="material-symbols-outlined text-[18px]">science</span> Pharmacopeia Standard
            </div>
            <div className="flex items-center gap-2 font-technical-sm text-technical-sm text-on-surface">
              <span className="material-symbols-outlined text-[18px]">database</span> 1.2M+ Protocols
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Feature Section */}
      <section className="px-margin-mobile md:px-margin-desktop py-24 max-w-container-max mx-auto">
        <div className="mb-16">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-4">Integrative Analysis Engine</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">Comprehensive tools designed to synthesize complex biological data into actionable clinical insights.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[280px]">
          {/* Feature 1: Large Span */}
          <div id="card-interaction-matrix" className="md:col-span-8 bg-surface-container/40 backdrop-blur-lg border border-outline-variant/30 rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-light/50 transition-colors duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-light/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-12 h-12 rounded-full bg-emerald-light/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-emerald-light">device_hub</span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Molecular Interaction Matrix</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md">Visualize real-time cross-reactivity between synthetic compounds and botanical alkaloids with our proprietary AI graph database.</p>
              </div>
            </div>
          </div>
          
          {/* Feature 2: Small Square */}
          <div id="card-clinical-trials" className="md:col-span-4 bg-surface-container/40 backdrop-blur-lg border border-outline-variant/30 rounded-3xl p-8 relative overflow-hidden group hover:border-saffron/50 transition-colors duration-500 flex flex-col justify-between">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-saffron/10 blur-3xl rounded-full translate-x-1/4 translate-y-1/4"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-full bg-saffron/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-saffron">biotech</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Clinical Validation</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Access peer-reviewed trials supporting traditional efficacy.</p>
            </div>
          </div>

          {/* Feature 3: Small Square */}
          <div id="card-knowledge-base" className="md:col-span-4 bg-surface-container/40 backdrop-blur-lg border border-outline-variant/30 rounded-3xl p-8 relative overflow-hidden group hover:border-primary/50 transition-colors duration-500 flex flex-col justify-between">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary">data_usage</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Knowledge Base</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Explore our comprehensive graph of predictive toxicity, botanicals, and molecular mechanisms.</p>
            </div>
          </div>

          {/* Feature 4: Large Span */}
          <div id="card-aushnexa-ai" className="md:col-span-8 bg-surface-container/40 backdrop-blur-lg border border-outline-variant/30 rounded-3xl p-8 relative overflow-hidden group hover:border-outline-variant transition-colors duration-500">
            <div className="absolute inset-0 opacity-10 mix-blend-overlay">
              <img 
                alt="Data background" 
                className="w-full h-full object-cover" 
                data-alt="Abstract rendering of complex data streams and geometric grid lines in deep space. Cybernetic aesthetic in dark tones with subtle green highlights, conveying dense information architecture."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzN4B8xvAJNkNviOA43-Ra9rsJtik-ZtjYGtZWuqXJsO54jBqzZX9MN_MuwjvNwr_3oKW0zX4NYe-qtLGjJOkJV7M7vsgL2h1IMyoCaHB0kz2pUkZVdl_9J6ldYhmCf7bF8fr2AoBuSlUuwGdLNua15PceEyxRvAdo3Yf6j6-XobKH7_n_sljoIwKRc5YCDiU8Pb5eXvCuEYdk0mmhyBl1bjCPj0UpCTqrts7S8SUXUvUqLl8xoFgMjsDU92GLUKyfCcEbOeJTIbU" 
              />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-12 h-12 rounded-full bg-surface-bright flex items-center justify-center mb-6 border border-outline-variant">
                <span className="material-symbols-outlined text-on-surface">psychology</span>
              </div>
              <div>
                <div className="inline-block px-3 py-1 bg-surface-highest border border-outline-variant rounded-full font-technical-sm text-technical-sm text-on-surface-variant mb-4">Beta Feature</div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Generative Protocol Design</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md">Input patient baselines to generate custom integrative therapeutic protocols synthesized from global pharmacopeia standards.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Sections */}
      <section className="px-margin-mobile md:px-margin-desktop py-32 max-w-7xl mx-auto space-y-40 relative z-10">
        
        {/* Feature 1: Molecular Interaction Matrix */}
        <div id="interaction-matrix" className="flex flex-col lg:flex-row gap-16 items-center scroll-mt-32 group reveal-on-scroll opacity-0 translate-y-10 transition-all duration-1000 ease-out">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-light/10 border border-emerald-light/20 backdrop-blur-md">
              <span className="material-symbols-outlined text-emerald-light text-sm">device_hub</span>
              <span className="font-technical-sm text-xs text-emerald-light tracking-widest uppercase">Core Engine</span>
            </div>
            
            <h2 className="font-display-lg text-4xl md:text-5xl text-on-surface tracking-tight">
              Molecular <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-light to-[#0ECFB8]">Interaction Matrix</span>
            </h2>
            
            <p className="font-body-lg text-lg text-on-surface-variant leading-relaxed max-w-xl">
              Our core engine analyzes the pharmacological interactions between synthetic drugs and botanical compounds. By leveraging a vast graph database, it identifies potential cross-reactivities, severity levels, and underlying mechanisms of action.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {[
                { text: "Real-time interaction screening for complex regimens.", icon: "bolt" },
                { text: "Severity scoring from mild to critical with visual indicators.", icon: "warning" },
                { text: "Detailed mechanism paths explaining biochemical interactions.", icon: "account_tree" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container-low/40 border border-outline-variant/30 hover:border-emerald-light/30 transition-colors group/item sm:col-span-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-light/10 flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-emerald-light text-[18px]">{item.icon}</span>
                  </div>
                  <p className="font-body-md text-sm text-on-surface-variant pt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Holographic Visual Element */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none aspect-square relative flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-light/5 blur-[100px] rounded-full group-hover:bg-emerald-light/10 transition-colors duration-1000"></div>
            <div className="relative w-full h-full border border-emerald-light/20 rounded-[2rem] bg-surface-container-lowest/50 backdrop-blur-xl overflow-hidden shadow-[0_0_40px_rgba(24,201,106,0.1)] flex items-center justify-center">
              {/* Animated abstract graph rings */}
              <div className="absolute w-[120%] h-[120%] border-[1px] border-dashed border-emerald-light/20 rounded-full animate-[spin_60s_linear_infinite]"></div>
              <div className="absolute w-[80%] h-[80%] border-[1px] border-emerald-light/10 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
              <div className="absolute w-[40%] h-[40%] border-[2px] border-emerald-light/30 rounded-full glow-effect"></div>
              
              {/* Central Icon */}
              <div className="relative z-10 w-24 h-24 rounded-full bg-surface-container-highest/80 border border-emerald-light/40 flex items-center justify-center shadow-[0_0_30px_rgba(24,201,106,0.3)]">
                <span className="material-symbols-outlined text-5xl text-emerald-light">device_hub</span>
              </div>
              
              {/* Floating Data Nodes */}
              <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-[#0ECFB8] rounded-full shadow-[0_0_10px_#0ECFB8] animate-pulse"></div>
              <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-emerald-light rounded-full shadow-[0_0_10px_#18C96A] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>

        {/* Feature 2: Clinical Validation */}
        <div id="clinical-trials" className="flex flex-col lg:flex-row-reverse gap-16 items-center scroll-mt-32 group reveal-on-scroll opacity-0 translate-y-10 transition-all duration-1000 ease-out delay-100">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-saffron/10 border border-saffron/20 backdrop-blur-md">
              <span className="material-symbols-outlined text-saffron text-sm">biotech</span>
              <span className="font-technical-sm text-xs text-saffron tracking-widest uppercase">Evidence Based</span>
            </div>
            
            <h2 className="font-display-lg text-4xl md:text-5xl text-on-surface tracking-tight">
              Clinical <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron to-amber-500">Validation</span>
            </h2>
            
            <p className="font-body-lg text-lg text-on-surface-variant leading-relaxed max-w-xl">
              Access an extensive library of peer-reviewed clinical trials and studies that bridge the gap between traditional Ayurvedic knowledge and modern evidence-based medicine.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {[
                { text: "Search across thousands of documented clinical trials.", icon: "search" },
                { text: "View evidence quality ratings for specific herb-drug combinations.", icon: "star_rate" },
                { text: "Links directly to PubMed and clinical registries.", icon: "open_in_new" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container-low/40 border border-outline-variant/30 hover:border-saffron/30 transition-colors group/item sm:col-span-2">
                  <div className="w-10 h-10 rounded-full bg-saffron/10 flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-saffron text-[18px]">{item.icon}</span>
                  </div>
                  <p className="font-body-md text-sm text-on-surface-variant pt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg lg:max-w-none aspect-square relative flex items-center justify-center">
            <div className="absolute inset-0 bg-saffron/5 blur-[100px] rounded-full group-hover:bg-saffron/10 transition-colors duration-1000"></div>
            <div className="relative w-full h-full border border-saffron/20 rounded-[2rem] bg-surface-container-lowest/50 backdrop-blur-xl overflow-hidden shadow-[0_0_40px_rgba(232,150,12,0.1)] flex items-center justify-center">
              <div className="absolute w-[100%] h-[100%] border-[1px] border-dashed border-saffron/20 rounded-lg rotate-45 animate-[spin_80s_linear_infinite]"></div>
              <div className="absolute w-[70%] h-[70%] border-[1px] border-saffron/10 rounded-full animate-[spin_50s_linear_infinite_reverse]"></div>
              
              <div className="relative z-10 w-24 h-24 rounded-2xl bg-surface-container-highest/80 border border-saffron/40 flex items-center justify-center shadow-[0_0_30px_rgba(232,150,12,0.3)] rotate-12 group-hover:rotate-0 transition-transform duration-700">
                <span className="material-symbols-outlined text-5xl text-saffron">biotech</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Knowledge Base */}
        <div id="knowledge-base" className="flex flex-col lg:flex-row gap-16 items-center scroll-mt-32 group reveal-on-scroll opacity-0 translate-y-10 transition-all duration-1000 ease-out delay-200">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
              <span className="material-symbols-outlined text-primary text-sm">data_usage</span>
              <span className="font-technical-sm text-xs text-primary tracking-widest uppercase">Biological Graph</span>
            </div>
            
            <h2 className="font-display-lg text-4xl md:text-5xl text-on-surface tracking-tight">
              Knowledge <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Base</span>
            </h2>
            
            <p className="font-body-lg text-lg text-on-surface-variant leading-relaxed max-w-xl">
              Explore our comprehensive biological knowledge graph. Understand the active phytocompounds in Ayurvedic herbs and how they influence metabolic pathways, target receptors, and enzymes.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {[
                { text: "Interactive graph visualization of biological networks.", icon: "hub" },
                { text: "Detailed profiles for herbs, drugs, and isolated compounds.", icon: "menu_book" },
                { text: "Predictive toxicity models based on structural similarities.", icon: "science" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container-low/40 border border-outline-variant/30 hover:border-primary/30 transition-colors group/item sm:col-span-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary text-[18px]">{item.icon}</span>
                  </div>
                  <p className="font-body-md text-sm text-on-surface-variant pt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg lg:max-w-none aspect-square relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-colors duration-1000"></div>
            <div className="relative w-full h-full border border-primary/20 rounded-[2rem] bg-surface-container-lowest/50 backdrop-blur-xl overflow-hidden shadow-[0_0_40px_rgba(232,221,255,0.05)] flex items-center justify-center">
              {/* Hexagonal overlay pattern */}
              <div className="absolute inset-0 opacity-20 hex-bg mask-radial"></div>
              
              <div className="absolute w-[60%] h-[60%] border-[2px] border-primary/20 rounded-full glow-effect"></div>
              
              <div className="relative z-10 w-24 h-24 rounded-full bg-surface-container-highest/80 border border-primary/40 flex items-center justify-center shadow-[0_0_30px_rgba(207,188,255,0.2)]">
                <span className="material-symbols-outlined text-5xl text-primary">data_usage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 4: Generative Protocol Design */}
        <div id="aushnexa-ai" className="flex flex-col lg:flex-row-reverse gap-16 items-center scroll-mt-32 group reveal-on-scroll opacity-0 translate-y-10 transition-all duration-1000 ease-out delay-300">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#0ECFB8]/10 border border-[#0ECFB8]/20 backdrop-blur-md">
              <span className="material-symbols-outlined text-[#0ECFB8] text-sm">psychology</span>
              <span className="font-technical-sm text-xs text-[#0ECFB8] tracking-widest uppercase">AI Orchestrator</span>
            </div>
            
            <h2 className="font-display-lg text-4xl md:text-5xl text-on-surface tracking-tight">
              Generative <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ECFB8] to-emerald-light">Protocol Design</span>
            </h2>
            
            <p className="font-body-lg text-lg text-on-surface-variant leading-relaxed max-w-xl">
              Leverage the power of Aushnexa AI to generate personalized integrative therapeutic protocols. Input patient baselines, current medications, and conditions to receive safe, optimized recommendations.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {[
                { text: "Patient-specific context analysis (age, conditions, pregnancy).", icon: "person_search" },
                { text: "Automated multi-language explanation generation.", icon: "translate" },
                { text: "Safe dosage adjustments and holistic protocol suggestions.", icon: "medical_services" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container-low/40 border border-outline-variant/30 hover:border-[#0ECFB8]/30 transition-colors group/item sm:col-span-2">
                  <div className="w-10 h-10 rounded-full bg-[#0ECFB8]/10 flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[#0ECFB8] text-[18px]">{item.icon}</span>
                  </div>
                  <p className="font-body-md text-sm text-on-surface-variant pt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg lg:max-w-none aspect-square relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[#0ECFB8]/5 blur-[100px] rounded-full group-hover:bg-[#0ECFB8]/10 transition-colors duration-1000"></div>
            <div className="relative w-full h-full border border-[#0ECFB8]/20 rounded-[2rem] bg-surface-container-lowest/50 backdrop-blur-xl overflow-hidden shadow-[0_0_40px_rgba(14,207,184,0.1)] flex items-center justify-center">
              
              {/* Particle flow */}
              <div className="absolute w-[90%] h-[90%] border-t-[1px] border-l-[1px] border-[#0ECFB8]/30 rounded-full animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute w-[80%] h-[80%] border-b-[2px] border-r-[2px] border-emerald-light/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
              
              <div className="relative z-10 w-24 h-24 rounded-full bg-surface-container-highest/80 border border-[#0ECFB8]/40 flex items-center justify-center shadow-[0_0_30px_rgba(14,207,184,0.3)] group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-5xl text-[#0ECFB8]">psychology</span>
              </div>
              
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
