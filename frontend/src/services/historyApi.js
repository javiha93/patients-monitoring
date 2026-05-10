import api from './api'

export const historyApi = {
  getFullHistory: (patientId) => api.get(`/patients/${patientId}/history`),
  addCondition: (patientId, data) => api.post(`/patients/${patientId}/history/conditions`, data),
  deleteCondition: (patientId, id) => api.delete(`/patients/${patientId}/history/conditions/${id}`),
  addAllergy: (patientId, data) => api.post(`/patients/${patientId}/history/allergies`, data),
  deleteAllergy: (patientId, id) => api.delete(`/patients/${patientId}/history/allergies/${id}`),
  addMedication: (patientId, data) => api.post(`/patients/${patientId}/history/medications`, data),
  toggleSuspended: (patientId, id) => api.patch(`/patients/${patientId}/history/medications/${id}/toggle-suspended`),
  deleteMedication: (patientId, id) => api.delete(`/patients/${patientId}/history/medications/${id}`),
}
