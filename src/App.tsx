import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import DamageList from '@/pages/DamageList'
import DamageDetail from '@/pages/DamageDetail'
import LiabilityList from '@/pages/LiabilityList'
import LiabilityDetail from '@/pages/LiabilityDetail'
import History from '@/pages/History'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/damage" element={<DamageList />} />
        <Route path="/damage/:id" element={<DamageDetail />} />
        <Route path="/liability" element={<LiabilityList />} />
        <Route path="/liability/:id" element={<LiabilityDetail />} />
        <Route path="/history" element={<History />} />
      </Route>
    </Routes>
  )
}
