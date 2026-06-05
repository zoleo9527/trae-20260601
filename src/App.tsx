import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import ComplaintList from "@/pages/ComplaintList"
import ComplaintDetail from "@/pages/ComplaintDetail"
import ReviewAnalysis from "@/pages/ReviewAnalysis"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ComplaintList />} />
          <Route path="/complaint/:id" element={<ComplaintDetail />} />
          <Route path="/review" element={<ReviewAnalysis />} />
        </Route>
      </Routes>
    </Router>
  )
}
