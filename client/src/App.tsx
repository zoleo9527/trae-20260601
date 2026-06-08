import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import GateReleaseList from './pages/GateReleaseList'
import GateReleaseDetail from './pages/GateReleaseDetail'
import FleetAppointmentList from './pages/FleetAppointmentList'
import FleetAppointmentDetail from './pages/FleetAppointmentDetail'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/gate-releases" element={<GateReleaseList />} />
        <Route path="/gate-releases/:id" element={<GateReleaseDetail />} />
        <Route path="/fleet-appointments" element={<FleetAppointmentList />} />
        <Route path="/fleet-appointments/:id" element={<FleetAppointmentDetail />} />
        <Route path="/" element={<Navigate to="/gate-releases" replace />} />
      </Route>
    </Routes>
  )
}
