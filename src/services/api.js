import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import { useAppStore } from '../store/appStore'

const api = axios.create({
  baseURL: '/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const store = useAppStore.getState()
  const token = store.token
  
  if (token) {
    try {
      const decoded = jwtDecode(token)
      if (decoded.exp * 1000 < Date.now()) {
        store.clearAuth()
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(new Error("Token expired"))
      }
      config.headers.Authorization = `Bearer ${token}`
    } catch (e) {
      // Invalid token format
      store.clearAuth()
    }
  }
  return config
})

// Handle 401 by clearing auth and redirecting to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAppStore.getState().clearAuth()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Check drug-herb interactions
 * @param {Object} payload
 * @param {string[]} payload.items
 * @param {string}   payload.language
 * @param {Object}   [payload.patient_context]
 * @returns {Promise<Object>}
 */
export const checkInteractions = (payload) =>
  api.post('/check-interactions', payload).then(r => r.data)

/**
 * Fetch user's query history
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
export const fetchHistory = (page = 1, limit = 20) =>
  api.get('/history', { params: { page, limit } }).then(r => r.data)

/**
 * Translate text using Sarvam
 * @param {string} text
 * @param {string} targetLang
 * @returns {Promise<Object>}
 */
export const translateText = (text, targetLang) =>
  api.post('/translate', { text, target_language: targetLang })
     .then(r => r.data)

/**
 * Fetch evidence from multiple sources
 * @param {Object} params
 * @param {string} params.herb
 * @param {string} params.drug
 * @param {string} params.compounds
 * @param {string} params.sources
 * @returns {Promise<Object>}
 */
export const searchEvidence = (params) =>
  api.get('/evidence/search', { params }).then(r => r.data)

/**
 * Fetch herb profile
 * @param {string} botanicalName
 * @returns {Promise<Object>}
 */
export const getHerbProfile = (botanicalName) =>
  api.get(`/herb/${botanicalName}/profile`).then(r => r.data)

// --- Knowledge Graph Endpoints ---

export const getKnowledgeGraph = () =>
  api.get('/knowledge/graph').then(r => r.data)

export const getKnowledgeNode = (nodeId) =>
  api.get('/knowledge/node', { params: { id: nodeId } }).then(r => r.data)

export const tracePathway = (from, to) =>
  api.get('/knowledge/pathway', { params: { from, to } }).then(r => r.data)

export const searchKnowledge = (q) =>
  api.get('/knowledge/search', { params: { q } }).then(r => r.data)

export default api
