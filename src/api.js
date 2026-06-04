const BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('未登录')
  }

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || '请求失败')
  }
  return data
}

export const api = {
  auth: {
    login: (name, password) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    }),
    me: () => request('/auth/me'),
    users: () => request('/auth/users'),
  },

  prescriptions: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request(`/prescriptions${qs ? `?${qs}` : ''}`)
    },
    stats: () => request('/prescriptions/stats'),
    get: (id) => request(`/prescriptions/${id}`),
    create: (data) => request('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateStatus: (id, status, note) => request(`/prescriptions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),
  },

  batches: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request(`/batches${qs ? `?${qs}` : ''}`)
    },
    stats: () => request('/batches/stats'),
    get: (id) => request(`/batches/${id}`),
    create: (data) => request('/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateStatus: (id, status, note) => request(`/batches/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),
    batchAction: (batch_ids, action, note) => request('/batches/batch-action', {
      method: 'POST',
      body: JSON.stringify({ batch_ids, action, note }),
    }),
  },

  labels: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request(`/labels${qs ? `?${qs}` : ''}`)
    },
    stats: () => request('/labels/stats'),
    get: (id) => request(`/labels/${id}`),
    updateStatus: (id, status, data = {}) => request(`/labels/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...data }),
    }),
    batchAction: (label_ids, action, data = {}) => request('/labels/batch-action', {
      method: 'POST',
      body: JSON.stringify({ label_ids, action, ...data }),
    }),
  },

  logs: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request(`/logs${qs ? `?${qs}` : ''}`)
    },
    timeline: (entity_type, entity_id) => request(`/logs/timeline/${entity_type}/${entity_id}`),
  },
}
