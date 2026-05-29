import { useAppStore } from '../store/appStore'
import { SUPPORTED_LANGUAGES } from '../constants'

export default function LanguageSelector() {
  const { selectedLanguage, setSelectedLanguage } = useAppStore()

  return (
    <div className="relative group/lang">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-primary text-[20px]">translate</span>
      </div>
      <select
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(e.target.value)}
        className="w-full bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-high border border-outline-variant/30 focus:border-primary text-on-surface font-technical-sm text-sm rounded-xl pl-12 pr-10 py-3 transition-all outline-none shadow-inner cursor-pointer appearance-none"
        aria-label="Select language"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-[#0f0e11] text-on-surface py-2">
            {lang.nativeLabel} ({lang.label})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-outline">
        <span className="material-symbols-outlined text-[20px] group-hover/lang:translate-y-0.5 transition-transform">arrow_drop_down</span>
      </div>
    </div>
  )
}
