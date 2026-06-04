import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import FeedingPage from './pages/FeedingPage'
import BatchesPage from './pages/BatchesPage'
import BatchDetailPage from './pages/BatchDetailPage'
import PackagingPage from './pages/PackagingPage'
import SalesPage from './pages/SalesPage'
import SystemPage from './pages/SystemPage'
import { useBreweryStore } from './store/useBreweryStore'
import { MENU_ITEMS } from './types'

function App() {
  const { currentRole } = useBreweryStore()
  const firstAccessiblePath = MENU_ITEMS.find((m) => m.roles.includes(currentRole))?.path || '/dashboard'

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to={firstAccessiblePath} replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="feeding" element={<FeedingPage />} />
        <Route path="batches" element={<BatchesPage />} />
        <Route path="batches/:id" element={<BatchDetailPage />} />
        <Route path="packaging" element={<PackagingPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="system" element={<SystemPage />} />
      </Route>
    </Routes>
  )
}

export default App
