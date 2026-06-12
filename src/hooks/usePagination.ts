import { useState, useCallback, useMemo } from 'react'

interface PaginationState {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
}

interface UsePaginationReturn {
  page: number
  pageSize: number
  total: number
  totalPages: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setTotal: (total: number) => void
  nextPage: () => void
  prevPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  canGoNext: boolean
  canGoPrev: boolean
  paginationParams: { page: number; pageSize: number }
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { initialPage = 1, initialPageSize = 10 } = options
  
  const [state, setState] = useState<PaginationState>({
    page: initialPage,
    pageSize: initialPageSize,
    total: 0,
    totalPages: 0,
  })

  const setPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      page: Math.max(1, Math.min(page, prev.totalPages || 1)),
    }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setState((prev) => ({
      ...prev,
      pageSize,
      page: 1,
      totalPages: Math.ceil(prev.total / pageSize) || 1,
    }))
  }, [])

  const setTotal = useCallback((total: number) => {
    setState((prev) => ({
      ...prev,
      total,
      totalPages: Math.ceil(total / prev.pageSize) || 1,
      page: Math.min(prev.page, Math.ceil(total / prev.pageSize) || 1),
    }))
  }, [])

  const nextPage = useCallback(() => {
    setPage(state.page + 1)
  }, [state.page, setPage])

  const prevPage = useCallback(() => {
    setPage(state.page - 1)
  }, [state.page, setPage])

  const goToFirstPage = useCallback(() => {
    setPage(1)
  }, [setPage])

  const goToLastPage = useCallback(() => {
    setPage(state.totalPages)
  }, [state.totalPages, setPage])

  const canGoNext = useMemo(() => state.page < state.totalPages, [state.page, state.totalPages])
  const canGoPrev = useMemo(() => state.page > 1, [state.page])

  const paginationParams = useMemo(
    () => ({ page: state.page, pageSize: state.pageSize }),
    [state.page, state.pageSize]
  )

  return {
    page: state.page,
    pageSize: state.pageSize,
    total: state.total,
    totalPages: state.totalPages,
    setPage,
    setPageSize,
    setTotal,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    canGoNext,
    canGoPrev,
    paginationParams,
  }
}

export default usePagination