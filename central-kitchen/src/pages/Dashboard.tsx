import { useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  Factory,
  ArrowRight,
} from 'lucide-react'
import { useMealOrderStore } from '@/store/mealOrderStore'
import { useAuthStore } from '@/store/authStore'
import { StatusBadge } from '@/components/StatusBadge'
import { DenseTable } from '@/components/DenseTable'

export function Dashboard() {
  const navigate = useNavigate()
  const { orders, getShortageOrders } = useMealOrderStore()
  const { hasPermission } = useAuthStore()

  const stats = {
    total: orders.length,
    draft: orders.filter((o) => o.status === 'draft').length,
    inProgress: orders.filter(
      (o) =>
        o.status === 'submitted' ||
        o.status === 'production_review' ||
        o.status === 'production_approved' ||
        o.status === 'distributed'
    ).length,
    shortage: getShortageOrders().filter(
      (o) =>
        o.shortageReplenish?.status !== 'closed'
    ).length,
    completed: orders.filter((o) => o.status === 'received').length,
  }

  const pendingOrders = orders
    .filter((o) => o.status !== 'received' && o.status !== 'shortage_reported')
    .slice(0, 5)

  const pendingShortage = getShortageOrders()
    .filter((o) => o.shortageReplenish?.status !== 'closed')
    .slice(0, 5)

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    onClick,
  }: {
    title: string
    value: number
    icon: any
    color: string
    onClick?: () => void
  }) => (
    <div
      onClick={onClick}
      className={`card p-5 cursor-pointer hover:shadow-md transition-shadow ${onClick ? 'hover:border-primary-300' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${color.replace('text-', 'bg-').replace('600', '100')} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      {onClick && (
        <div className="mt-3 flex items-center text-xs text-primary-600">
          查看详情 <ArrowRight className="w-3 h-3 ml-1" />
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="配餐单总数"
          value={stats.total}
          icon={ClipboardList}
          color="text-primary-600"
          onClick={() => navigate('/meal-orders')}
        />
        <StatCard
          title="待处理"
          value={stats.inProgress}
          icon={Clock}
          color="text-amber-600"
        />
        <StatCard
          title="待处理缺货"
          value={stats.shortage}
          icon={AlertTriangle}
          color="text-danger-600"
          onClick={() => navigate('/shortage-review')}
        />
        <StatCard
          title="已完成"
          value={stats.completed}
          icon={CheckCircle}
          color="text-success-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900">待处理配餐单</h3>
            <button
              onClick={() => navigate('/meal-orders')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              查看全部
            </button>
          </div>
          <div className="card-body">
            <DenseTable
              columns={[
                { key: 'orderNo', title: '单号' },
                { key: 'storeName', title: '门店' },
                { key: 'deliveryDate', title: '配送日期' },
                {
                  key: 'status',
                  title: '状态',
                  render: (row: any) => (
                    <StatusBadge status={row.status} />
                  ),
                },
                {
                  key: 'action',
                  title: '操作',
                  render: (row: any) => (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/meal-orders/${row.id}`)
                      }}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      处理
                    </button>
                  ),
                },
              ]}
              data={pendingOrders}
              rowKey="id"
              onRowClick={(row: any) => navigate(`/meal-orders/${row.id}`)}
              emptyText="暂无待处理配餐单"
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900">待处理缺货补发</h3>
            <button
              onClick={() => navigate('/shortage-review')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              查看全部
            </button>
          </div>
          <div className="card-body">
            <DenseTable
              columns={[
                { key: 'orderNo', title: '关联单号' },
                { key: 'storeName', title: '门店' },
                {
                  key: 'shortageStatus',
                  title: '状态',
                  render: (row: any) =>
                    row.shortageReplenish && (
                      <StatusBadge
                        status={row.shortageReplenish.status}
                        isShortage
                      />
                    ),
                },
                {
                  key: 'items',
                  title: '缺货明细',
                  render: (row: any) =>
                    row.shortageReplenish?.items
                      .map((i: any) => `${i.name}×${i.shortageQuantity}`)
                      .join('、'),
                },
                {
                  key: 'action',
                  title: '操作',
                  render: (row: any) => (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/shortage-review/${row.id}`)
                      }}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      处理
                    </button>
                  ),
                },
              ]}
              data={pendingShortage}
              rowKey="id"
              onRowClick={(row: any) => navigate(`/shortage-review/${row.id}`)}
              emptyText="暂无待处理缺货"
            />
          </div>
        </div>
      </div>

      {hasPermission('create_order') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => navigate('/meal-orders/create')}
            className="card p-6 cursor-pointer hover:border-primary-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <ClipboardList className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                  创建配餐单
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  为门店创建新的配餐订单
                </p>
              </div>
            </div>
          </div>

          {hasPermission('batch_entry') && (
            <div
              onClick={() => navigate('/batch-entry')}
              className="card p-6 cursor-pointer hover:border-primary-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <Factory className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-amber-600 transition-colors">
                    批量录入
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    快速录入多个门店的配餐数据
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {hasPermission('view_shortage') && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-neutral-900">缺货补发状态概览</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: '待采购审核', value: getShortageOrders().filter((o) => o.shortageReplenish?.status === 'supply_review').length },
                { label: '待补充材料', value: getShortageOrders().filter((o) => o.shortageReplenish?.status === 'supply_rejected').length },
                { label: '补发中', value: getShortageOrders().filter((o) => o.shortageReplenish?.status === 'replenishing').length },
                { label: '已完成', value: getShortageOrders().filter((o) => o.shortageReplenish?.status === 'closed').length },
              ].map((item, index) => (
                <div key={index} className="text-center p-4 bg-neutral-50 rounded-lg">
                  <p className="text-2xl font-bold text-neutral-900">{item.value}</p>
                  <p className="text-sm text-neutral-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
