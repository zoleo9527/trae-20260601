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
  const [orderListFilters, setOrderListFilters] = useState(null)

  const handleOrderClick = (order) => {
    if (order?.id) {
      setSelectedOrder(order)
      setActiveTab('order-detail')
    } else if (order?.status || order?.search) {
      setOrderListFilters(order)
      setActiveTab('orders')
    } else {
      setOrderListFilters(null)
      setActiveTab('orders')
    }
  }

  const handleViewOrders = (filters) => {
    setOrderListFilters(filters)
    setActiveTab('orders')
  }

  const handleBackToList = () => {
    setSelectedOrder(null)
    setActiveTab('orders')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onViewOrders={handleViewOrders} />
      case 'orders':
        return <OrderList onOrderClick={handleOrderClick} initialFilters={orderListFilters} />
      case 'order-detail':
        return <OrderDetail order={selectedOrder} onBack={handleBackToList} />
      case 'fabric-stock':
        return <FabricStock />
      case 'process-tracking':
        return <ProcessTracking onOrderClick={handleOrderClick} />
      case 'staff':
        return <StaffManagement />
      default:
        return <Dashboard onViewOrders={handleViewOrders} />
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