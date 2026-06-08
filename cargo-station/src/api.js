const BASE = '/api'

async function request(url, options = {}) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export const api = {
  acceptance: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request(`/acceptance${qs ? '?' + qs : ''}`)
    },
    get: (id) => request(`/acceptance/${id}`),
    create: (data) => request('/acceptance', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, data) => request(`/acceptance/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    personnel: () => request('/acceptance/personnel/list'),
    statuses: () => request('/acceptance/meta/statuses'),
  },
  verification: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request(`/verification${qs ? '?' + qs : ''}`)
    },
    get: (id) => request(`/verification/${id}`),
    verify: (id, data) => request(`/verification/${id}/verify`, { method: 'PUT', body: JSON.stringify(data) }),
    submitDoc: (id, data) => request(`/verification/${id}/submit-doc`, { method: 'PUT', body: JSON.stringify(data) }),
    complete: (id, data) => request(`/verification/${id}/complete`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  audit: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request(`/audit${qs ? '?' + qs : ''}`)
    },
    stats: () => request('/audit/stats'),
  },
}
