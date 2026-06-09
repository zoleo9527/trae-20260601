import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAppStore } from '@/hooks/useStore'
import StatusBadge from '@/components/StatusBadge'
import { Box, Clock, Search, Flag, CheckSquare, Square, ChevronDown, Receipt } from 'lucide-react'
import type { Container, OverstayRecord, FeeRecord, InspectionPlan } from '@/shared/types'

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'normal', label: '正常' },
  { key: 'overstay', label: '超期' },
  { key: 'inspecting', label: '查验中' },
  { key: 'disputed', label: '争议' },
  { key: 'misplaced', label: '错放' },
  { key: 'departed', label: '已离场' },
]

const DEFAULT_TAB: Record<string, string> = {
  gate_operator: 'normal',
  dispatcher: 'all',
  customer_service: 'overstay',
}

const ROLE_LABELS: Record<string, string> = {
  gate_operator: '闸口操作员',
  dispatcher: '调度员',
  customer_service: '客服专员',
}

const BATCH_STATUSES = ['normal', 'overstay', 'inspecting', 'disputed', 'misplaced', 'departed']

function overstayDaysColor(days: number) {
  if (days <= 7) return 'text-orange-500'
  if (days <= 14) return 'text-red-500'
  return 'text-red-800'
}

export default function Containers() {
  const { currentRole } = useAppStore()
  const navigate = useNavigate()

  const [containers, setContainers] = useState<Container[]>([])
  const [overstayRecords, setOverstayRecords] = useState<OverstayRecord[]>([])
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([])
  const [inspectionPlans, setInspectionPlans] = useState<InspectionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(DEFAULT_TAB[currentRole] || 'all')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchStatus, setBatchStatus] = useState('')
  const [showBatchMenu, setShowBatchMenu] = useState(false)

  useEffect(() => {
    setFilter(DEFAULT_TAB[currentRole] || 'all')
  }, [currentRole])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [containersData, overstayData, feeData, inspectionData] = await Promise.all([
        api.containers.list(),
        api.overstay.list(),
        api.fees.list(),
        api.inspections.list(),
      ])
      setContainers(containersData)
      setOverstayRecords(overstayData)
      setFeeRecords(feeData)
      setInspectionPlans(inspectionData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const overstayMap = useMemo(() => {
    const m = new Map<string, OverstayRecord>()
    overstayRecords.forEach(r => m.set(r.container_id, r))
    return m
  }, [overstayRecords])

  const feeMap = useMemo(() => {
    const m = new Map<string, FeeRecord>()
    feeRecords.forEach(f => m.set(f.container_id, f))
    return m
  }, [feeRecords])

  const inspectionMap = useMemo(() => {
    const m = new Map<string, InspectionPlan>()
    inspectionPlans.forEach(p => m.set(p.container_id, p))
    return m
  }, [inspectionPlans])

  const filtered = useMemo(() => {
    let result = filter === 'all' ? containers : containers.filter(c => c.status === filter)
    if (search) {
      result = result.filter(c => c.container_no.toLowerCase().includes(search.toLowerCase()))
    }
    return result
  }, [containers, filter, search])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)))
    }
  }

  const handleMarkMisplaced = async (id: string) => {
    await api.containers.updateStatus(id, 'misplaced', {
      operator_name: ROLE_LABELS[currentRole],
      role: currentRole,
      description: '标记为错放',
    })
    fetchData()
  }

  const handleBatchStatus = async () => {
    if (!batchStatus || selectedIds.size === 0) return
    await api.containers.batchStatus(Array.from(selectedIds), batchStatus, {
      operator_name: ROLE_LABELS[currentRole],
      role: currentRole,
      description: `批量状态变更为 ${batchStatus}`,
    })
    setSelectedIds(new Set())
    setBatchStatus('')
    setShowBatchMenu(false)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Clock className="w-8 h-8 text-port-navy animate-pulse" />
        <span className="ml-2 text-gray-500">加载箱号数据...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Box className="w-5 h-5 text-port-orange" />
        <h1 className="text-xl font-bold text-port-navy">箱号清单</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === tab.key ? 'bg-port-orange text-white' : 'bg-white text-gray-600 border'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索箱号..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-port-orange/30 focus:border-port-orange"
          />
        </div>
      </div>

      {currentRole === 'dispatcher' && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg">
          <span className="text-sm text-blue-700 font-medium">已选择 {selectedIds.size} 个箱号</span>
          <div className="relative">
            <button
              onClick={() => setShowBatchMenu(!showBatchMenu)}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              批量变更状态 <ChevronDown className="w-3 h-3" />
            </button>
            {showBatchMenu && (
              <div className="absolute top-full mt-1 left-0 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                {BATCH_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => { setBatchStatus(s); setShowBatchMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <StatusBadge status={s} type="container" />
                  </button>
                ))}
              </div>
            )}
          </div>
          {batchStatus && (
            <button onClick={handleBatchStatus} className="btn-danger text-xs px-3 py-1.5">
              确认变更为 <StatusBadge status={batchStatus} type="container" />
            </button>
          )}
          <button onClick={() => { setSelectedIds(new Set()); setBatchStatus('') }} className="text-xs text-gray-500 hover:text-gray-700">
            取消选择
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              {currentRole === 'dispatcher' && (
                <th className="px-4 py-3 text-left font-medium w-10">
                  <button onClick={toggleSelectAll}>
                    {selectedIds.size === filtered.length && filtered.length > 0
                      ? <CheckSquare className="w-4 h-4 text-port-orange" />
                      : <Square className="w-4 h-4 text-gray-400" />}
                  </button>
                </th>
              )}
              <th className="px-4 py-3 text-left font-medium">箱号</th>
              <th className="px-4 py-3 text-left font-medium">类型</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">客户</th>
              <th className="px-4 py-3 text-left font-medium">进闸时间</th>
              <th className="px-4 py-3 text-left font-medium">堆位</th>
              <th className="px-4 py-3 text-left font-medium">超期天数</th>
              <th className="px-4 py-3 text-left font-medium">关联信息</th>
              {currentRole === 'gate_operator' && (
                <th className="px-4 py-3 text-left font-medium">操作</th>
              )}
              {currentRole === 'customer_service' && (
                <th className="px-4 py-3 text-left font-medium">快捷操作</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(c => {
              const isMisplaced = c.status === 'misplaced'
              const overstay = overstayMap.get(c.id)
              const fee = feeMap.get(c.id)
              const inspection = inspectionMap.get(c.id)
              return (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/containers/${c.id}`)}
                  className={`cursor-pointer transition-colors ${isMisplaced ? 'bg-red-50 animate-pulse-misplaced hover:bg-red-100' : 'hover:bg-gray-50'}`}
                >
                  {currentRole === 'dispatcher' && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(c.id)}>
                        {selectedIds.has(c.id)
                          ? <CheckSquare className="w-4 h-4 text-port-orange" />
                          : <Square className="w-4 h-4 text-gray-400" />}
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Link to={`/containers/${c.id}`} onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline font-mono">
                      {c.container_no}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{c.type}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} type="container" /></td>
                  <td className="px-4 py-3 text-gray-700">{c.customer_name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.gate_in_time?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">{c.yard_position || '-'}</td>
                  <td className="px-4 py-3">
                    {c.overstay_days > 0 ? (
                      <span className={`font-bold ${overstayDaysColor(c.overstay_days)}`}>{c.overstay_days}天</span>
                    ) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {overstay && (
                        <Link to="/overstay" onClick={e => e.stopPropagation()} className="text-orange-500 hover:underline text-xs">
                          超期{overstay.overstay_days}天
                        </Link>
                      )}
                      {fee && (
                        <Link to="/fee-review" onClick={e => e.stopPropagation()} className="text-port-orange hover:underline text-xs">
                          费用{fee.review_status === 'approved' ? '已审' : '待审'}
                        </Link>
                      )}
                      {inspection && (
                        <Link to="/inspection" onClick={e => e.stopPropagation()} className="text-amber-600 hover:underline text-xs">
                          查验{inspection.status === 'completed' ? '完成' : '进行中'}
                        </Link>
                      )}
                      {!overstay && !fee && !inspection && <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  {currentRole === 'gate_operator' && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {c.status !== 'misplaced' && c.status !== 'departed' && (
                        <button
                          onClick={() => handleMarkMisplaced(c.id)}
                          className="text-xs px-2.5 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium flex items-center gap-1"
                        >
                          <Flag className="w-3 h-3" />标记异常
                        </button>
                      )}
                    </td>
                  )}
                  {currentRole === 'customer_service' && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {fee && (
                        <Link
                          to="/fee-review"
                          className="text-xs px-2.5 py-1 bg-port-orange/10 text-port-orange rounded-lg hover:bg-port-orange/20 font-medium inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3 h-3" />费用处理
                        </Link>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400">暂无箱号记录</div>
        )}
      </div>
    </div>
  )
}
