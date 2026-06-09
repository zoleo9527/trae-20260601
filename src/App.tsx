import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Warnings from '@/pages/Warnings'
import WarningDetail from '@/pages/WarningDetail'
import NewWarning from '@/pages/NewWarning'
import Exchanges from '@/pages/Exchanges'
import ExchangeDetail from '@/pages/ExchangeDetail'
import History from '@/pages/History'
import Recent from '@/pages/Recent'
import { useUserStore } from '@/stores/userStore'
import { generateSeedData } from '@/lib/seed'

function AppRoutes() {
  const currentUser = useUserStore((s) => s.currentUser)

  if (!currentUser) {
    return <Login />
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/warnings" element={<Warnings />} />
        <Route path="/warnings/new" element={<NewWarning />} />
        <Route path="/warnings/:warningId" element={<WarningDetail />} />
        <Route path="/exchanges" element={<Exchanges />} />
        <Route path="/exchanges/:exchangeId" element={<ExchangeDetail />} />
        <Route path="/history" element={<History />} />
        <Route path="/recent" element={<Recent />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  useEffect(() => {
    generateSeedData()
  }, [])

  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}
