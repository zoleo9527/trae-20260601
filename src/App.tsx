import { Routes, Route } from 'react-router-dom'
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
