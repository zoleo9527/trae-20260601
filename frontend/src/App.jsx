import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import OrderList from './components/OrderList'
import OrderDetail from './components/OrderDetail'
import FabricStock from './components/FabricStock'
import ProcessTracking from './components/ProcessTracking'
import StaffManagement from './components/StaffManagement'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const handleOrderClick = (order) => {
    setSelectedOrder(order)
    setActiveTab('order-detail')
  }

  const handleBackToList = () => {
    setSelectedOrder(null)
    setActiveTab('orders')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onOrderClick={handleOrderClick} />
      case 'orders':
        return <OrderList onOrderClick={handleOrderClick} />
      case 'order-detail':
        return <OrderDetail order={selectedOrder} onBack={handleBackToList} />
      case 'fabric-stock':
        return <FabricStock />
      case 'process-tracking':
        return <ProcessTracking onOrderClick={handleOrderClick} />
      case 'staff':
        return <StaffManagement />
      default:
        return <Dashboard onOrderClick={handleOrderClick} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  )
}

export default App