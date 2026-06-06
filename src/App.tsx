import { useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useStore } from '@/store'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Dashboard from '@/pages/Dashboard'
import Inventory from '@/pages/Inventory'
import Screenings from '@/pages/Screenings'
import Exceptions from '@/pages/Exceptions'
import Audit from '@/pages/Audit'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'

function App() {
  const { initialize, userRestored, loading } = useStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      initialize()
    }
  }, [initialize])

  if (loading || !userRestored) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="inventory" element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        } />
        <Route path="screenings" element={
          <ProtectedRoute>
            <Screenings />
          </ProtectedRoute>
        } />
        <Route path="exceptions" element={
          <ProtectedRoute>
            <Exceptions />
          </ProtectedRoute>
        } />
        <Route path="audit" element={
          <ProtectedRoute>
            <Audit />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App
