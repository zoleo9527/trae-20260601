import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAppStore } from '@/hooks/useStore'
import StatusBadge from '@/components/StatusBadge'
import { Clock, AlertTriangle, DollarSign, CheckCircle, ArrowRight, Link2, Zap } from 'lucide-react'
import type { OverstayRecord, FeeRecord } from '@/shared/types'

const flowSteps = ['pending_notify', 'notified', 'processing', 'closed']
const flowLabels: Record<string, string> = {
  pending_notify: '待通知', notified: '已通知', processing: '处理中', closed: '已结案',
}

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending_notify', label: '待通知' },
  { key: 'notified', label: '已通知' },
  { key: 'processing', label: '处理中' },
  { key: 'closed', label: '已结案' },
]

const ROLE_LABELS: Record<string, string> = {
  gate_operator: '闸口操作员',
  dispatcher: '调度员',
  customer_service: '客服专员',
}

function daysColor(days: number) {
  if (days <= 7) return 'text-orange-500'
  if (days <= 14) return 'text-red-500'
  return 'text-red-800'
}

function daysBarWidth(days: number) {
  return Math.min((days / 30) * 100, 100)
}

export default function Overstay() {
  const [records, setRecords] = useState<OverstayRecord[]>([])
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [generatingFeeId, setGeneratingFeeId] = useState<string | null>(null)
  const { currentRole } = useAppStore()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [overstayData, feeData] = await Promise.all([
        api.overstay.list(),
        api.fees.list(),
      ])
      setRecords(overstayData)
      setFees(feeData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const feeMap = useMemo(() => {
    const m = new Map<string, FeeRecord>()
    fees.forEach((f) => m.set(f.container_id, f))
    return m
  }, [fees])

  const sorted = useMemo(
    () => [...records].sort((a, b) => b.overstay_days - a.overstay_days),
    [records],
  )

  const filtered = useMemo(
    () => filter === 'all' ? sorted : sorted.filter((r) => r.status === filter),
    [sorted, filter],
  )

  const activeStep = useMemo(() => {
    const counts = new Map<string, number>()
    records.forEach((r) => counts.set(r.status, (counts.get(r.status) || 0) + 1))
    let max = 0
    let step = 'pending_notify'
    counts.forEach((c, s) => { if (c > max) { max = c; step = s } })
    return flowSteps.indexOf(step)
  }, [records])

  const pendingCount = records.filter((r) => r.status === 'pending_notify').length
  const totalFees = fees.reduce((s, f) => s + f.total_fee, 0)

  const handleNotify = async (id: string) => {
    await api.overstay.notify(id, {
      operator_name: ROLE_LABELS[currentRole],
      role: currentRole,
    })
    fetchData()
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    await api.overstay.updateStatus(id, status, {
      operator_name: ROLE_LABELS[currentRole],
      role: currentRole,
    })
    fetchData()
  }

  const handleGenerateFee = async (id: string) => {
    setGeneratingFeeId(id)
    try {
      await api.overstay.generateFee(id, {
        operator_name: ROLE_LABELS[currentRole],
        role: currentRole,
      })
      fetchData()
    } finally {
      setGeneratingFeeId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Clock className="w-8 h-8 text-port-navy animate-pulse" />
        <span className="ml-2 text-gray-500">加载超期数据...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-port-orange" />
        <h1 className="text-xl font-bold text-port-navy">超期堆存管理</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <Clock className="w-8 h-8 text-port-orange" />
          <div>
            <p className="text-sm text-gray-500">超期总数</p>
            <p className="text-xl font-bold text-port-navy">{records.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
          <div>
            <p className="text-sm text-gray-500">待通知</p>
            <p className="text-xl font-bold text-port-navy">{pendingCount}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-sm text-gray-500">超期费用合计</p>
            <p className="text-xl font-bold text-port-navy">¥{totalFees.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-center gap-0">
          {flowSteps.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= activeStep ? 'bg-port-orange text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i + 1}
                </div>
                <span className={`text-xs mt-1 ${i <= activeStep ? 'text-port-orange font-medium' : 'text-gray-400'}`}>
                  {flowLabels[step]}
                </span>
              </div>
              {i < flowSteps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${i < activeStep ? 'bg-port-orange' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === tab.key ? 'bg-port-orange text-white' : 'bg-white text-gray-600 border'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-3">超期 ↔ 费用复核 状态关联</h3>
        <div className="space-y-2">
          {sorted.map((r) => {
            const fee = feeMap.get(r.container_id)
            return (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <Link to={`/containers/${r.container_id}`} className="text-sm font-medium text-port-navy hover:text-port-orange w-28 shrink-0">
                  {r.container_no}
                </Link>
                <span className="text-xs text-gray-400 w-20 shrink-0">{r.customer_name || '-'}</span>
                <StatusBadge status={r.status} type="overstay" />
                <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                {fee ? (
                  <Link to="/fee-review" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <StatusBadge status={fee.review_status} type="fee" />
                    <span className="text-sm text-port-orange font-medium">¥{fee.total_fee.toLocaleString()}</span>
                  </Link>
                ) : (
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5" />未生成费用
                    {(currentRole === 'dispatcher' || currentRole === 'customer_service') && r.status !== 'closed' && (
                      <button
                        className="ml-1 text-xs text-port-orange hover:underline flex items-center gap-0.5"
                        onClick={() => handleGenerateFee(r.id)}
                        disabled={generatingFeeId === r.id}
                      >
                        <Zap className="w-3 h-3" />{generatingFeeId === r.id ? '生成中...' : '生成'}
                      </button>
                    )}
                  </span>
                )}
              </div>
            )
          })}
          {records.length === 0 && <p className="text-sm text-gray-400">暂无关联数据</p>}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="px-4 py-3 text-left font-medium">箱号</th>
              <th className="px-4 py-3 text-left font-medium">客户</th>
              <th className="px-4 py-3 text-left font-medium">超期天数</th>
              <th className="px-4 py-3 text-left font-medium">堆位</th>
              <th className="px-4 py-3 text-left font-medium">处理状态</th>
              <th className="px-4 py-3 text-left font-medium">关联费用</th>
              <th className="px-4 py-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => {
              const fee = feeMap.get(r.container_id)
              return (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/containers/${r.container_id}`} className="text-blue-600 hover:underline">
                      {r.container_no}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.customer_name || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${daysColor(r.overstay_days)}`}>{r.overstay_days}天</span>
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${r.overstay_days <= 7 ? 'bg-orange-400' : r.overstay_days <= 14 ? 'bg-red-400' : 'bg-red-700'}`}
                          style={{ width: `${daysBarWidth(r.overstay_days)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.yard_position || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} type="overstay" /></td>
                  <td className="px-4 py-3">
                    {fee ? (
                      <div className="flex items-center gap-2">
                        <Link to="/fee-review" className="text-port-orange hover:underline font-medium">
                          ¥{fee.total_fee.toLocaleString()}
                        </Link>
                        <StatusBadge status={fee.review_status} type="fee" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">未生成</span>
                        {(currentRole === 'dispatcher' || currentRole === 'customer_service') && r.status !== 'closed' && (
                          <button
                            className="text-port-orange text-xs hover:underline flex items-center gap-0.5"
                            onClick={() => handleGenerateFee(r.id)}
                            disabled={generatingFeeId === r.id}
                          >
                            <Zap className="w-3 h-3" />{generatingFeeId === r.id ? '...' : '生成'}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.status === 'closed' && (
                        <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />已结案
                        </span>
                      )}
                      {r.status === 'pending_notify' && currentRole === 'customer_service' && (
                        <button className="btn-primary text-xs px-2.5 py-1" onClick={() => handleNotify(r.id)}>发送通知</button>
                      )}
                      {r.status === 'notified' && currentRole === 'dispatcher' && (
                        <button className="btn-primary text-xs px-2.5 py-1" onClick={() => handleUpdateStatus(r.id, 'processing')}>开始处理</button>
                      )}
                      {r.status === 'processing' && currentRole === 'customer_service' && (
                        <button className="btn-primary text-xs px-2.5 py-1" onClick={() => handleUpdateStatus(r.id, 'closed')}>结案</button>
                      )}
                      {!['closed'].includes(r.status) && !(
                        (r.status === 'pending_notify' && currentRole === 'customer_service') ||
                        (r.status === 'notified' && currentRole === 'dispatcher') ||
                        (r.status === 'processing' && currentRole === 'customer_service')
                      ) && <span className="text-gray-400 text-xs">-</span>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400">暂无超期记录</div>
        )}
      </div>
    </div>
  )
}
