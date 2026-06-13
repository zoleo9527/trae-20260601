import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import JobAudit from './pages/JobAudit'
import JobManagement from './pages/JobManagement'
import InterviewManagement from './pages/InterviewManagement'
import DataReset from './pages/DataReset'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/jobs/pending" element={<Layout><JobAudit /></Layout>} />
      <Route path="/jobs/manage" element={<Layout><JobManagement /></Layout>} />
      <Route path="/interviews" element={<Layout><InterviewManagement /></Layout>} />
      <Route path="/reset" element={<Layout><DataReset /></Layout>} />
    </Routes>
  )
}

export default App