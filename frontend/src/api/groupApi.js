import api from './axios';

export const groupApi = {
  getGroups: () => api.get('/groups/'),
  createGroup: (data) => api.post('/groups/', data),
  getGroup: (id) => api.get(`/groups/${id}/`),
  updateGroup: (id, data) => api.patch(`/groups/${id}/`, data),
  deleteGroup: (id) => api.delete(`/groups/${id}/`),
  addMember: (id, data) => api.post(`/groups/${id}/members/`, data),
  removeMember: (id, userId) => api.delete(`/groups/${id}/members/${userId}/`),
  getGroupBalances: (id) => api.get(`/groups/${id}/balances/`),
};
