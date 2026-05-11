import api from './api'

export const nursingApi = {
  getByAdmission: (admissionId) => api.get(`/nursing-assessments/admission/${admissionId}`),
  create: (data) => api.post('/nursing-assessments', data),
  update: (id, data) => api.put(`/nursing-assessments/${id}`, data),
  delete: (id) => api.delete(`/nursing-assessments/${id}`),
}
