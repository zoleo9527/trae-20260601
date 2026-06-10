import MainLayout from '@/components/MainLayout'
import Dashboard from '@/pages/Dashboard'
import HistoryList from '@/pages/HistoryList'
import OrderDetail from '@/pages/OrderDetail'
import OrderList from '@/pages/OrderList'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/history" element={<HistoryList />} />
          <Route path="/order/:id" element={<OrderDetail />} />
        </Route>
      </Routes>
    </Router>
  )
}
