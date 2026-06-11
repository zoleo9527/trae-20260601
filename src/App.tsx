import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ApplicationsPage from './pages/ApplicationsPage'
import ApplicationDetailPage from './pages/ApplicationDetailPage'
import ApprovalsPage from './pages/ApprovalsPage'
import ApprovalDetailPage from './pages/ApprovalDetailPage'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/approvals/:id" element={<ApprovalDetailPage />} />
        </Route>
      </Routes>
    </Router>
  )
}
