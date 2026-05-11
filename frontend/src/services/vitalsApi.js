import api from './api'

export const vitalsApi = {
  getByAdmission: (admissionId) => api.get(`/vitals/admission/${admissionId}`),
  getAllByPatient: (patientId) => api.get(`/vitals/patient/${patientId}`),
  getHistorical: (patientId, excludeAdmissionId, page = 0, size = 10) =>
    api.get(`/vitals/patient/${patientId}/historical`, { params: { excludeAdmissionId, page, size } }),
  create: (data) => api.post('/vitals', data),
  update: (id, data) => api.put(`/vitals/${id}`, data),
  delete: (id) => api.delete(`/vitals/${id}`),
}
