import { useQuery } from '@tanstack/react-query'
import { fetchHistory } from '../services/api'
import { useAppStore } from '../store/appStore'

export function useHistory(page = 1, limit = 20) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated)

  return useQuery({
    queryKey: ['history', page, limit],
    queryFn: () => fetchHistory(page, limit),
    enabled: isAuthenticated,
    keepPreviousData: true,
  })
}
