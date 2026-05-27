import { useState, useRef, useEffect } from 'react'
import { X, Search, Loader2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { MAX_ITEMS } from '../constants'
import api from '../services/api'
import clsx from 'clsx'

export default function MedicationChipInput() {
  const { currentItems, addItem, removeItem } = useAppStore()
  const [inputValue, setInputValue] = useState('')
  const [isNormalizing, setIsNormalizing] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Handle typing and trigger debounced normalization search
  const handleInputChange = (e) => {
    const value = e.target.value
    setInputValue(value)
    setError(null)
    setSuggestions([])

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (value.trim().length > 2) {
      setIsNormalizing(true)
      typingTimeoutRef.current = setTimeout(() => {
        normalizeEntity(value.trim())
      }, 500)
    } else {
      setIsNormalizing(false)
    }
  }

  const normalizeEntity = async (query) => {
    try {
      const res = await api.get('/normalize', { params: { q: query } })
      const data = res.data

      // Build suggestions list: canonical first, then alternatives
      const newSuggestions = []
      if (data.canonical_name) {
        newSuggestions.push({
          name: data.canonical_name,
          type: data.entity_type,
          confidence: data.confidence
        })
      }
      if (data.alternatives && data.alternatives.length > 0) {
        data.alternatives.forEach(alt => {
          if (alt !== data.canonical_name) {
            newSuggestions.push({ name: alt, type: null, confidence: null })
          }
        })
      }
      setSuggestions(newSuggestions)
    } catch (err) {
      console.error('Normalization error:', err)
    } finally {
      setIsNormalizing(false)
    }
  }

  const handleSelectSuggestion = (suggestionName) => {
    if (currentItems.length >= MAX_ITEMS) {
      setError(`Maximum ${MAX_ITEMS} items allowed`)
      return
    }
    
    // Check for duplicates case-insensitively
    const isDuplicate = currentItems.some(i => i.toLowerCase() === suggestionName.toLowerCase())
    if (isDuplicate) {
      setInputValue('')
      setSuggestions([])
      return
    }

    addItem(suggestionName)
    setInputValue('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      // If we have a high-confidence suggestion, pick it, else take raw input
      if (suggestions.length > 0 && suggestions[0].confidence > 0.7) {
        handleSelectSuggestion(suggestions[0].name)
      } else {
        handleSelectSuggestion(inputValue.trim())
      }
    } else if (e.key === 'Backspace' && !inputValue && currentItems.length > 0) {
      // Remove last item if backspace pressed on empty input
      removeItem(currentItems[currentItems.length - 1])
    }
  }

  return (
    <div className="w-full">
      <div 
        className={clsx(
          "relative flex items-center flex-wrap gap-2 p-3 bg-white border rounded-xl shadow-sm transition-all",
          "focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary",
          error ? "border-red-300" : "border-gray-200"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="w-5 h-5 text-gray-400 ml-1" />
        
        {/* Render existing chips */}
        {currentItems.map((item) => (
          <span 
            key={item} 
            className="flex items-center px-3 py-1.5 bg-brand-light text-brand-primary text-sm font-medium rounded-full animate-in fade-in zoom-in duration-200"
          >
            {item}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeItem(item)
              }}
              className="ml-1.5 hover:bg-brand-primary/20 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={currentItems.length >= MAX_ITEMS}
          placeholder={currentItems.length === 0 ? "Type an herb (e.g. Ashwagandha) or drug..." : "Add another..."}
          className="flex-1 min-w-[200px] outline-none bg-transparent text-gray-800 placeholder-gray-400 disabled:opacity-50"
        />

        {isNormalizing && (
          <Loader2 className="w-4 h-4 text-brand-primary animate-spin absolute right-4" />
        )}

        {/* Autocomplete Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2">
            <ul className="max-h-60 overflow-auto py-1">
              {suggestions.map((s, idx) => (
                <li 
                  key={`${s.name}-${idx}`}
                  onClick={() => handleSelectSuggestion(s.name)}
                  className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex justify-between items-center group transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 group-hover:text-brand-primary transition-colors">
                      {s.name}
                    </span>
                    {s.type && (
                      <span className="text-xs text-gray-500 capitalize">{s.type}</span>
                    )}
                  </div>
                  
                  {s.confidence > 0.8 ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      Exact Match
                    </span>
                  ) : s.confidence > 0.5 ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      Suggestion
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-start mt-2 px-1">
        {error ? (
          <p className="text-xs text-red-600 animate-in fade-in">{error}</p>
        ) : (
          <p className="text-xs text-gray-500">
            Press Enter to add. E.g. Metformin, Ashwagandha, Amlodipine
          </p>
        )}
        <span className={clsx(
          "text-xs font-medium",
          currentItems.length >= MAX_ITEMS ? "text-red-500" : "text-gray-400"
        )}>
          {currentItems.length} / {MAX_ITEMS}
        </span>
      </div>
    </div>
  )
}
