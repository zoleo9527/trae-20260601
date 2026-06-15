import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Receiver from '@/pages/Receiver'
import Inspector from '@/pages/Inspector'
import Finance from '@/pages/Finance'
import DeviceDetail from '@/pages/DeviceDetail'
import Risks from '@/pages/Risks'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/receiver" replace />} />
          <Route path="/receiver" element={<Receiver />} />
          <Route path="/inspector" element={<Inspector />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/device/:id" element={<DeviceDetail />} />
          <Route path="/risks" element={<Risks />} />
        </Route>
      </Routes>
    </Router>
  )
}
