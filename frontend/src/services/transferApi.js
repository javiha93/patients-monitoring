import api from './api'

export const transferApi = {
  list: () => api.get('/transfers'),
  create: (data) => api.post('/transfers', data),
  delete: (id) => api.delete(`/transfers/${id}`),
}
