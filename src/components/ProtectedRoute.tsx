import { useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '@/store'
import { canAccessRoute } from '@/services/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, userRestored, initialize, loading } = useStore()
  const location = useLocation()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      initialize()
    }
  }, [initialize])

  if (loading || !userRestored) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!canAccessRoute(location.pathname, currentUser.role)) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
