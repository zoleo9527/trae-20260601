import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  ChevronRight,
} from 'lucide-react'
import { useMealOrderStore } from '@/store/mealOrderStore'
import { StatusBadge } from '@/components/StatusBadge'
import { DenseTable } from '@/components/DenseTable'
import {
  SHORTAGE_STATUS_LABELS,
} from '@/constants/statusMachine'
import type { ShortageStatus } from '@/types'

export function ShortageReview() {
  const navigate = useNavigate()
  const { getShortageOrders } = useMealOrderStore()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<ShortageStatus | 'all'>('all')

  const shortageOrders = getShortageOrders()

  const filteredOrders = shortageOrders.filter((order) => {
    const shortage = order.shortageReplenish!
    const matchesSearch =
      order.orderNo.toLowerCase().includes(searchText.toLowerCase()) ||
      order.storeName.toLowerCase().includes(searchText.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || shortage.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusOptions: { value: ShortageStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部状态' },
    ...Object.entries(SHORTAGE_STATUS_LABELS).map(([value, label]) => ({
      value: value as ShortageStatus,
      label,
    })),
  ]

  const stats = {
    total: shortageOrders.length,
    pending: shortageOrders.filter(
      (o) =>
        o.shortageReplenish?.status === 'supply_review' ||
        o.shortageReplenish?.status === 'pending_review'
    ).length,
    rejected: shortageOrders.filter(
      (o) => o.shortageReplenish?.status === 'supply_rejected'
    ).length,
    replenishing: shortageOrders.filter(
      (o) => o.shortageReplenish?.status === 'replenishing'
    ).length,
    completed: shortageOrders.filter(
      (o) => o.shortageReplenish?.status === 'closed'
    ).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">缺货补发</h2>
          <p className="text-sm text-neutral-500 mt-1">
            处理门店缺货补发申请，跟踪补发进度
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: '全部',
            value: stats.total,
            color: 'text-primary-600',
            bg: 'bg-primary-50',
          },
          {
            label: '待审核',
            value: stats.pending,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: '待补充材料',
            value: stats.rejected,
            color: 'text-danger-600',
            bg: 'bg-danger-50',
          },
          {
            label: '补发中',
            value: stats.replenishing,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
        ].map((stat, idx) => (
          <div key={idx} className={`card p-4 ${stat.bg} border-transparent`}>
            <p className="text-sm text-neutral-600 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                className="input pl-10"
                placeholder="搜索单号、门店名称..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-400" />
              <select
                className="input w-40"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DenseTable
            columns={[
              {
                key: 'priority',
                title: '优先级',
                width: '60px',
                align: 'center',
                render: (row: any) => {
                  const items = row.shortageReplenish?.items || []
                  const totalShortage = items.reduce(
                    (sum: number, i: any) => sum + (i.shortageQuantity || 0),
                    0
                  )
                  if (totalShortage >= 10) {
                    return (
                      <span className="inline-block w-2 h-2 rounded-full bg-danger-500" title="紧急" />
                    )
                  } else if (totalShortage >= 5) {
                    return (
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500" title="高" />
                    )
                  }
                  return (
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="普通" />
                  )
                },
              },
              { key: 'orderNo', title: '关联单号', width: '140px' },
              { key: 'storeName', title: '门店' },
              {
                key: 'shortageStatus',
                title: '当前状态',
                width: '120px',
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
                key: 'totalShortage',
                title: '缺货总数',
                width: '100px',
                align: 'right',
                render: (row: any) => {
                  const items = row.shortageReplenish?.items || []
                  return items.reduce(
                    (sum: number, i: any) => sum + (i.shortageQuantity || 0),
                    0
                  )
                },
              },
              {
                key: 'handler',
                title: '当前处理人',
                width: '100px',
                render: (row: any) => {
                  const status = row.shortageReplenish?.status
                  if (status === 'supply_review' || status === 'supply_approved') {
                    return '采购主管'
                  }
                  if (
                    status === 'replenishing' ||
                    status === 'replenished' ||
                    status === 'supervisor_review'
                  ) {
                    return '生产班长'
                  }
                  if (
                    status === 'supply_rejected' ||
                    status === 'pending_review'
                  ) {
                    return '门店督导'
                  }
                  return '-'
                },
              },
              {
                key: 'createdAt',
                title: '上报时间',
                width: '160px',
                render: (row: any) =>
                  new Date(
                    row.shortageReplenish?.createdAt || row.createdAt
                  ).toLocaleString('zh-CN'),
              },
              {
                key: 'action',
                title: '操作',
                width: '80px',
                render: (row: any) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/shortage-review/${row.id}`)
                    }}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                  >
                    处理
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ),
              },
            ]}
            data={filteredOrders}
            rowKey="id"
            onRowClick={(row: any) => navigate(`/shortage-review/${row.id}`)}
            emptyText="暂无缺货补发记录"
            rowClassName={(row: any) => {
              const status = row.shortageReplenish?.status
              if (status === 'supply_rejected') return 'bg-danger-50/50'
              if (status === 'supply_review') return 'bg-amber-50/50'
              return ''
            }}
          />
        </div>
      </div>
    </div>
  )
}
