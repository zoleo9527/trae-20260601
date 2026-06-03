import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Phone, PenTool, ShieldCheck, LayoutGrid, Loader2 } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import type { HandlerRole } from '@/types'
import FilterPanel from '@/components/FilterPanel'
import OrderCard from '@/components/OrderCard'
import HandoffPanel from '@/components/HandoffPanel'
import ProductionBoard from '@/components/ProductionBoard'

const roles: { value: HandlerRole; label: string; icon: typeof Phone; color: string }[] = [
  { value: 'receptionist', label: '接单客服', icon: Phone, color: 'text-factory-amber border-factory-amber bg-factory-amber/10' },
  { value: 'designer', label: '数字设计师', icon: PenTool, color: 'text-factory-blue border-factory-blue bg-factory-blue/10' },
  { value: 'inspector', label: '质检员', icon: ShieldCheck, color: 'text-factory-green border-factory-green bg-factory-green/10' },
]

export default function Workbench() {
  const [searchParams] = useSearchParams()
  const currentRole = useAppStore((s) => s.currentRole)
  const setRole = useAppStore((s) => s.setRole)
  const setFilter = useAppStore((s) => s.setFilter)
  const orders = useAppStore((s) => s.orders)
  const loading = useAppStore((s) => s.loading)
  const showProductionBoard = useAppStore((s) => s.showProductionBoard)
  const toggleProductionBoard = useAppStore((s) => s.toggleProductionBoard)
  const fetchOrdersList = useAppStore((s) => s.fetchOrdersList)

  const filters = useAppStore((s) => s.filters)

  useEffect(() => {
    const role = searchParams.get('role') as HandlerRole | null
    if (role && ['receptionist', 'designer', 'inspector'].includes(role)) {
      setRole(role)
    }
    const status = searchParams.get('status')
    const stage = searchParams.get('stage')
    const anomalyType = searchParams.get('anomalyType')
    const customerName = searchParams.get('customerName')
    const urlFilters: Record<string, string | undefined> = {}
    if (status && status !== 'completed') urlFilters.status = status
    if (stage) urlFilters.stage = stage
    if (anomalyType) urlFilters.anomalyType = anomalyType
    if (customerName) urlFilters.customerName = customerName
    if (Object.keys(urlFilters).length > 0) {
      setFilter(urlFilters)
    }
  }, [])

  useEffect(() => {
    fetchOrdersList()
  }, [currentRole, filters])

  return (
    <div className="flex h-screen">
      <div className="w-[240px] flex-shrink-0 bg-factory-surface border-r border-factory-border h-full overflow-y-auto">
        <FilterPanel />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-factory-border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {roles.map((role) => {
                const Icon = role.icon
                const isActive = currentRole === role.value
                return (
                  <button
                    key={role.value}
                    onClick={() => setRole(role.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition ${
                      isActive
                        ? role.color + ' border'
                        : 'text-factory-muted hover:text-gray-200 hover:bg-factory-surface'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {role.label}
                  </button>
                )
              })}
            </div>

            <button
              onClick={toggleProductionBoard}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition ${
                showProductionBoard
                  ? 'bg-factory-amber text-factory-bg font-medium'
                  : 'text-factory-muted border border-factory-border hover:border-factory-amber hover:text-factory-amber'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              {showProductionBoard ? '返回订单列表' : '查看排产看板'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {showProductionBoard ? (
            <ProductionBoard />
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-factory-amber animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center h-full text-factory-muted text-sm">
              暂无订单数据
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>

      <HandoffPanel />
    </div>
  )
}
