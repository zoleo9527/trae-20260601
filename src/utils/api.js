const BASE_URL = '/api'

async function request(url, options = {}) {
  try {
    const response = await fetch(BASE_URL + url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    const data = await response.json()
    return data
  } catch (error) {
    console.error('请求失败:', error)
    return { success: false, message: '网络错误' }
  }
}

export const api = {
  getBikes: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/bikes?${query}`)
  },

  getBike: (id) => request(`/bikes/${id}`),

  getInspectionTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/inspection-tasks?${query}`)
  },

  getInspectionTask: (id) => request(`/inspection-tasks/${id}`),

  getFaults: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/faults?${query}`)
  },

  getFault: (id) => request(`/faults/${id}`),

  createFault: (data) => request('/faults', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  dispatchFault: (id, data) => request(`/faults/${id}/dispatch`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  getRepairs: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/repairs?${query}`)
  },

  getRepair: (id) => request(`/repairs/${id}`),

  completeRepair: (id, data) => request(`/repairs/${id}/complete`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  startRepair: (id, data) => request(`/repairs/${id}/start`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  getAreas: () => request('/areas'),

  getOverview: () => request('/statistics/overview'),

  getHotspots: () => request('/statistics/hotspots'),

  getFaultTypes: () => request('/dict/fault-types'),

  getAreaList: () => request('/dict/areas')
}
