import api from './axios';

export const expenseApi = {
  getExpenses: (params) => api.get('/expenses/', { params }),
  getExpense: (id) => api.get(`/expenses/${id}/`),
  createGroupExpense: (groupId, data) => api.post(`/expenses/group/${groupId}/`, data),
  getGroupExpenses: (groupId, params) => api.get(`/expenses/group/${groupId}/`, { params }),
  updateExpense: (id, data) => api.patch(`/expenses/${id}/`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}/`),
};
