import api from './api'

export const notificationApi = {
  // Lab notifications
  getUnseenLab: (username) =>
    api.get('/notifications/lab/unseen', { params: { username } }),
  markAllSeen: (username) =>
    api.post('/notifications/lab/mark-seen', null, { params: { username } }),
  markSeenForAdmission: (admissionId, username) =>
    api.post(`/notifications/lab/mark-seen/${admissionId}`, null, { params: { username } }),

  // Medication notifications
  getUnseenMed: (username) =>
    api.get('/notifications/med/unseen', { params: { username } }),
  markAllMedSeen: (username) =>
    api.post('/notifications/med/mark-seen', null, { params: { username } }),
  markMedSeenForAdmission: (admissionId, username) =>
    api.post(`/notifications/med/mark-seen/${admissionId}`, null, { params: { username } }),
}
