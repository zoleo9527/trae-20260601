import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAppStore } from '@/hooks/useStore'
import { LogIn, LogOut, AlertTriangle, Clock, X } from 'lucide-react'
import type { GateRecord, Container, AnomalyType } from '@/shared/types'

const anomalyLabels: Record<AnomalyType, string> = {
  none: '无',
  doc_mismatch: '单证不符',
  container_damaged: '箱体损坏',
  overdue_pickup: '逾期提箱',
}

const anomalyColors: Record<AnomalyType, string> = {
  none: 'bg-gray-100 text-gray-600',
  doc_mismatch: 'bg-amber-100 text-amber-700',
  container_damaged: 'bg-red-100 text-red-700',
  overdue_pickup: 'bg-orange-100 text-orange-700',
}

const directionTabs = [
  { key: 'all', label: '全部' },
  { key: 'in', label: '进场' },
  { key: 'out', label: '出场' },
]

const anomalyTabs = [
  { key: 'all', label: '全部' },
  { key: 'none', label: '无异常' },
  { key: 'doc_mismatch', label: '单证不符' },
  { key: 'container_damaged', label: '箱体损坏' },
  { key: 'overdue_pickup', label: '逾期提箱' },
]

const containerTypeOptions: string[] = ['20GP', '40GP', '40HC', '20RF']

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}年${m}月${day}日 ${h}:${min}:${s}`
}

interface GateInForm {
  container_no: string
  type: string
  customer_id: string
  customer_name: string
  yard_position: string
  free_days: number
  anomaly: AnomalyType
  anomaly_note: string
}

interface GateOutForm {
  container_id: string
  container_no: string
}

interface AnomalyForm {
  anomaly: AnomalyType
  anomaly_note: string
}

const defaultGateInForm: GateInForm = {
  container_no: '',
  type: '20GP',
  customer_id: '',
  customer_name: '',
  yard_position: '',
  free_days: 7,
  anomaly: 'none',
  anomaly_note: '',
}

export default function GateRecords() {
  const [records, setRecords] = useState<GateRecord[]>([])
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [directionFilter, setDirectionFilter] = useState('all')
  const [anomalyFilter, setAnomalyFilter] = useState('all')
  const [showGateIn, setShowGateIn] = useState(false)
  const [showGateOut, setShowGateOut] = useState(false)
  const [showAnomaly, setShowAnomaly] = useState(false)
  const [gateInForm, setGateInForm] = useState<GateInForm>({ ...defaultGateInForm })
  const [gateOutForm, setGateOutForm] = useState<GateOutForm>({ container_id: '', container_no: '' })
  const [anomalyForm, setAnomalyForm] = useState<AnomalyForm>({ anomaly: 'none', anomaly_note: '' })
  const [editingRecord, setEditingRecord] = useState<GateRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { currentRole } = useAppStore()

  const isGateOperator = currentRole === 'gate_operator'

  const fetchData = async () => {
    setLoading(true)
    try {
      const [recordsData, containersData] = await Promise.all([
        api.gateRecords.list(),
        api.containers.list(),
      ])
      setRecords(recordsData)
      setContainers(containersData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = useMemo(() => {
    let result = [...records]
    if (directionFilter !== 'all') {
      result = result.filter((r) => r.direction === directionFilter)
    }
    if (anomalyFilter !== 'all') {
      result = result.filter((r) => r.anomaly === anomalyFilter)
    }
    return result.sort((a, b) => new Date(b.gate_time).getTime() - new Date(a.gate_time).getTime())
  }, [records, directionFilter, anomalyFilter])

  const inCount = records.filter((r) => r.direction === 'in').length
  const outCount = records.filter((r) => r.direction === 'out').length
  const anomalyCount = records.filter((r) => r.anomaly !== 'none').length

  const inFieldContainers = useMemo(
    () => containers.filter((c) => c.status !== 'departed'),
    [containers],
  )

  const handleGateIn = async () => {
    if (!gateInForm.container_no.trim()) return
    setSubmitting(true)
    try {
      await api.gateRecords.create({
        container_no: gateInForm.container_no,
        direction: 'in',
        operator_name: '闸口员',
        type: gateInForm.type,
        customer_id: gateInForm.customer_id,
        customer_name: gateInForm.customer_name,
        free_days: gateInForm.free_days,
        yard_position: gateInForm.yard_position || undefined,
        anomaly: gateInForm.anomaly,
        anomaly_note: gateInForm.anomaly_note || undefined,
      })
      setShowGateIn(false)
      setGateInForm({ ...defaultGateInForm })
      fetchData()
    } finally {
      setSubmitting(false)
    }
  }

  const handleGateOut = async () => {
    if (!gateOutForm.container_id) return
    setSubmitting(true)
    try {
      await api.gateRecords.create({
        container_id: gateOutForm.container_id,
        container_no: gateOutForm.container_no,
        direction: 'out',
        operator_name: '闸口员',
        gate_time: new Date().toISOString(),
      })
      setShowGateOut(false)
      setGateOutForm({ container_id: '', container_no: '' })
      fetchData()
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnomalyUpdate = async () => {
    if (!editingRecord) return
    setSubmitting(true)
    try {
      await api.gateRecords.update(editingRecord.id, {
        anomaly: anomalyForm.anomaly,
        anomaly_note: anomalyForm.anomaly_note || null,
      })
      setShowAnomaly(false)
      setEditingRecord(null)
      setAnomalyForm({ anomaly: 'none', anomaly_note: '' })
      fetchData()
    } finally {
      setSubmitting(false)
    }
  }

  const openAnomalyEdit = (record: GateRecord) => {
    setEditingRecord(record)
    setAnomalyForm({
      anomaly: record.anomaly,
      anomaly_note: record.anomaly_note || '',
    })
    setShowAnomaly(true)
  }

  const selectContainerForOut = (containerId: string) => {
    const c = inFieldContainers.find((c) => c.id === containerId)
    if (c) {
      setGateOutForm({ container_id: c.id, container_no: c.container_no })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Clock className="w-8 h-8 text-port-navy animate-pulse" />
        <span className="ml-2 text-gray-500">加载闸口记录...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogIn className="w-5 h-5 text-port-navy" />
          <h1 className="text-xl font-bold text-port-navy">闸口记录</h1>
        </div>
        {isGateOperator && (
          <div className="flex gap-2">
            <button
              className="btn-primary flex items-center gap-1.5"
              onClick={() => setShowGateIn(true)}
            >
              <LogIn className="w-4 h-4" />进闸登记
            </button>
            <button
              className="btn-primary flex items-center gap-1.5"
              onClick={() => {
                setGateOutForm({ container_id: '', container_no: '' })
                setShowGateOut(true)
              }}
            >
              <LogOut className="w-4 h-4" />出闸登记
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <LogIn className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">进场记录</p>
            <p className="text-xl font-bold text-port-navy">{inCount}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <LogOut className="w-8 h-8 text-emerald-500" />
          <div>
            <p className="text-sm text-gray-500">出场记录</p>
            <p className="text-xl font-bold text-port-navy">{outCount}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-sm text-gray-500">异常记录</p>
            <p className="text-xl font-bold text-port-navy">{anomalyCount}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {directionTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setDirectionFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${directionFilter === tab.key ? 'bg-port-orange text-white' : 'bg-white text-gray-600 border'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-gray-300" />
        <div className="flex gap-2">
          {anomalyTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setAnomalyFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${anomalyFilter === tab.key ? 'bg-port-orange text-white' : 'bg-white text-gray-600 border'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="px-4 py-3 text-left font-medium">箱号</th>
              <th className="px-4 py-3 text-left font-medium">方向</th>
              <th className="px-4 py-3 text-left font-medium">通过时间</th>
              <th className="px-4 py-3 text-left font-medium">操作员</th>
              <th className="px-4 py-3 text-left font-medium">异常类型</th>
              <th className="px-4 py-3 text-left font-medium">异常备注</th>
              {isGateOperator && <th className="px-4 py-3 text-left font-medium">操作</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <tr
                key={r.id}
                className={`hover:bg-gray-50 transition-colors ${r.anomaly !== 'none' ? 'bg-red-50' : ''}`}
              >
                <td className="px-4 py-3">
                  {currentRole === 'dispatcher' ? (
                    <Link to={`/containers/${r.container_id}`} className="text-blue-600 hover:underline">
                      {r.container_no}
                    </Link>
                  ) : (
                    <span className="text-gray-700">{r.container_no}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`status-badge ${r.direction === 'in' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {r.direction === 'in' ? '进场' : '出场'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDateTime(r.gate_time)}</td>
                <td className="px-4 py-3 text-gray-700">{r.operator_name}</td>
                <td className="px-4 py-3">
                  <span className={`status-badge ${anomalyColors[r.anomaly]}`}>
                    {anomalyLabels[r.anomaly]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{r.anomaly_note || '-'}</td>
                {isGateOperator && (
                  <td className="px-4 py-3">
                    <button
                      className="text-blue-600 hover:underline text-xs"
                      onClick={() => openAnomalyEdit(r)}
                    >
                      标记异常
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400">暂无闸口记录</div>
        )}
      </div>

      {showGateIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-port-navy">进闸登记</h2>
              <button onClick={() => setShowGateIn(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">箱号</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange"
                  value={gateInForm.container_no}
                  onChange={(e) => setGateInForm({ ...gateInForm, container_no: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange"
                  value={gateInForm.type}
                  onChange={(e) => setGateInForm({ ...gateInForm, type: e.target.value })}
                >
                  {containerTypeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">客户ID</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange"
                    value={gateInForm.customer_id}
                    onChange={(e) => setGateInForm({ ...gateInForm, customer_id: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">客户名称</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange"
                    value={gateInForm.customer_name}
                    onChange={(e) => setGateInForm({ ...gateInForm, customer_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">堆位（可选）</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange"
                    value={gateInForm.yard_position}
                    onChange={(e) => setGateInForm({ ...gateInForm, yard_position: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">免堆天数</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange"
                    value={gateInForm.free_days}
                    onChange={(e) => setGateInForm({ ...gateInForm, free_days: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">异常类型</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange"
                  value={gateInForm.anomaly}
                  onChange={(e) => setGateInForm({ ...gateInForm, anomaly: e.target.value as AnomalyType })}
                >
                  {(Object.keys(anomalyLabels) as AnomalyType[]).map((key) => (
                    <option key={key} value={key}>{anomalyLabels[key]}</option>
                  ))}
                </select>
              </div>
              {gateInForm.anomaly !== 'none' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">异常备注</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange"
                    rows={2}
                    value={gateInForm.anomaly_note}
                    onChange={(e) => setGateInForm({ ...gateInForm, anomaly_note: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
                onClick={() => setShowGateIn(false)}
              >
                取消
              </button>
              <button
                className="btn-primary px-4 py-2 text-sm"
                onClick={handleGateIn}
                disabled={submitting || !gateInForm.container_no.trim()}
              >
                {submitting ? '提交中...' : '确认进闸'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGateOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-port-navy">出闸登记</h2>
              <button onClick={() => setShowGateOut(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择在场箱号</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange"
                  value={gateOutForm.container_id}
                  onChange={(e) => selectContainerForOut(e.target.value)}
                >
                  <option value="">请选择箱号</option>
                  {inFieldContainers.map((c) => (
                    <option key={c.id} value={c.id}>{c.container_no}</option>
                  ))}
                </select>
              </div>
              {gateOutForm.container_no && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  确认出场箱号：<span className="font-medium text-gray-900">{gateOutForm.container_no}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
                onClick={() => setShowGateOut(false)}
              >
                取消
              </button>
              <button
                className="btn-primary px-4 py-2 text-sm"
                onClick={handleGateOut}
                disabled={submitting || !gateOutForm.container_id}
              >
                {submitting ? '提交中...' : '确认出闸'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnomaly && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-port-navy">标记异常</h2>
              <button onClick={() => setShowAnomaly(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-3">
              箱号：<span className="font-medium text-gray-900">{editingRecord.container_no}</span>
              {' | '}
              方向：<span className="font-medium text-gray-900">{editingRecord.direction === 'in' ? '进场' : '出场'}</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">异常类型</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange"
                  value={anomalyForm.anomaly}
                  onChange={(e) => setAnomalyForm({ ...anomalyForm, anomaly: e.target.value as AnomalyType })}
                >
                  {(Object.keys(anomalyLabels) as AnomalyType[]).map((key) => (
                    <option key={key} value={key}>{anomalyLabels[key]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">异常备注</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange"
                  rows={2}
                  value={anomalyForm.anomaly_note}
                  onChange={(e) => setAnomalyForm({ ...anomalyForm, anomaly_note: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
                onClick={() => setShowAnomaly(false)}
              >
                取消
              </button>
              <button
                className="btn-primary px-4 py-2 text-sm"
                onClick={handleAnomalyUpdate}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
