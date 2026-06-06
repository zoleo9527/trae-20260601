import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { StockPreparationList } from './pages/StockPreparationList'
import { StockPreparationDetail } from './pages/StockPreparationDetail'
import { InventoryLockList } from './pages/InventoryLockList'
import { InventoryLockDetail } from './pages/InventoryLockDetail'
import { CustomsCenter } from './pages/CustomsCenter'
import { ReturnsCenter } from './pages/ReturnsCenter'
import { ApiDocs } from './pages/ApiDocs'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/preparation" element={<StockPreparationList />} />
          <Route path="/preparation/:id" element={<StockPreparationDetail />} />
          <Route path="/inventory-lock" element={<InventoryLockList />} />
          <Route path="/inventory-lock/:id" element={<InventoryLockDetail />} />
          <Route path="/customs" element={<CustomsCenter />} />
          <Route path="/returns" element={<ReturnsCenter />} />
          <Route path="/api-docs" element={<ApiDocs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  </StrictMode>,
)
