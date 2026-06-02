import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import CalendarPage from '@/pages/CalendarPage'
import QueuePage from '@/pages/QueuePage'
import SamplesPage from '@/pages/SamplesPage'
import DowntimePage from '@/pages/DowntimePage'
import PostponePage from '@/pages/PostponePage'
import NotificationsPage from '@/pages/NotificationsPage'
import SettingsPage from '@/pages/SettingsPage'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/samples" element={<SamplesPage />} />
          <Route path="/downtime" element={<DowntimePage />} />
          <Route path="/postpone" element={<PostponePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  )
}
