import api from './axios';

export const notificationApi = {
  getNotifications: () => api.get('/notifications/'),
  markRead: (id) => api.patch(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/read-all/'),
};
