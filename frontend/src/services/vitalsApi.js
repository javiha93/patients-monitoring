import api from './api'

export const vitalsApi = {
  getByAdmission: (admissionId) => api.get(`/vitals/admission/${admissionId}`),
  getAllByPatient: (patientId) => api.get(`/vitals/patient/${patientId}`),
  create: (data) => api.post('/vitals', data),
}
