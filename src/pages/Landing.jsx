import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main className="flex-grow relative z-10">
      {/* Deep Organic Background Elements */}
      <div className="fixed inset-0 z-0 bg-organic-gradient organic-bg pointer-events-none"></div>
      <div className="fixed top-0 left-1/4 w-3/4 h-3/4 bg-glow-saffron blur-3xl opacity-50 z-0 pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-3/4 h-3/4 bg-glow-emerald blur-3xl opacity-30 z-0 pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative min-h-[921px] flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop py-24 md:py-32 overflow-hidden">
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
                className="ml-auto bg-primary text-on-primary px-6 py-3 rounded-xl font-label-caps text-label-caps hover:scale-105 transition-all duration-300 flex items-center gap-2"
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
      <section className="px-margin-mobile md:px-margin-desktop py-24 max-w-container-max mx-auto space-y-32">
        <div id="interaction-matrix" className="flex flex-col md:flex-row gap-12 items-center scroll-mt-24">
          <div className="flex-1">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">Molecular Interaction Matrix</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-4">
              Our core engine analyzes the pharmacological interactions between synthetic drugs and botanical compounds. 
              By leveraging a vast graph database, it identifies potential cross-reactivities, severity levels, and 
              underlying mechanisms of action.
            </p>
            <ul className="list-disc list-inside text-on-surface-variant font-body-md space-y-2">
              <li>Real-time interaction screening for complex regimens.</li>
              <li>Severity scoring from mild to critical with visual indicators.</li>
              <li>Detailed mechanism paths explaining the biochemical interactions.</li>
            </ul>
          </div>
          <div className="flex-1 bg-surface-container/30 rounded-3xl h-64 flex items-center justify-center border border-outline-variant/30 w-full">
            <span className="material-symbols-outlined text-[64px] text-emerald-light opacity-50">device_hub</span>
          </div>
        </div>

        <div id="clinical-trials" className="flex flex-col md:flex-row-reverse gap-12 items-center scroll-mt-24">
          <div className="flex-1">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">Clinical Validation</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-4">
              Access an extensive library of peer-reviewed clinical trials and studies that bridge the gap between 
              traditional Ayurvedic knowledge and modern evidence-based medicine.
            </p>
            <ul className="list-disc list-inside text-on-surface-variant font-body-md space-y-2">
              <li>Search across thousands of documented clinical trials.</li>
              <li>View evidence quality ratings for specific herb-drug combinations.</li>
              <li>Links directly to PubMed and clinical registries.</li>
            </ul>
          </div>
          <div className="flex-1 bg-surface-container/30 rounded-3xl h-64 flex items-center justify-center border border-outline-variant/30 w-full">
            <span className="material-symbols-outlined text-[64px] text-saffron opacity-50">biotech</span>
          </div>
        </div>

        <div id="knowledge-base" className="flex flex-col md:flex-row gap-12 items-center scroll-mt-24">
          <div className="flex-1">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">Knowledge Base</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-4">
              Explore our comprehensive biological knowledge graph. Understand the active phytocompounds in Ayurvedic 
              herbs and how they influence metabolic pathways, target receptors, and enzymes.
            </p>
            <ul className="list-disc list-inside text-on-surface-variant font-body-md space-y-2">
              <li>Interactive graph visualization of biological networks.</li>
              <li>Detailed profiles for herbs, drugs, and isolated compounds.</li>
              <li>Predictive toxicity models based on structural similarities.</li>
            </ul>
          </div>
          <div className="flex-1 bg-surface-container/30 rounded-3xl h-64 flex items-center justify-center border border-outline-variant/30 w-full">
            <span className="material-symbols-outlined text-[64px] text-primary opacity-50">data_usage</span>
          </div>
        </div>

        <div id="aushnexa-ai" className="flex flex-col md:flex-row-reverse gap-12 items-center scroll-mt-24">
          <div className="flex-1">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">Generative Protocol Design</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-4">
              Leverage the power of Aushnexa AI to generate personalized integrative therapeutic protocols. 
              Input patient baselines, current medications, and conditions to receive safe, optimized recommendations.
            </p>
            <ul className="list-disc list-inside text-on-surface-variant font-body-md space-y-2">
              <li>Patient-specific context analysis (age, conditions, pregnancy).</li>
              <li>Automated multi-language explanation generation.</li>
              <li>Safe dosage adjustments and holistic protocol suggestions.</li>
            </ul>
          </div>
          <div className="flex-1 bg-surface-container/30 rounded-3xl h-64 flex items-center justify-center border border-outline-variant/30 w-full">
            <span className="material-symbols-outlined text-[64px] text-on-surface opacity-50">psychology</span>
          </div>
        </div>
      </section>
    </main>
  );
}
