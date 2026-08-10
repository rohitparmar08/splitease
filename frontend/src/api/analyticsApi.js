import api from './axios';

export const analyticsApi = {
  getDashboardAnalytics: () => api.get('/analytics/dashboard/'),
  getGroupAnalytics: (groupId) => api.get(`/analytics/group/${groupId}/`),
};
