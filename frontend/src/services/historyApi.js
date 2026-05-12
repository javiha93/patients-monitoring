import api from './api'

export const historyApi = {
  getFullHistory: (patientId) => api.get(`/patients/${patientId}/history`),
  // Medical conditions
  addCondition: (patientId, data) => api.post(`/patients/${patientId}/history/conditions`, data),
  deleteCondition: (patientId, id) => api.delete(`/patients/${patientId}/history/conditions/${id}`),
  // Allergies
  addAllergy: (patientId, data) => api.post(`/patients/${patientId}/history/allergies`, data),
  deleteAllergy: (patientId, id) => api.delete(`/patients/${patientId}/history/allergies/${id}`),
  // Chronic medications
  addMedication: (patientId, data) => api.post(`/patients/${patientId}/history/medications`, data),
  toggleSuspended: (patientId, id) => api.patch(`/patients/${patientId}/history/medications/${id}/toggle-suspended`),
  deleteMedication: (patientId, id) => api.delete(`/patients/${patientId}/history/medications/${id}`),
  // Immunosuppression
  addImmunosuppression: (patientId, data) => api.post(`/patients/${patientId}/history/immunosuppressions`, data),
  deleteImmunosuppression: (patientId, id) => api.delete(`/patients/${patientId}/history/immunosuppressions/${id}`),
  // Surgical interventions
  addSurgery: (patientId, data) => api.post(`/patients/${patientId}/history/surgeries`, data),
  deleteSurgery: (patientId, id) => api.delete(`/patients/${patientId}/history/surgeries/${id}`),
}
