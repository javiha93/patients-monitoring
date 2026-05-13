import api from './api'

export const labTestApi = {
  getByAdmission: (admissionId) => api.get(`/lab-tests/admission/${admissionId}`),
  getHistorical: (patientId, excludeAdmissionId) => api.get(`/lab-tests/patient/${patientId}/historical`, { params: { excludeAdmissionId } }),
  getById: (id) => api.get(`/lab-tests/${id}`),
  create: (data) => api.post('/lab-tests', data),
  update: (id, data) => api.put(`/lab-tests/${id}`, data),
  validate: (id, data) => api.patch(`/lab-tests/${id}/validate`, data),
  updateStatus: (id, status) => api.patch(`/lab-tests/${id}/status`, { status }),
  addResults: (id, results) => api.post(`/lab-tests/${id}/results`, results),
  delete: (id) => api.delete(`/lab-tests/${id}`),
}
