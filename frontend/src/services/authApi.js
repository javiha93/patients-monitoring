import api from './api'

export const login = (username, password, role) =>
  api.post('/auth/login', { username, password, role }).then(r => r.data)

export const getUser = (id) =>
  api.get(`/auth/user/${id}`).then(r => r.data)
