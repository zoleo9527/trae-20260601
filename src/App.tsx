import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import Batches from '@/pages/Batches'
import Samples from '@/pages/Samples'
import Formulas from '@/pages/Formulas'
import FeedLogs from '@/pages/FeedLogs'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/samples" element={<Samples />} />
          <Route path="/formulas" element={<Formulas />} />
          <Route path="/feed-logs" element={<FeedLogs />} />
        </Route>
      </Routes>
    </Router>
  )
}
