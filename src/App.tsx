import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout/Layout'
import { Dashboard } from '@/pages/Dashboard/Dashboard'
import { Feedback } from '@/pages/Feedback/Feedback'
import { Addition } from '@/pages/Addition/Addition'
import { Profile } from '@/pages/Profile/Profile'
import { initializeMockData } from '@/services/mockData'
import { useUserStore } from '@/contexts/UserContext'
import { useAppStore } from '@/contexts/AppContext'

export default function App() {
  const { loadUsers } = useUserStore()
  const { loadAllData } = useAppStore()
  
  useEffect(() => {
    initializeMockData()
    loadUsers()
    loadAllData()
  }, [loadUsers, loadAllData])
  
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/addition" element={<Addition />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  )
}