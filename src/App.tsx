import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import SupplementList from './pages/SupplementList'
import SupplementDetail from './pages/SupplementDetail'
import ReturnList from './pages/ReturnList'
import ReturnDetail from './pages/ReturnDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/supplements" replace />} />
        <Route path="supplements" element={<SupplementList />} />
        <Route path="supplements/:id" element={<SupplementDetail />} />
        <Route path="returns" element={<ReturnList />} />
        <Route path="returns/:id" element={<ReturnDetail />} />
      </Route>
    </Routes>
  )
}
