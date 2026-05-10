import api from './api'

export const insightsApi = {
  getByPatientAdmission: (patientId, admissionId) =>
    api.get(`/insights/patient/${patientId}/admission/${admissionId}`),
}
