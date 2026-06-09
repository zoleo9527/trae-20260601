import Layout from '@/components/Layout'
import DispatchPage from '@/pages/DispatchPage'
import ProblemPage from '@/pages/ProblemPage'
import ReviewPage from '@/pages/ReviewPage'
import ScanPage from '@/pages/ScanPage'
import WorkspacePage from '@/pages/WorkspacePage'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ScanPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/dispatch" element={<DispatchPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/problem" element={<ProblemPage />} />
        </Route>
      </Routes>
    </Router>
  )
}
