import api from './api.js';

export const delegationService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.isAbnormal !== undefined) params.append('isAbnormal', filters.isAbnormal);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const queryString = params.toString();
    const url = queryString ? `/delegations?${queryString}` : '/delegations';
    return await api.get(url);
  },

  async getById(id) {
    return await api.get(`/delegations/${id}`);
  },

  async create(data) {
    return await api.post('/delegations', data);
  },

  async update(id, data) {
    return await api.put(`/delegations/${id}`, data);
  },

  async updateStatus(id, newStatus, remarks) {
    return await api.put(`/delegations/${id}/status`, { newStatus, remarks });
  },

  async updateMaterialVerification(delegationId, materialId, verificationStatus, verificationNotes) {
    return await api.put(`/delegations/${delegationId}/materials/${materialId}`, {
      verificationStatus,
      verificationNotes
    });
  }
};
