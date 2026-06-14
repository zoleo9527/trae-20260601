import { AuthTokenPayload, CarSource, OperationLog, User } from './types';

const TOKEN_KEY = 'car_token';
const USER_KEY = 'car_user';

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {})
  };
}

async function handleResp<T>(resp: Response): Promise<T> {
  if (resp.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (!location.hash.includes('login')) location.hash = '#/login';
    throw new Error('未登录');
  }
  const data = await resp.json().catch(() => ({})) as any;
  if (!resp.ok || data.code !== 0) {
    throw new Error(data.message || `请求失败 ${resp.status}`);
  }
  return data.data as T;
}

export const authApi = {
  login(username: string): Promise<{ token: string; user: AuthTokenPayload }> {
    return fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    }).then(async (resp) => {
      const data = await handleResp<{ token: string; user: User }>(resp);
      const payload: AuthTokenPayload = {
        userId: data.user.id,
        username: data.user.username,
        name: data.user.name,
        role: data.user.role
      };
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(payload));
      return { token: data.token, user: payload };
    });
  },
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  me(): AuthTokenPayload | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
};

export const carApi = {
  async list(params?: { status?: string; keyword?: string; scope?: 'mine' | 'all' | 'pending' }): Promise<CarSource[]> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.keyword) q.set('keyword', params.keyword);
    if (params?.scope) q.set('scope', params.scope);
    return handleResp(await fetch('/api/cars?' + q.toString(), { headers: getHeaders() }));
  },
  async get(id: string): Promise<{ car: CarSource; logs: OperationLog[] }> {
    return handleResp(await fetch(`/api/cars/${id}`, { headers: getHeaders() }));
  },
  async create(body: any): Promise<CarSource> {
    return handleResp(await fetch('/api/cars', { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }));
  },
  async submit(id: string, remark?: string): Promise<CarSource> {
    return handleResp(await fetch(`/api/cars/${id}/submit`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ remark }) }));
  },
  async managerApprove(id: string, managerPrice: number, remark?: string, assignAppraiserId?: string): Promise<CarSource> {
    return handleResp(await fetch(`/api/cars/${id}/manager-approve`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ managerPrice, remark, assignAppraiserId }) }));
  },
  async managerReject(id: string, remark: string): Promise<CarSource> {
    return handleResp(await fetch(`/api/cars/${id}/manager-reject`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ remark }) }));
  },
  async appraiserSubmit(id: string, appraiserPrice: number, remark?: string): Promise<CarSource> {
    return handleResp(await fetch(`/api/cars/${id}/appraiser-submit`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ appraiserPrice, remark }) }));
  },
  async appraiserReject(id: string, remark: string): Promise<CarSource> {
    return handleResp(await fetch(`/api/cars/${id}/appraiser-reject`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ remark }) }));
  },
  async financeApprove(id: string, finalPrice: number, remark?: string): Promise<CarSource> {
    return handleResp(await fetch(`/api/cars/${id}/finance-approve`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ finalPrice, remark }) }));
  },
  async financeReject(id: string, remark: string): Promise<CarSource> {
    return handleResp(await fetch(`/api/cars/${id}/finance-reject`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ remark }) }));
  },
  async cancel(id: string, remark?: string): Promise<CarSource> {
    return handleResp(await fetch(`/api/cars/${id}/cancel`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ remark }) }));
  },
  async addComment(id: string, remark: string): Promise<OperationLog> {
    return handleResp(await fetch(`/api/cars/${id}/comments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ remark }) }));
  },
  async meta(): Promise<any> {
    return handleResp(await fetch('/api/meta/constants', { headers: getHeaders() }));
  },
  async logs(params?: { from?: string; to?: string; operationType?: string; operatorId?: string }): Promise<OperationLog[]> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    if (params?.operationType) q.set('operationType', params.operationType);
    if (params?.operatorId) q.set('operatorId', params.operatorId);
    return handleResp(await fetch('/api/logs?' + q.toString(), { headers: getHeaders() }));
  },
  downloadExport(id: string): void {
    const token = authApi.token();
    const a = document.createElement('a');
    a.href = `/api/cars/${id}/export`;
    if (token) a.href += (a.href.includes('?') ? '&' : '?') + 'token=' + token;
    a.target = '_blank';
    a.click();
  },
  downloadLogs(params?: { from?: string; to?: string }): void {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const token = authApi.token();
    if (token) q.set('token', token);
    const a = document.createElement('a');
    a.href = '/api/logs/export?' + q.toString();
    a.target = '_blank';
    a.click();
  }
};
