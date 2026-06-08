import AppLayout from '@/components/AppLayout'
import Dashboard from '@/pages/Dashboard'
import Exception from '@/pages/Exception'
import Logs from '@/pages/Logs'
import Schedule from '@/pages/Schedule'
import Settlement from '@/pages/Settlement'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/settlement" element={<Settlement />} />
          <Route path="/exception" element={<Exception />} />
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </AppLayout>
    </Router>
  )
}
