const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...rest } = options;

  let fullUrl = API_BASE + url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
  }

  const response = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
    ...rest,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || '请求失败');
  }

  return data.data;
}

export const api = {
  get: <T>(url: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(url, { method: 'GET', params }),

  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  put: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(url: string) =>
    request<T>(url, { method: 'DELETE' }),
};
