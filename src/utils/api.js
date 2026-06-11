async function req(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error || '请求失败')
  }
  return res.json()
}

export const api = {
  getRecords: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return req(`/api/records${q ? '?' + q : ''}`)
  },
  getStats: (role) => req(`/api/records/stats?role=${role}`),
  getRecord: (id) => req(`/api/records/${id}`),
  dispatch: (id, body) => req(`/api/records/${id}/dispatch`, { method: 'POST', body: JSON.stringify(body) }),
  rectify: (id, body) => req(`/api/records/${id}/rectify`, { method: 'POST', body: JSON.stringify(body) }),
  reinspect: (id, body) => req(`/api/records/${id}/reinspect`, { method: 'POST', body: JSON.stringify(body) }),
  batchDispatch: (body) => req('/api/records/batch-dispatch', { method: 'POST', body: JSON.stringify(body) }),
  batchReinspect: (body) => req('/api/records/batch-reinspect', { method: 'POST', body: JSON.stringify(body) })
}
