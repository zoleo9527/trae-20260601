import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import CouponList from '@/pages/CouponList'
import CouponIssue from '@/pages/CouponIssue'
import CouponDetail from '@/pages/CouponDetail'
import CouponEdit from '@/pages/CouponEdit'
import CouponReview from '@/pages/CouponReview'
import MemberList from '@/pages/MemberList'
import MemberDetail from '@/pages/MemberDetail'
import BatchList from '@/pages/BatchList'
import BatchDetail from '@/pages/BatchDetail'
import AttachmentList from '@/pages/AttachmentList'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="coupons" element={<CouponList />} />
        <Route path="coupons/issue" element={<CouponIssue />} />
        <Route path="coupons/:id" element={<CouponDetail />} />
        <Route path="coupons/:id/edit" element={<CouponEdit />} />
        <Route path="coupons/:id/review" element={<CouponReview />} />
        <Route path="members" element={<MemberList />} />
        <Route path="members/:id" element={<MemberDetail />} />
        <Route path="batches" element={<BatchList />} />
        <Route path="batches/:id" element={<BatchDetail />} />
        <Route path="attachments" element={<AttachmentList />} />
      </Route>
    </Routes>
  )
}
