const BASE = import.meta.env.VITE_API_BASE || '/api'

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: any
}

export async function api<T>(url: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...((opts.headers as any) || {}) }
  const body = opts.body
    ? (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body))
    : undefined
  const res = await fetch(BASE + url, {
    ...opts,
    headers,
    body
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const ct = res.headers.get('content-type')
  if (ct && ct.includes('application/json')) return res.json()
  return res.text() as unknown as T
}
