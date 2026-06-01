import AddMealModal from '@/components/AddMealModal'
import BatchVerifyBar from '@/components/BatchVerifyBar'
import OrderDetail from '@/components/OrderDetail'
import OrderList from '@/components/OrderList'
import RefundModal from '@/components/RefundModal'
import Sidebar from '@/components/Sidebar'
import { useOrderStore } from '@/store/useOrderStore'
import { AlertTriangle, Plus } from 'lucide-react'

export default function Home() {
  const { setShowAddMealModal, getAbnormalOrders } = useOrderStore()
  const abnormalCount = getAbnormalOrders().length

  return (
    <div className="h-screen flex bg-stone-50">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-stone-200">
          <div className="flex items-center gap-3">
            {abnormalCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="text-xs font-semibold text-red-700">
                  {abnormalCount} 条异常待处理
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddMealModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              临时加餐
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <OrderList />
          <OrderDetail />
        </div>
      </main>

      <BatchVerifyBar />
      <AddMealModal />
      <RefundModal />
    </div>
  )
}
