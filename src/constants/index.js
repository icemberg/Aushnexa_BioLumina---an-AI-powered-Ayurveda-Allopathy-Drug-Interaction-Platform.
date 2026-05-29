/**
 * Aushnexa Constants
 *
 * Centralized configuration for risk colors, evidence labels,
 * supported languages, example queries, and disclaimers.
 */

/** Tailwind class mappings for risk severity levels */
export const RISK_COLORS = {
  critical: 'bg-error-container/20 text-error-red border-error-red/30 shadow-[0_0_10px_rgba(255,84,73,0.2)]',
  high:     'bg-[#E8960C]/20 text-[#E8960C] border-[#E8960C]/30 shadow-[0_0_10px_rgba(232,150,12,0.2)]',
  moderate: 'bg-saffron/20 text-saffron border-saffron/30 shadow-[0_0_10px_rgba(233,189,104,0.2)]',
  low:      'bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_rgba(207,188,255,0.2)]',
  unknown:  'bg-surface-container-highest/50 text-on-surface-variant border-outline-variant/30',
}

/** Solid background variants for badges */
export const RISK_BG_COLORS = {
  critical: 'bg-red-600',
  high:     'bg-orange-500',
  moderate: 'bg-amber-500',
  low:      'bg-green-500',
  unknown:  'bg-gray-400',
}

/** Dot indicator colors */
export const RISK_DOT_COLORS = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  moderate: 'bg-amber-500',
  low:      'bg-green-500',
  unknown:  'bg-gray-400',
}

/** Evidence level descriptions and certainty ratings */
export const EVIDENCE_LABELS = {
  1: { label: 'Test tube study',     certainty: 'Very low',      icon: '🧪' },
  2: { label: 'Animal study',        certainty: 'Low',           icon: '🐁' },
  3: { label: 'Case report',         certainty: 'Low–moderate',  icon: '📋' },
  4: { label: 'Observational study', certainty: 'Moderate',      icon: '📊' },
  5: { label: 'Clinical trial',      certainty: 'High',          icon: '🏥' },
  6: { label: 'Meta-analysis',       certainty: 'Very high',     icon: '📚' },
}

/** Supported UI languages with native script labels */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English',           nativeLabel: 'English' },
  { code: 'hi-IN', label: 'Hindi',             nativeLabel: 'हिंदी' },
  { code: 'ta-IN', label: 'Tamil',             nativeLabel: 'தமிழ்' },
  { code: 'te-IN', label: 'Telugu',            nativeLabel: 'తెలుగు' },
  { code: 'mr-IN', label: 'Marathi',           nativeLabel: 'मराठी' },
  { code: 'kn-IN', label: 'Kannada',           nativeLabel: 'ಕನ್ನಡ' },
  { code: 'bn-IN', label: 'Bengali',           nativeLabel: 'বাংলা' },
  { code: 'ml-IN', label: 'Malayalam',         nativeLabel: 'മലയാളం' },
]

/** Pre-built example queries for the landing page */
export const EXAMPLE_QUERIES = [
  {
    label: 'Ashwagandha + Metformin',
    items: ['Ashwagandha', 'Metformin'],
    description: 'Common herb-drug pair for diabetic patients',
  },
  {
    label: 'Turmeric + Warfarin',
    items: ['Turmeric', 'Warfarin'],
    description: 'Potential bleeding risk interaction',
  },
  {
    label: 'Giloy + Insulin',
    items: ['Giloy', 'Insulin'],
    description: 'Blood sugar lowering combination',
  },
  {
    label: 'Brahmi + Levothyroxine',
    items: ['Brahmi', 'Levothyroxine'],
    description: 'Thyroid medication with nootropic herb',
  },
]

/** Medical disclaimer shown across the app */
export const DISCLAIMER_TEXT =
  'Aushnexa provides information only and does not replace professional ' +
  'medical advice. Always consult your doctor or pharmacist before ' +
  'combining medications or herbal supplements.'

/** Loading step labels for the interaction checker */
export const LOADING_STEPS = [
  'Identifying medications and herbs',
  'Checking knowledge graph for interactions',
  'Computing risk scores',
  'Generating explanation',
]

/** Maximum items allowed in a single interaction check */
export const MAX_ITEMS = 10

/** Minimum items required for interaction check */
export const MIN_ITEMS = 2
