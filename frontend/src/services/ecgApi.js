import api from './api'

export const ecgApi = {
  getByAdmission: (admissionId) => api.get(`/ecgs/admission/${admissionId}`),
  getById: (id) => api.get(`/ecgs/${id}`),
  create: (data) => api.post('/ecgs', data),
  complete: (id, data) => api.patch(`/ecgs/${id}/complete`, data),
  delete: (id) => api.delete(`/ecgs/${id}`),
}
