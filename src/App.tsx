import { Routes, Route } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import Dashboard from '@/pages/Dashboard'
import RectificationPage from '@/pages/RectificationPage'
import ReinspectionPage from '@/pages/ReinspectionPage'
import VehicleDetail from '@/pages/VehicleDetail'

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/rectification" element={<RectificationPage />} />
        <Route path="/reinspection" element={<ReinspectionPage />} />
        <Route path="/vehicle/:id" element={<VehicleDetail />} />
      </Routes>
    </AppLayout>
  )
}
