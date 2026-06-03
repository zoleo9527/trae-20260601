import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { MealOrderList } from '@/pages/MealOrderList'
import { MealOrderDetail } from '@/pages/MealOrderDetail'
import { MealOrderCreate } from '@/pages/MealOrderCreate'
import { BatchEntry } from '@/pages/BatchEntry'
import { ShortageReview } from '@/pages/ShortageReview'
import { ShortageDetail } from '@/pages/ShortageDetail'
import { ShortageHistory } from '@/pages/ShortageHistory'
import { ProductionBoard } from '@/pages/ProductionBoard'
import { StoreReport } from '@/pages/StoreReport'
import { useAuthStore } from '@/store/authStore'

function App() {
  const currentUser = useAuthStore((state) => state.currentUser)

  if (!currentUser) {
    return null
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/meal-orders" element={<MealOrderList />} />
        <Route path="/meal-orders/create" element={<MealOrderCreate />} />
        <Route path="/meal-orders/:id" element={<MealOrderDetail />} />
        <Route path="/batch-entry" element={<BatchEntry />} />
        <Route path="/production-board" element={<ProductionBoard />} />
        <Route path="/store-report" element={<StoreReport />} />
        <Route path="/shortage-review" element={<ShortageReview />} />
        <Route path="/shortage-review/:id" element={<ShortageDetail />} />
        <Route path="/shortage-history" element={<ShortageHistory />} />
      </Route>
    </Routes>
  )
}

export default App
