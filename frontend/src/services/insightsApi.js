import api from './api'

export const insightsApi = {
  getByPatientAdmission: (patientId, admissionId) =>
    api.get(`/insights/patient/${patientId}/admission/${admissionId}`),

  dismiss: (admissionId, data) =>
    api.post(`/insights/admission/${admissionId}/dismiss`, data),

  getDismissals: (admissionId) =>
    api.get(`/insights/admission/${admissionId}/dismissals`),

  getReport: (admissionId) =>
    api.get(`/insights/admission/${admissionId}/report`),

  getDismissalSummaries: () =>
    api.get('/insights/dismissals/summary'),
}
