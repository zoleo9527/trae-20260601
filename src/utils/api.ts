const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  getDashboardStats: () => request('/dashboard/stats'),
  getLandlords: () => request('/landlords'),
  getLandlord: (id: string) => request(`/landlords/${id}`),
  getLandlordSummary: (id: string) => request(`/landlords/${id}/summary`),
  getProperties: () => request('/properties'),
  getProperty: (id: string) => request(`/properties/${id}`),
  getPropertyOrders: (id: string) => request(`/properties/${id}/orders`),
  getPropertyExpenses: (id: string) => request(`/properties/${id}/expenses`),
  getPropertyRepairs: (id: string) => request(`/properties/${id}/repairs`),
  getPropertyAdvances: (id: string) => request(`/properties/${id}/advances`),
  getPropertyBills: (id: string) => request(`/properties/${id}/bills`),
  getOrders: () => request('/orders'),
  getOrder: (id: string) => request(`/orders/${id}`),
  getExpenses: () => request('/expenses'),
  addExpense: (data: unknown) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  getRepairs: () => request('/repairs'),
  addRepair: (data: unknown) => request('/repairs', { method: 'POST', body: JSON.stringify(data) }),
  getAdvances: () => request('/advances'),
  addAdvance: (data: unknown) => request('/advances', { method: 'POST', body: JSON.stringify(data) }),
  getBills: () => request('/bills'),
  getBill: (id: string) => request(`/bills/${id}`),
  generateBill: (propertyId: string, year: number, month: number) =>
    request('/bills/generate', { method: 'POST', body: JSON.stringify({ propertyId, year, month }) }),
  updateBillStatus: (id: string, status: string) =>
    request(`/bills/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getDisputes: () => request('/disputes'),
  getDispute: (id: string) => request(`/disputes/${id}`),
  addDispute: (data: unknown) => request('/disputes', { method: 'POST', body: JSON.stringify(data) }),
  addDisputeMessage: (id: string, sender: string, content: string) =>
    request(`/disputes/${id}/messages`, { method: 'POST', body: JSON.stringify({ sender, content }) }),
  resolveDispute: (id: string, status: string, resolution: string) =>
    request(`/disputes/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ status, resolution }) }),
};
