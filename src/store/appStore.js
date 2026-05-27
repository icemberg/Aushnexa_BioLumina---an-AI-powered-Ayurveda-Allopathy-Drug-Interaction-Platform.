import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * @typedef {Object} AppState
 * @property {string[]} currentItems       - medications/herbs being checked
 * @property {string}   selectedLanguage   - ISO 639-1 language code
 * @property {Object|null} currentResults  - last interaction check response
 * @property {Object|null} user            - authenticated user info
 * @property {string|null} token           - JWT access token
 * @property {boolean} isAuthenticated
 */

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Interaction checker state
      currentItems: [],
      selectedLanguage: 'en',
      currentResults: null,

      setCurrentItems: (items) => set({ currentItems: items }),
      addItem: (item) => {
        const { currentItems } = get()
        if (currentItems.length >= 10) return
        if (currentItems.includes(item)) return
        set({ currentItems: [...currentItems, item] })
      },
      removeItem: (item) =>
        set({ currentItems: get().currentItems.filter(i => i !== item) }),
      clearItems: () => set({ currentItems: [] }),

      setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),
      setCurrentResults: (results) => set({ currentResults: results }),
      clearResults: () => set({ currentResults: null }),

      // Auth state
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),
      clearAuth: () =>
        set({ user: null, token: null, isAuthenticated: false }),
        
      // AI History
      aiHistory: [],
      addAiHistory: (query, response) => {
        const { aiHistory } = get();
        // Insert at beginning, limit to 10
        const newHistory = [{ query, response, timestamp: Date.now() }, ...aiHistory].slice(0, 10);
        set({ aiHistory: newHistory });
      }
    }),
    {
      name: 'aushnexa-storage',
      // Only persist auth and language — do not persist results or currentItems
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        selectedLanguage: state.selectedLanguage
      }),
      storage: createJSONStorage(() => sessionStorage)
    }
  )
)
