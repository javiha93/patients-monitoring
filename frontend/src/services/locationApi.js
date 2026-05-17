import api from './api'

export const locationApi = {
  getAllStatus: () => api.get('/locations/status'),
  updateStatus: (location, data) => api.patch(`/locations/${location}/status`, data),
}
