import api from './axios';

export const settlementApi = {
  getUserSettlements: () => api.get('/settlements/'),
  getGroupSettlements: (groupId) => api.get(`/settlements/group/${groupId}/`),
  createGroupSettlement: (groupId, data) => api.post(`/settlements/group/${groupId}/`, data),
};
