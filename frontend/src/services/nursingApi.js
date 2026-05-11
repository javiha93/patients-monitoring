import api from './api'

export const nursingApi = {
  getByAdmission: (admissionId) => api.get(`/nursing-assessments/admission/${admissionId}`),
  getHistorical: (patientId, excludeAdmissionId, page = 0, size = 5) =>
    api.get(`/nursing-assessments/patient/${patientId}/historical`, { params: { excludeAdmissionId, page, size } }),
  create: (data) => api.post('/nursing-assessments', data),
  update: (id, data) => api.put(`/nursing-assessments/${id}`, data),
  delete: (id) => api.delete(`/nursing-assessments/${id}`),
}
