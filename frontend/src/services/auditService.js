import api from './api.js';

export const auditService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.delegationId) params.append('delegationId', filters.delegationId);
    if (filters.actionType) params.append('actionType', filters.actionType);
    if (filters.operator) params.append('operator', filters.operator);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const queryString = params.toString();
    const url = queryString ? `/audit-logs?${queryString}` : '/audit-logs';
    return await api.get(url);
  },

  async getByDelegationId(delegationId) {
    return await api.get(`/audit-logs/${delegationId}`);
  }
};
