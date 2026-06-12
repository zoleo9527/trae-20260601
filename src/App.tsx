import Layout from '@/components/Layout'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import CustomerDetail from '@/pages/CustomerDetail'
import Customers from '@/pages/Customers'
import Dashboard from '@/pages/Dashboard'
import HandoverDetail from '@/pages/HandoverDetail'
import HandoverForm from '@/pages/HandoverForm'
import Handovers from '@/pages/Handovers'
import Login from '@/pages/Login'
import NoteForm from '@/pages/NoteForm'
import Notes from '@/pages/Notes'
import Renewals from '@/pages/Renewals'
import Users from '@/pages/Users'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/handovers" element={<Handovers />} />
        <Route path="/handovers/:id" element={<HandoverDetail />} />
        <Route path="/handovers/new" element={<HandoverForm />} />
        <Route path="/renewals" element={<Renewals />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/notes/new" element={<NoteForm />} />
        <Route path="/users" element={<Users />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}