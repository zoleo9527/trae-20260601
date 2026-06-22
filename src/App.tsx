import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Adjustments from '@/pages/Adjustments'
import PriceLocks from '@/pages/PriceLocks'
import Quotes from '@/pages/Quotes'
import Inventory from '@/pages/Inventory'
import Customers from '@/pages/Customers'

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/adjustments" element={<Adjustments />} />
          <Route path="/price-locks" element={<PriceLocks />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/customers" element={<Customers />} />
        </Routes>
      </Layout>
    </Router>
  )
}
