import api from './api'

export const deviceApi = {
  getByAdmission: (admissionId) => api.get(`/devices/admission/${admissionId}`),
  create: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  delete: (id) => api.delete(`/devices/${id}`),
}
