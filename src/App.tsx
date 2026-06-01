import Sidebar from '@/components/Sidebar'
import Followups from '@/pages/Followups'
import Home from '@/pages/Home'
import PatientDetail from '@/pages/PatientDetail'
import Tasks from '@/pages/Tasks'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/patient/:id" element={<PatientDetail />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/followups" element={<Followups />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
