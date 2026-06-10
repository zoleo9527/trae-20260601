const API_BASE = '/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

export const api = {
  auth: {
    login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    getDemoAccounts: () => request('/auth/demo-accounts'),
    getUsers: (role) => request(`/auth/users${role ? `?role=${role}` : ''}`),
  },
  inspections: {
    list: (params) => request(`/inspections?${new URLSearchParams(params)}`),
    get: (id) => request(`/inspections/${id}`),
    create: (data) => request('/inspections', { method: 'POST', body: JSON.stringify(data) }),
    start: (id) => request(`/inspections/${id}/start`, { method: 'PUT' }),
    complete: (id, data) => request(`/inspections/${id}/complete`, { method: 'PUT', body: JSON.stringify(data) }),
    confirm: (id, data) => request(`/inspections/${id}/confirm`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  eggRecords: {
    list: (params) => request(`/egg-records?${new URLSearchParams(params)}`),
    get: (id) => request(`/egg-records/${id}`),
    history: (params) => request(`/egg-records/history?${new URLSearchParams(params)}`),
    create: (data) => request('/egg-records', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/egg-records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    confirm: (id) => request(`/egg-records/${id}/confirm`, { method: 'PUT' }),
    markAbnormal: (id, reason) => request(`/egg-records/${id}/mark-abnormal`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  },
  exceptions: {
    list: (params) => request(`/exceptions?${new URLSearchParams(params)}`),
    get: (id) => request(`/exceptions/${id}`),
    summary: () => request('/exceptions/summary'),
    create: (data) => request('/exceptions', { method: 'POST', body: JSON.stringify(data) }),
    assign: (id, data) => request(`/exceptions/${id}/assign`, { method: 'PUT', body: JSON.stringify(data) }),
    handle: (id, data) => request(`/exceptions/${id}/handle`, { method: 'PUT', body: JSON.stringify(data || {}) }),
    resolve: (id, data) => request(`/exceptions/${id}/resolve`, { method: 'PUT', body: JSON.stringify(data) }),
    close: (id, data) => request(`/exceptions/${id}/close`, { method: 'PUT', body: JSON.stringify(data || {}) }),
  },
  dashboard: {
    pressure: () => request('/dashboard/pressure'),
    houses: () => request('/dashboard/houses'),
  },
  notifications: {
    list: (userId) => request(`/notifications?user_id=${userId}`),
    unreadCount: (userId) => request(`/notifications/unread-count/${userId}`),
    read: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    readAll: (userId) => request(`/notifications/read-all/${userId}`, { method: 'PUT' }),
  },
  export: {
    inspections: (params) => `${API_BASE}/export/inspections?${new URLSearchParams(params)}`,
    eggRecords: (params) => `${API_BASE}/export/egg-records?${new URLSearchParams(params)}`,
  },
  attachments: {
    upload: (targetType, targetId, file, uploadedBy) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_type', targetType);
      formData.append('target_id', targetId);
      formData.append('uploaded_by', uploadedBy);
      return fetch(`${API_BASE}/attachments`, { method: 'POST', body: formData }).then(r => r.json());
    },
    list: (targetType, targetId) => request(`/attachments/${targetType}/${targetId}`),
    delete: (id) => request(`/attachments/${id}`, { method: 'DELETE' }),
  },
};

export const SHIFT_LABELS = { morning: '早班', afternoon: '午班', night: '夜班' };
export const INSPECTION_STATUS = { pending: '待巡检', in_progress: '巡检中', pending_confirm: '待确认', completed: '已完成', abnormal: '异常' };
export const EGG_STATUS = { pending: '待录入', recorded: '已录入', confirmed: '已确认', abnormal: '异常' };
export const EXCEPTION_STATUS = { open: '待处理', assigned: '已指派', handling: '处理中', resolved: '已解决', closed: '已关闭' };
export const SEVERITY_LABELS = { critical: '紧急', urgent: '紧急', warning: '警告', info: '提示' };
export const SYSTEM_STATUS_LABELS = { normal: '正常', poor: '异常', off: '停机', leak: '漏水', blocked: '堵塞', jam: '卡料', low: '不足', clogged: '堵塞', overflow: '溢出' };

export const ACTION_LABELS = {
  created: '创建',
  assigned: '指派',
  handling: '开始处理',
  resolved: '已解决',
  closed: '已关闭',
  escalated: '升级催办',
};

export const ACTION_COLORS = {
  created: '#1677ff',
  assigned: '#faad14',
  handling: '#1677ff',
  resolved: '#52c41a',
  closed: '#999',
  escalated: '#cf1322',
};
