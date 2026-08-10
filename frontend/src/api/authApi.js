import api from './axios';

export const authApi = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  getProfile: () => api.get('/users/me/'),
  updateProfile: (data) => api.patch('/users/me/', data),
  changePassword: (data) => api.post('/users/me/change-password/', data),
  searchUsers: (query) => api.get(`/users/search/?q=${encodeURIComponent(query)}`),
};
