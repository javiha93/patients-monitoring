import api from './api'

export const prescriptionApi = {
  getByAdmission: (admissionId) => api.get(`/prescriptions/admission/${admissionId}`),
  getActiveByAdmission: (admissionId) => api.get(`/prescriptions/admission/${admissionId}/active`),
  create: (data) => api.post('/prescriptions', data),
  deactivate: (id) => api.patch(`/prescriptions/${id}/deactivate`),
  updateDose: (id, newAmount, changedBy, reason) =>
    api.patch(`/prescriptions/${id}/dose`, null, { params: { newAmount, changedBy, reason } }),
  sign: (data) => api.post('/prescriptions/sign', data),
  updateAdministration: (administrationId, data) =>
    api.patch(`/prescriptions/administration/${administrationId}`, null, { params: data }),
  unsign: (administrationId) => api.delete(`/prescriptions/unsign/${administrationId}`),
}
