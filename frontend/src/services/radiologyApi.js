import api from './api'

export const radiologyApi = {
  getByAdmission: (admissionId) => api.get(`/radiology/admission/${admissionId}`),
  getHistorical: (patientId, excludeAdmissionId) => api.get(`/radiology/patient/${patientId}/historical`, { params: { excludeAdmissionId } }),
  getById: (id) => api.get(`/radiology/${id}`),
  create: (data) => api.post('/radiology', data),
  complete: (id, data) => api.patch(`/radiology/${id}/complete`, data),
  delete: (id) => api.delete(`/radiology/${id}`),
}
