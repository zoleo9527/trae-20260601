import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import LeftoverDetail from '@/pages/LeftoverDetail'
import Leftovers from '@/pages/Leftovers'
import Linen from '@/pages/Linen'
import LinenInventory from '@/pages/LinenInventory'
import LinenRequisition from '@/pages/LinenRequisition'
import LinenReturn from '@/pages/LinenReturn'
import Maintenance from '@/pages/Maintenance'
import MaintenanceDetail from '@/pages/MaintenanceDetail'
import MaintenanceNew from '@/pages/MaintenanceNew'
import RoomDetail from '@/pages/RoomDetail'
import Rooms from '@/pages/Rooms'
import Staff from '@/pages/Staff'
import Statistics from '@/pages/Statistics'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/linen" element={<Linen />} />
          <Route path="/linen/requisition" element={<LinenRequisition />} />
          <Route path="/linen/return" element={<LinenReturn />} />
          <Route path="/linen/inventory" element={<LinenInventory />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/maintenance/new" element={<MaintenanceNew />} />
          <Route path="/maintenance/:id" element={<MaintenanceDetail />} />
          <Route path="/leftovers" element={<Leftovers />} />
          <Route path="/leftovers/:id" element={<LeftoverDetail />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/staff" element={<Staff />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
