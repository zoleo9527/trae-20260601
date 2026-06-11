import { ref } from 'vue'

export function useApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function get<T>(url: string, params?: Record<string, string>): Promise<T> {
    loading.value = true
    error.value = null
    try {
      let queryString = ''
      if (params) {
        queryString = '?' + new URLSearchParams(params).toString()
      }
      const res = await fetch(`/api${url}${queryString}`)
      if (!res.ok) throw new Error(`请求失败: ${res.status}`)
      return await res.json() as T
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function post<T>(url: string, body?: any): Promise<T> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`/api${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error(`请求失败: ${res.status}`)
      return await res.json() as T
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function put<T>(url: string, body?: any): Promise<T> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`/api${url}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error(`请求失败: ${res.status}`)
      return await res.json() as T
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, get, post, put }
}
