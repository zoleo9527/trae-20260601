const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const ordersApi = {
  list: (params) => request(`/orders?${new URLSearchParams(params)}`),
  get: (id) => request(`/orders/${id}`),
  create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id, data) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  stats: () => request('/orders/stats'),
};

export const materialsApi = {
  list: (params) => request(`/materials?${new URLSearchParams(params)}`),
  create: (data) => request('/materials', { method: 'POST', body: JSON.stringify(data) }),
  review: (id, data) => request(`/materials/${id}/review`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const schedulesApi = {
  list: (params) => request(`/schedules?${new URLSearchParams(params)}`),
  update: (id, data) => request(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  batchResolve: (data) => request('/schedules/batch-resolve', { method: 'POST', body: JSON.stringify(data) }),
  channels: () => request('/schedules/channels'),
  calendar: (params) => request(`/schedules/calendar?${new URLSearchParams(params)}`),
  checkConflict: (data) => request('/schedules/check-conflict', { method: 'POST', body: JSON.stringify(data) }),
};

export const broadcastsApi = {
  list: (params) => request(`/broadcasts?${new URLSearchParams(params)}`),
  confirm: (id, data) => request(`/broadcasts/${id}/confirm`, { method: 'PUT', body: JSON.stringify(data) }),
};
