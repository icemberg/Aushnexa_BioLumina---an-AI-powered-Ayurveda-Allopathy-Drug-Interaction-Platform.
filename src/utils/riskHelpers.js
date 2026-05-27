/**
 * Risk Assessment Helpers
 * Utilities for formatting and sorting risk data
 */

import { RISK_COLORS } from '../constants'

/**
 * Returns Tailwind class string for a given severity level
 * @param {string} severity - 'critical' | 'high' | 'moderate' | 'low'
 * @returns {string}
 */
export function getRiskColorClass(severity) {
  const key = severity?.toLowerCase() ?? 'unknown'
  return RISK_COLORS[key] ?? RISK_COLORS.unknown
}

/**
 * Returns human-readable confidence label
 * @param {number} confidence - 0.0 to 1.0
 * @returns {string}
 */
export function formatConfidence(confidence) {
  if (confidence >= 0.80) return 'High confidence'
  if (confidence >= 0.50) return 'Moderate confidence'
  if (confidence >= 0.30) return 'Low confidence'
  return 'Very low confidence — theoretical only'
}

/**
 * Sorts interactions by severity score descending
 * @param {Array} interactions
 * @returns {Array}
 */
export function sortBySeverity(interactions) {
  const order = { critical: 4, high: 3, moderate: 2, low: 1 }
  return [...interactions].sort((a, b) => {
    return (order[b.severity] ?? 0) - (order[a.severity] ?? 0)
  })
}
