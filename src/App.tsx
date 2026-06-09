import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import OutboundList from '@/pages/OutboundList'
import OutboundDetail from '@/pages/OutboundDetail'
import OutboundReview from '@/pages/OutboundReview'
import ReviewReplay from '@/pages/ReviewReplay'
import BatchIssueList from '@/pages/BatchIssueList'
import BatchIssueDetail from '@/pages/BatchIssueDetail'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<OutboundList />} />
          <Route path="/outbound/:id" element={<OutboundDetail />} />
          <Route path="/outbound/:id/review" element={<OutboundReview />} />
          <Route path="/outbound/:id/replay" element={<ReviewReplay />} />
          <Route path="/batch-issues" element={<BatchIssueList />} />
          <Route path="/batch-issues/:id" element={<BatchIssueDetail />} />
        </Route>
      </Routes>
    </Router>
  )
}
