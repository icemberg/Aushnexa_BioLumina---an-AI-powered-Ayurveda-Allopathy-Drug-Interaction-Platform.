import api from './api'

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data)

export const register = (email, password, full_name = '', role = 'PATIENT') =>
  api.post('/auth/register', { email, password, full_name, role }).then(r => r.data)

export const getProfile = () =>
  api.get('/auth/profile').then(r => r.data)
