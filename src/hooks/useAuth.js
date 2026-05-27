import { useMutation, useQuery } from '@tanstack/react-query'
import { login, register, getProfile } from '../services/auth'
import { useAppStore } from '../store/appStore'
import { useNavigate } from 'react-router-dom'

export function useLogin() {
  const setAuth = useAppStore(s => s.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ email, password }) => login(email, password),
    onSuccess: (data) => {
      setAuth(data.user, data.access_token)
      navigate('/checker')
    }
  })
}

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ email, password, fullName }) => register(email, password, fullName),
    onSuccess: () => {
      navigate('/login?registered=true')
    }
  })
}

export function useProfile() {
  const isAuthenticated = useAppStore(s => s.isAuthenticated)

  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}
