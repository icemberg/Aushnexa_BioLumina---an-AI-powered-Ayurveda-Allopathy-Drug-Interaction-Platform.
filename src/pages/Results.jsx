import { useEffect, useState, useRef } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import RiskBadge from '../components/RiskBadge'
import InteractionCard from '../components/InteractionCard'
import { sortBySeverity } from '../utils/riskHelpers'
import { formatProcessingTime } from '../utils/formatters'
import { generateAudio } from '../services/api'

export default function Results() {
  const navigate = useNavigate()
  const { currentResults, selectedLanguage } = useAppStore()

  // Ensure we have results to display, otherwise go back to checker
  if (!currentResults) {
    return <Navigate to="/checker" replace />
  }

  const {
    overall_risk,
    overall_score,
    interactions = [],
    no_interactions = [],
    explanation,
    translated_explanation,
    normalized_items = [],
    processing_time_ms
  } = currentResults

  const sortedInteractions = sortBySeverity(interactions)

  // Voice Over State
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const audioRef = useRef(null)

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handlePlayAudio = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
      return
    }

    // Play if already loaded
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play()
      setIsPlaying(true)
      return
    }

    // Otherwise, fetch and load audio
    setIsLoadingAudio(true)
    const textToRead = selectedLanguage !== 'en' && translated_explanation ? translated_explanation : explanation
    
    try {
      const response = await generateAudio(textToRead, selectedLanguage)
      
      // We expect response.audios to be an array of base64 strings
      if (response && response.audios && response.audios.length > 0) {
        let currentAudioIndex = 0;
        
        const playNextAudio = () => {
          if (currentAudioIndex < response.audios.length) {
            const audioSrc = `data:audio/wav;base64,${response.audios[currentAudioIndex]}`;
            audioRef.current = new Audio(audioSrc);
            
            audioRef.current.onended = () => {
              currentAudioIndex++;
              playNextAudio();
            };
            
            audioRef.current.play();
          } else {
            // Finished playing all chunks
            setIsPlaying(false);
            audioRef.current = null; // Clear to allow replay from beginning
          }
        };
        
        setIsPlaying(true);
        playNextAudio();
      } else if (response && response.audio) {
        // Fallback for older format if ever cached
        const audioSrc = `data:audio/wav;base64,${response.audio}`
        audioRef.current = new Audio(audioSrc)
        
        audioRef.current.onended = () => {
          setIsPlaying(false)
        }
        
        audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Failed to generate audio", error)
      setIsPlaying(false)
    } finally {
      setIsLoadingAudio(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-10 font-body-md text-on-surface">
      {/* Background with Ken Burns animation */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none" style={{ backgroundColor: '#03070F' }}>
        <div className="absolute inset-0 bg-organic-gradient organic-bg opacity-30"></div>
        <div className="absolute top-0 left-1/4 w-3/4 h-3/4 bg-glow-saffron blur-[150px] opacity-20 z-0 pointer-events-none"></div>
      </div>
      
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/checker')}
          className="flex items-center text-on-surface-variant hover:text-primary font-label-caps text-label-caps transition-colors group"
        >
          <span className="material-symbols-outlined mr-2 text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Modify Matrix
        </button>
        
        <div className="font-technical-sm text-technical-sm text-outline-variant">
          Processed in {formatProcessingTime(processing_time_ms)}
        </div>
      </div>

      {/* Main Risk Summary */}
      <section className="glass-panel p-8 mb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-saffron to-emerald-light"></div>
        
        <h2 className="font-technical-sm text-technical-sm tracking-widest text-on-surface-variant uppercase mb-4 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-saffron">analytics</span>
          Overall Interaction Risk
        </h2>
        
        <div className="mb-6">
          <RiskBadge severity={overall_risk} score={overall_score} className="font-headline-md text-headline-md px-6 py-2" />
        </div>
        
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {normalized_items.map((item, idx) => (
            <span key={idx} className="bg-surface-container-high border border-outline-variant/30 text-on-surface font-technical-sm text-technical-sm px-4 py-2 rounded-lg">
              {item.canonical}
            </span>
          ))}
        </div>
      </section>

      {/* AI Explanation */}
      <section className="glass-panel p-8 mb-10 relative overflow-hidden border border-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="bg-surface-container-high border border-outline-variant p-2 rounded-xl shadow-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Clinical Intelligence Summary</h2>
          
          <button 
            onClick={handlePlayAudio}
            disabled={isLoadingAudio}
            className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
              isPlaying 
                ? 'bg-primary/20 border-primary/50 text-primary' 
                : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {isLoadingAudio ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : isPlaying ? (
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>stop</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>
            )}
            <span className="font-label-md text-sm">
              {isLoadingAudio ? 'Loading...' : isPlaying ? 'Stop' : 'Listen'}
            </span>
          </button>
        </div>
        
        <div className="space-y-4 relative z-10">
          {selectedLanguage !== 'en' && translated_explanation ? (
            <>
              <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">{translated_explanation}</p>
              <div className="pt-6 mt-6 border-t border-outline-variant/30">
                <p className="font-technical-sm text-technical-sm text-on-surface-variant mb-2">Original English Base:</p>
                <p className="font-body-md text-body-md text-on-surface/80">{explanation}</p>
              </div>
            </>
          ) : (
            <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">{explanation}</p>
          )}
        </div>
      </section>

      {/* Detailed Interactions */}
      <section className="space-y-6">
        <h2 className="font-display-sm text-display-sm text-on-surface mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px]">account_tree</span>
          Matrix Analysis Details
        </h2>
        
        {sortedInteractions.length === 0 ? (
          <div className="glass-panel p-12 text-center border-emerald-light/20">
            <span className="material-symbols-outlined text-6xl text-emerald-light mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <h3 className="font-headline-md text-headline-md text-emerald-light mb-2">No Documented Cross-Reactions</h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mx-auto">
              The proprietary knowledge graph did not identify any known interactions between these specific nodes. 
              However, continuous monitoring is advised.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedInteractions.map((interaction, idx) => (
              <InteractionCard key={idx} interaction={interaction} />
            ))}
          </div>
        )}

        {/* Safe Pairs */}
        {no_interactions.length > 0 && interactions.length > 0 && (
          <div className="mt-10 pt-8 border-t border-outline-variant/30">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-light">safety_check</span>
              Cleared Pairs
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {no_interactions.map((pair, idx) => (
                <div key={idx} className="bg-surface-container/50 rounded-xl p-4 border border-outline-variant/30 flex items-center justify-between hover:bg-surface-container-high transition-colors">
                  <span className="font-technical-sm text-technical-sm text-on-surface">
                    {pair.item_a} <span className="text-on-surface-variant mx-1">+</span> {pair.item_b}
                  </span>
                  <span className="material-symbols-outlined text-emerald-light text-[20px]">check</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
