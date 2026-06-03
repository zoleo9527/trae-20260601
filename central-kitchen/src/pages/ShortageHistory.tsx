import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  History,
  Search,
  Filter,
  Calendar,
  Download,
  CheckCircle,
  FileText,
  User,
  Paperclip,
} from 'lucide-react'
import { useMealOrderStore } from '@/store/mealOrderStore'
import { StatusBadge } from '@/components/StatusBadge'
import { DenseTable } from '@/components/DenseTable'
import { Button } from '@/components/Button'
import {
  SHORTAGE_STATUS_LABELS,
} from '@/constants/statusMachine'
import type { ShortageStatus, ShortageReplenish } from '@/types'

const STATUS_HANDLER_MAP: Record<ShortageStatus, string> = {
  pending_review: '采购主管',
  supply_review: '采购主管',
  supply_approved: '生产班长',
  supply_rejected: '门店督导',
  replenishing: '生产班长',
  replenished: '门店督导',
  supervisor_review: '门店督导',
  closed: '-',
}

function getRejectionOrSupplement(shortage: ShortageReplenish): { text: string; type: 'rejection' | 'supplement' | 'none' } {
  if (shortage.supplyRejectionReason) {
    return { text: shortage.supplyRejectionReason, type: 'rejection' }
  }
  if (shortage.status === 'supply_rejected' && shortage.supplyRemark) {
    return { text: shortage.supplyRemark, type: 'rejection' }
  }
  if (shortage.resubmitRemark) {
    return { text: shortage.resubmitRemark, type: 'supplement' }
  }
  return { text: '', type: 'none' }
}

export function ShortageHistory() {
  const navigate = useNavigate()
  const { getShortageOrders } = useMealOrderStore()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<ShortageStatus | 'all'>('all')
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const shortageOrders = getShortageOrders()

  const filteredOrders = shortageOrders.filter((order) => {
    const shortage = order.shortageReplenish!
    const matchesSearch =
      order.orderNo.toLowerCase().includes(searchText.toLowerCase()) ||
      order.storeName.toLowerCase().includes(searchText.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || shortage.status === statusFilter
    const matchesDate =
      shortage.createdAt >= startDate && shortage.createdAt <= endDate + 'T23:59:59'
    return matchesSearch && matchesStatus && matchesDate
  })

  const statusOptions: { value: ShortageStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部状态' },
    ...Object.entries(SHORTAGE_STATUS_LABELS).map(([value, label]) => ({
      value: value as ShortageStatus,
      label,
    })),
  ]

  const closedCount = filteredOrders.filter(
    (o) => o.shortageReplenish?.status === 'closed'
  ).length
  const avgTime = '2.5 天'

  const exportData = () => {
    const header = [
      '单号',
      '门店',
      '状态',
      '缺货明细',
      '缺货总数',
      '上一环节结论',
      '采购驳回原因',
      '补充说明',
      '采购审核意见',
      '补发详情',
      '复核意见',
      '材料数量',
      '当前处理人',
      '创建时间',
      '关闭时间',
    ].join(',')

    const escapeCsv = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }

    const rows = filteredOrders.map((o) => {
      const s = o.shortageReplenish!
      return [
        escapeCsv(o.orderNo),
        escapeCsv(o.storeName),
        SHORTAGE_STATUS_LABELS[s.status],
        escapeCsv(s.items.map((i) => `${i.name}×${i.shortageQuantity}`).join(';')),
        s.items.reduce((sum, i) => sum + (i.shortageQuantity || 0), 0),
        escapeCsv(s.previousConclusion || ''),
        escapeCsv(s.supplyRejectionReason || (s.status === 'supply_rejected' ? s.supplyRemark || '' : '')),
        escapeCsv(s.resubmitRemark || ''),
        escapeCsv(s.supplyRemark && s.status !== 'supply_rejected' ? s.supplyRemark : ''),
        escapeCsv(s.replenishRemark || ''),
        escapeCsv(s.supervisorRemark || ''),
        s.materials.length,
        STATUS_HANDLER_MAP[s.status],
        s.createdAt,
        s.status === 'closed' ? s.updatedAt : '',
      ].join(',')
    })

    const csvContent = [header, ...rows].join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `缺货补发记录_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">补发记录</h2>
          <p className="text-sm text-neutral-500 mt-1">
            查看历史缺货补发记录，支持追溯和分析
          </p>
        </div>
        <Button variant="secondary" onClick={exportData}>
          <Download className="w-4 h-4 mr-2" />
          导出报表
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">补发记录总数</p>
              <p className="text-2xl font-bold text-neutral-900">
                {filteredOrders.length}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">已完成</p>
              <p className="text-2xl font-bold text-success-600">
                {closedCount}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <History className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">平均处理时长</p>
              <p className="text-2xl font-bold text-amber-600">{avgTime}</p>
            </div>
          </div>
        </div>
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
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <input
                type="date"
                className="input w-32"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-neutral-400">至</span>
              <input
                type="date"
                className="input w-32"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <DenseTable
            columns={[
              { key: 'orderNo', title: '关联单号', width: '140px' },
              { key: 'storeName', title: '门店', width: '90px' },
              {
                key: 'shortageStatus',
                title: '状态',
                width: '110px',
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
                width: '80px',
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
                key: 'previousConclusion',
                title: '上一环节结论',
                width: '200px',
                render: (row: any) => {
                  const s = row.shortageReplenish
                  if (!s?.previousConclusion) return <span className="text-neutral-400">-</span>
                  const text = s.previousConclusion
                  return (
                    <span className="text-xs text-amber-700" title={text}>
                      {text.length > 30 ? text.slice(0, 30) + '...' : text}
                    </span>
                  )
                },
              },
              {
                key: 'rejectionOrSupplement',
                title: '驳回/补充说明',
                width: '180px',
                render: (row: any) => {
                  const s = row.shortageReplenish
                  if (!s) return <span className="text-neutral-400">-</span>
                  const { text, type } = getRejectionOrSupplement(s)
                  if (type === 'none') return <span className="text-neutral-400">-</span>
                  const truncated = text.length > 25 ? text.slice(0, 25) + '...' : text
                  return (
                    <span
                      className={`text-xs ${
                        type === 'rejection' ? 'text-danger-600' : 'text-amber-600'
                      }`}
                      title={text}
                    >
                      {type === 'rejection' ? '驳回：' : '补充：'}
                      {truncated}
                    </span>
                  )
                },
              },
              {
                key: 'materialCount',
                title: '材料',
                width: '70px',
                align: 'center',
                render: (row: any) => {
                  const count = row.shortageReplenish?.materials?.length || 0
                  return (
                    <span className="flex items-center justify-center gap-1">
                      <Paperclip className="w-3 h-3 text-neutral-400" />
                      <span className={`text-xs ${count > 0 ? 'text-primary-600' : 'text-neutral-400'}`}>
                        {count}
                      </span>
                    </span>
                  )
                },
              },
              {
                key: 'currentHandler',
                title: '当前处理人',
                width: '100px',
                align: 'center',
                render: (row: any) => {
                  const s = row.shortageReplenish
                  if (!s) return <span className="text-neutral-400">-</span>
                  const handler = STATUS_HANDLER_MAP[s.status as ShortageStatus]
                  if (handler === '-') return <span className="text-neutral-400">-</span>
                  return (
                    <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                      <User className="w-3 h-3" />
                      {handler}
                    </span>
                  )
                },
              },
              {
                key: 'createdAt',
                title: '创建时间',
                width: '150px',
                render: (row: any) =>
                  new Date(
                    row.shortageReplenish?.createdAt
                  ).toLocaleString('zh-CN'),
              },
              {
                key: 'closedAt',
                title: '关闭时间',
                width: '150px',
                render: (row: any) =>
                  row.shortageReplenish?.status === 'closed' ? (
                    new Date(
                      row.shortageReplenish?.updatedAt
                    ).toLocaleString('zh-CN')
                  ) : (
                    <span className="text-neutral-400">-</span>
                  ),
              },
              {
                key: 'action',
                title: '操作',
                width: '70px',
                render: (row: any) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/shortage-review/${row.id}`)
                    }}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    查看
                  </button>
                ),
              },
            ]}
            data={filteredOrders}
            rowKey="id"
            onRowClick={(row: any) => navigate(`/shortage-review/${row.id}`)}
            emptyText="暂无补发记录"
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-neutral-900">补发分析</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['红烧肉', '糖醋排骨', '宫保鸡丁', '清蒸鲈鱼'].map((item, idx) => (
              <div key={idx} className="text-center p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-600 mb-1">{item}</p>
                <p className="text-xl font-bold text-neutral-900">
                  {Math.floor(Math.random() * 20) + 5} 次
                </p>
                <p className="text-xs text-neutral-500 mt-1">累计缺货</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
