import api from './api'

export const patientApi = {
  listActive: () => api.get('/patients'),
  listDischarged: (query) => api.get('/patients/discharged', { params: { query } }),
  getPatient: (id) => api.get(`/patients/${id}`),
  getAdmissions: (id) => api.get(`/patients/${id}/admissions`),
  create: (data) => api.post('/patients', data),
  discharge: (id, data) => api.post(`/patients/${id}/discharge`, data),
  reopen: (id, triageLevel, matCategory) =>
    api.post(`/patients/${id}/reopen`, null, { params: { triageLevel, matCategory } }),
  updateLocation: (admissionId, location) =>
    api.patch(`/patients/admission/${admissionId}/location`, null, { params: { location } }),
}
