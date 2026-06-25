import { useQuery } from '@tanstack/react-query'
import { searchEvidence, getHerbProfile } from '../services/api'
import { useAppStore } from '../store/appStore'

export function useEvidenceData() {
  const currentResults = useAppStore(s => s.currentResults)
  
  // Extract herb and drug from currentResults if available
  let herbCanonical = ''
  let drugCanonical = ''
  
  if (currentResults && currentResults.normalized_items) {
    const herbs = currentResults.normalized_items.filter(item => item.entity_type === 'Herb')
    const drugs = currentResults.normalized_items.filter(item => item.entity_type === 'Drug')
    
    herbCanonical = herbs.length > 0 ? herbs[0].canonical : ''
    drugCanonical = drugs.length > 0 ? drugs[0].canonical : ''
    
    // Fallback if entity type isn't perfectly mapped
    if (!herbCanonical && !drugCanonical && currentResults.normalized_items.length >= 2) {
      herbCanonical = currentResults.normalized_items[0].canonical
      drugCanonical = currentResults.normalized_items[1].canonical
    }
  }

  // Clean names to improve search results (e.g. "Tulsi / Albahaca sagrada" -> "Tulsi")
  const cleanName = (name) => name ? name.split('/')[0].trim() : ''
  const searchHerb = cleanName(herbCanonical)
  const searchDrug = cleanName(drugCanonical)

  const { data: evidenceData, isLoading: isLoadingEvidence, error: evidenceError } = useQuery({
    queryKey: ['evidence', searchHerb, searchDrug],
    queryFn: () => searchEvidence({
      herb: searchHerb,
      drug: searchDrug,
      sources: 'clinicaltrials,pubmed,ctri,semantic,openalex,ictrp'
    }),
    enabled: !!(searchHerb || searchDrug)
  })

  const { data: herbProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['herbProfile', herbCanonical],
    queryFn: () => getHerbProfile(herbCanonical), // Keep full name for Neo4j profile lookup
    enabled: !!herbCanonical
  })

  return {
    evidenceData,
    isLoadingEvidence,
    evidenceError,
    herbProfile,
    isLoadingProfile,
    herbCanonical,
    drugCanonical
  }
}
