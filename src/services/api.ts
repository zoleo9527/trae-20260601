const API_BASE = '/api'

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

export const api = {
  purchaseOrders: {
    getAll: () => request('/purchases'),
    get: (id) => request(`/purchases/${id}`),
    create: (data) => request('/purchases', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/purchases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  
  acceptance: {
    process: (purchaseId, data) => request(`/acceptance/${purchaseId}`, { method: 'POST', body: JSON.stringify(data) }),
    resubmit: (purchaseId, data) => request(`/acceptance/${purchaseId}/resubmit`, { method: 'POST', body: JSON.stringify(data) }),
  },
  
  samples: {
    submit: (purchaseId, data) => request(`/samples/${purchaseId}`, { method: 'POST', body: JSON.stringify(data) }),
    confirm: (purchaseId, data) => request(`/samples/${purchaseId}/confirm`, { method: 'POST', body: JSON.stringify(data) }),
  },
  
  exceptions: {
    get: (purchaseId) => request(`/exceptions/${purchaseId}`),
    addComment: (purchaseId, exceptionId, data) => 
      request(`/exceptions/${purchaseId}/comments/${exceptionId}`, { method: 'POST', body: JSON.stringify(data) }),
    resolve: (purchaseId, exceptionId, data) => 
      request(`/exceptions/${purchaseId}/resolve/${exceptionId}`, { method: 'POST', body: JSON.stringify(data) }),
  },
  
  disputes: {
    raise: (purchaseId, data) => request(`/disputes/${purchaseId}/raise`, { method: 'POST', body: JSON.stringify(data) }),
    mediate: (purchaseId, data) => request(`/disputes/${purchaseId}/mediate`, { method: 'POST', body: JSON.stringify(data) }),
    addComment: (purchaseId, data) => 
      request(`/disputes/${purchaseId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  },
  
  users: {
    getAll: () => request('/users'),
  },
}
