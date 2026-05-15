import api from './api'

export const notificationApi = {
  getUnseenLab: (username) =>
    api.get('/notifications/lab/unseen', { params: { username } }),
  markAllSeen: (username) =>
    api.post('/notifications/lab/mark-seen', null, { params: { username } }),
  markSeenForAdmission: (admissionId, username) =>
    api.post(`/notifications/lab/mark-seen/${admissionId}`, null, { params: { username } }),
}
