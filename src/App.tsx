import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import AbsenceViolation from '@/pages/AbsenceViolation'
import ScorePublish from '@/pages/ScorePublish'
import Query from '@/pages/Query'
import Export from '@/pages/Export'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/absence-violation" element={<AbsenceViolation />} />
          <Route path="/score-publish" element={<ScorePublish />} />
          <Route path="/query" element={<Query />} />
          <Route path="/export" element={<Export />} />
        </Route>
      </Routes>
    </Router>
  )
}
