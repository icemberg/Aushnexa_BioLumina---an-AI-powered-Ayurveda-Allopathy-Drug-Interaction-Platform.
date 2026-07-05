import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import { useAppStore } from '../store/appStore'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: 'http://localhost:8000/v1',
  timeout: 60000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
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
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Network error: Unable to reach the server. Please check your connection.', { id: 'network-err' })
    } else if (error.response?.status >= 500) {
      toast.error('Internal server error. Our team has been notified.', { id: 'server-err' })
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

export const logoutUser = () =>
  api.post('/auth/logout').then(r => r.data)

export const generateAudio = (text, language) =>
  api.post('/ai/tts', { text, language }).then(r => r.data)

export default api
