import api from './api'

export const vitalsApi = {
  getByAdmission: (admissionId) => api.get(`/vitals/admission/${admissionId}`),
  getAllByPatient: (patientId) => api.get(`/vitals/patient/${patientId}`),
  create: (data) => api.post('/vitals', data),
  update: (id, data) => api.put(`/vitals/${id}`, data),
  delete: (id) => api.delete(`/vitals/${id}`),
}
