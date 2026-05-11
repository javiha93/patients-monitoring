import api from './api'

export const deviceApi = {
  getByAdmission: (admissionId) => api.get(`/devices/admission/${admissionId}`),
  create: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  delete: (id) => api.delete(`/devices/${id}`),
  hasActiveByType: (admissionId, type) => api.get(`/devices/admission/${admissionId}/has-active`, { params: { type } }),
  getActiveDrains: (admissionId) => api.get(`/devices/admission/${admissionId}/active-drains`),
}
