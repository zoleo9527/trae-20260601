import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/pages/Login"
import FloristDashboard from "@/pages/FloristDashboard"
import DispatcherDashboard from "@/pages/DispatcherDashboard"
import AftercareDashboard from "@/pages/AftercareDashboard"
import TracePage from "@/pages/TracePage"
import AppLayout from "@/components/AppLayout"
import { useAuthStore } from "@/store/auth"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user)
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/florist" element={<FloristDashboard />} />
          <Route path="/dispatcher" element={<DispatcherDashboard />} />
          <Route path="/aftercare" element={<AftercareDashboard />} />
          <Route path="/trace/:id" element={<TracePage />} />
        </Route>
      </Routes>
    </Router>
  )
}
