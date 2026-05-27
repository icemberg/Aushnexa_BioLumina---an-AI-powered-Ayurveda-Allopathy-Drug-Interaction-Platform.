import { useMutation } from '@tanstack/react-query'
import { checkInteractions } from '../services/api'
import { useAppStore } from '../store/appStore'
import { useNavigate } from 'react-router-dom'

/**
 * Hook for submitting an interaction check
 * Stores results in global Zustand store on success
 */
export function useInteractionCheck() {
  const setCurrentResults = useAppStore(s => s.setCurrentResults)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: checkInteractions,
    onSuccess: (data) => {
      setCurrentResults(data)
      navigate('/results')
    }
  })
}
