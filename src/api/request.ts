export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface RequestConfig extends RequestInit {
  params?: Record<string, any>
}

class RequestError extends Error {
  code: number
  data?: any
  errorFields?: any[]
  constructor(message: string, code: number, data?: any) {
    super(message)
    this.name = 'RequestError'
    this.code = code
    this.data = data
    this.errorFields = data?.errorFields
  }
}

const API_BASE = '/api'

function buildUrl(url: string, params?: Record<string, any>): string {
  let fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`
  if (params) {
    const usp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) usp.append(k, String(v))
    })
    const qs = usp.toString()
    if (qs) fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs
  }
  return fullUrl
}

async function request<T = any>(url: string, config: RequestConfig = {}): Promise<T> {
  const { params, ...rest } = config
  const fullUrl = buildUrl(url, params)

  const defaultConfig: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  }

  const finalConfig: RequestInit = {
    ...defaultConfig,
    ...rest,
    headers: {
      ...defaultConfig.headers,
      ...(rest.headers || {}),
    },
  }

  try {
    const resp = await fetch(fullUrl, finalConfig)
    const json: ApiResponse<T> = await resp.json()

    if (json.code === 0) {
      return json.data
    }

    throw new RequestError(json.message || '请求失败', json.code, json.data)
  } catch (e: any) {
    if (e instanceof RequestError) {
      console.error(`[API Error] ${fullUrl}:`, e.message, e.code)
      throw e
    }
    if (e.name === 'SyntaxError') {
      throw new RequestError('服务器响应格式错误', -2)
    }
    if (e.message === 'Failed to fetch') {
      throw new RequestError('网络连接失败，请检查网络', -3)
    }
    throw new RequestError(e.message || '网络错误', -1)
  }
}

export const http = {
  get: <T = any>(url: string, params?: Record<string, any>, config?: RequestConfig) =>
    request<T>(url, { ...config, method: 'GET', params }),
  post: <T = any>(url: string, data?: any, config?: RequestConfig) =>
    request<T>(url, { ...config, method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T = any>(url: string, data?: any, config?: RequestConfig) =>
    request<T>(url, { ...config, method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  patch: <T = any>(url: string, data?: any, config?: RequestConfig) =>
    request<T>(url, { ...config, method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T = any>(url: string, config?: RequestConfig) =>
    request<T>(url, { ...config, method: 'DELETE' }),
  download: <T = any>(url: string, params?: Record<string, any>) =>
    request<T>(url, { method: 'GET', params }),
}

export { RequestError }
