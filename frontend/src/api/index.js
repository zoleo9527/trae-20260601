const BASE = 'http://localhost:3000/api'

function getHeaders() {
  const auth = JSON.parse(localStorage.getItem('auth') || 'null')
  return {
    'Content-Type': 'application/json',
    ...(auth ? { 'x-role': auth.role } : {}),
  }
}

function getRoleParam() {
  const auth = JSON.parse(localStorage.getItem('auth') || 'null')
  return auth ? `role=${encodeURIComponent(auth.role)}` : ''
}

function appendQuery(url, extra) {
  const sep = url.includes('?') ? '&' : '?'
  return extra ? `${url}${sep}${extra}` : url
}

async function request(method, url, body) {
  const roleParam = getRoleParam()
  const fullUrl = appendQuery(`${BASE}${url}`, roleParam)
  const opts = { method, headers: getHeaders() }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(fullUrl, opts)
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

export default {
  login: (username, password) => request('POST', '/login', { username, password }),

  getContracts: (params = '') => request('GET', `/contracts${params}`),
  getFollowups: (params = '') => request('GET', `/followups${params}`),

  getAppointments: (params = '') => request('GET', `/appointments${params}`),
  createAppointment: (data) => request('POST', '/appointments', data),
  updateAppointmentStatus: (id, status, cancelReason) =>
    request('PUT', `/appointments/${id}/status`, { status, cancelReason }),
  startInoculation: (id, nurseName) =>
    request('POST', `/appointments/${id}/start-inoculation`, { nurseName }),
  completeInoculation: (id) =>
    request('POST', `/appointments/${id}/complete-inoculation`),

  getObservations: (params = '') => request('GET', `/observations${params}`),
  getObservation: (id) => request('GET', `/observations/${id}`),
  startObservation: (id, note) =>
    request('POST', `/observations/${id}/start`, { note }),
  completeObservation: (id, note, markAbnormal) =>
    request('POST', `/observations/${id}/complete`, { note, markAbnormal }),
  handoverObservation: (id, toPerson, reason) =>
    request('POST', `/observations/${id}/handover`, { toPerson, reason }),

  createExport: (type, filters) =>
    request('POST', '/export', { type, filters }),
  getExport: (taskId) => request('GET', `/export/${taskId}`),

  getDashboard: () => request('GET', '/dashboard'),
}
