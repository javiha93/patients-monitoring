import api from './api'

export const patientApi = {
  listActive: () => api.get('/patients'),
  listDischarged: (query) => api.get('/patients/discharged', { params: { query } }),
  getPatient: (id) => api.get(`/patients/${id}`),
  getAdmissions: (id) => api.get(`/patients/${id}/admissions`),
  create: (data) => api.post('/patients', data),
  discharge: (id, data) => api.post(`/patients/${id}/discharge`, data),
  searchByNhc: (nhc) => api.get('/patients/search-nhc', { params: { nhc } }),
  reopen: (id, params) =>
    api.post(`/patients/${id}/reopen`, null, { params }),
  updateLocation: (admissionId, location) =>
    api.patch(`/patients/admission/${admissionId}/location`, null, { params: { location } }),
  updateSpecialty: (admissionId, specialty) =>
    api.patch(`/patients/admission/${admissionId}/specialty`, null, { params: { specialty } }),
  updateObservations: (admissionId, observations) =>
    api.patch(`/patients/admission/${admissionId}/observations`, { observations }),
  assignNurse: (admissionId, name) =>
    api.patch(`/patients/admission/${admissionId}/assign-nurse`, { name }),
  assignDoctor: (admissionId, name) =>
    api.patch(`/patients/admission/${admissionId}/assign-doctor`, { name }),
  unassignNurse: (admissionId) =>
    api.patch(`/patients/admission/${admissionId}/unassign-nurse`),
  unassignDoctor: (admissionId) =>
    api.patch(`/patients/admission/${admissionId}/unassign-doctor`),
  updateTriage: (admissionId, data) =>
    api.patch(`/patients/admission/${admissionId}/triage`, data),
}
