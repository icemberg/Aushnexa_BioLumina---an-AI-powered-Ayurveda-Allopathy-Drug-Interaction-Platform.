import { useAppStore } from '../store/appStore'
import { SUPPORTED_LANGUAGES } from '../constants'
import { Globe } from 'lucide-react'

export default function LanguageSelector() {
  const { selectedLanguage, setSelectedLanguage } = useAppStore()

  return (
    <div className="relative flex items-center bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200/50 shadow-sm px-3 py-1.5 hover:bg-white/80 transition-colors">
      <Globe className="h-4 w-4 text-gray-500 mr-2" />
      <select
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(e.target.value)}
        className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer appearance-none pr-4"
        aria-label="Select language"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeLabel} ({lang.label})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  )
}
