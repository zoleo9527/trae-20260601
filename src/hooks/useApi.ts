import { useState, useCallback } from 'react'
import { handleApiError } from '@/services/api'
import type { ApiResponse } from '@/types/types'

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

interface UseApiReturn<T, P extends unknown[]> {
  data: T | null
  error: string | null
  isLoading: boolean
  execute: (...params: P) => Promise<T | null>
  reset: () => void
}

export function useApi<T, P extends unknown[]>(
  apiFunction: (...params: P) => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const execute = useCallback(
    async (...params: P): Promise<T | null> => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await apiFunction(...params)
        
        if (response.success && response.data) {
          setData(response.data)
          options.onSuccess?.(response.data)
          return response.data
        } else {
          const errorMsg = response.error || response.message || '请求失败'
          setError(errorMsg)
          options.onError?.(errorMsg)
          return null
        }
      } catch (err) {
        const errorMsg = handleApiError(err)
        setError(errorMsg)
        options.onError?.(errorMsg)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [apiFunction, options]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return { data, error, isLoading, execute, reset }
}

export function useApiMutation<T, P extends unknown[]>(
  apiFunction: (...params: P) => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  return useApi(apiFunction, options)
}

export default useApi