import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'
import type { FleetAppointment, FleetAppointmentListParams, Container, FleetAppointmentCreate, GateRelease } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import { Clock, Calendar, MapPin, AlertTriangle, RotateCcw, Plus, X, CheckSquare } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: '待确认', label: '待确认' },
  { value: '已确认', label: '已确认' },
  { value: '已到场', label: '已到场' },
  { value: '已完成', label: '已完成' },
  { value: '已取消', label: '已取消' },
  { value: '异常', label: '异常' },
]

export default function FleetAppointmentList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [appointments, setAppointments] = useState<FleetAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  const statusFilter = searchParams.get('status') || ''
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || ''
  const truckCompanySearch = searchParams.get('truck_company') || ''

  const setFilter = (key: string, value: string) => {
    setSearchParams(prev => {
      if (value) prev.set(key, value)
      else prev.delete(key)
      return prev
    }, { replace: true })
  }

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [containerSearch, setContainerSearch] = useState('')
  const [containerResults, setContainerResults] = useState<Container[]>([])
  const [selectedContainerId, setSelectedContainerId] = useState<number | null>(null)
  const [gateReleaseSearch, setGateReleaseSearch] = useState('')
  const [gateReleaseResults, setGateReleaseResults] = useState<GateRelease[]>([])
  const [selectedGateReleaseId, setSelectedGateReleaseId] = useState<number | null>(null)
  const [createForm, setCreateForm] = useState({
    truck_company: '',
    truck_plate: '',
    driver_name: '',
    driver_phone: '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
    operator: '',
  })

  const searchContainers = useCallback(async (q: string) => {
    if (!q) { setContainerResults([]); return }
    try {
      const data = await api.containers.list({ container_no: q })
      setContainerResults(data)
    } catch { setContainerResults([]) }
  }, [])

  const searchGateReleases = useCallback(async (q: string) => {
    if (!q) { setGateReleaseResults([]); return }
    try {
      const data = await api.gateReleases.list({ container_no: q })
      setGateReleaseResults(data)
    } catch { setGateReleaseResults([]) }
  }, [])

  const handleCreate = async () => {
    if (createLoading) return
    setCreateLoading(true)
    try {
      const data: FleetAppointmentCreate = {
        container_id: selectedContainerId || undefined,
        gate_release_id: selectedGateReleaseId || undefined,
        truck_company: createForm.truck_company || undefined,
        truck_plate: createForm.truck_plate || undefined,
        driver_name: createForm.driver_name || undefined,
        driver_phone: createForm.driver_phone || undefined,
        appointment_date: createForm.appointment_date || undefined,
        appointment_time: createForm.appointment_time || undefined,
        notes: createForm.notes || undefined,
        operator: createForm.operator || undefined,
      }
      await api.fleetAppointments.create(data)
      setShowCreateModal(false)
      setSelectedContainerId(null)
      setSelectedGateReleaseId(null)
      setContainerSearch('')
      setContainerResults([])
      setGateReleaseSearch('')
      setGateReleaseResults([])
      setCreateForm({ truck_company: '', truck_plate: '', driver_name: '', driver_phone: '', appointment_date: '', appointment_time: '', notes: '', operator: '' })
      fetchList()
    } finally {
      setCreateLoading(false)
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === appointments.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(appointments.map(a => a.id)))
    }
  }

  const handleBatchAction = async (action: 'confirm' | 'cancel') => {
    if (selectedIds.size === 0 || batchLoading) return
    setBatchLoading(true)
    try {
      const data = { ids: Array.from(selectedIds), operator: '操作员' }
      const result = action === 'confirm'
        ? await api.fleetAppointments.batchConfirm(data)
        : await api.fleetAppointments.batchCancel(data)
      setSelectedIds(new Set())
      fetchList(buildParams())
      if (result.failed.length > 0) {
        alert(`${result.success.length} 条成功，${result.failed.length} 条失败：\n${result.failed.map(f => `#${f.id}: ${f.reason}`).join('\n')}`)
      }
    } catch (err) {
      alert('批量操作失败：' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setBatchLoading(false)
    }
  }

  const buildParams = useCallback((): FleetAppointmentListParams => {
    const params: FleetAppointmentListParams = {}
    if (statusFilter) params.status = statusFilter
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    if (truckCompanySearch) params.truck_company = truckCompanySearch
    return params
  }, [statusFilter, dateFrom, dateTo, truckCompanySearch])

  const fetchList = useCallback(async (params?: FleetAppointmentListParams) => {
    setLoading(true)
    setSelectedIds(new Set())
    try {
      const data = await api.fleetAppointments.list(params)
      setAppointments(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchList(buildParams())
  }, [buildParams, fetchList])

  const handleQuickAction = async (id: number, action: 'confirm' | 'arrive') => {
    if (action === 'confirm') {
      await api.fleetAppointments.confirm(id, { operator: '操作员' })
    } else {
      await api.fleetAppointments.arrive(id, { operator: '操作员' })
    }
    fetchList(buildParams())
  }

  const stats = useMemo(() => ({
    pending: appointments.filter(a => a.status === '待确认').length,
    confirmed: appointments.filter(a => a.status === '已确认').length,
    arrived: appointments.filter(a => a.status === '已到场').length,
    completed: appointments.filter(a => a.status === '已完成').length,
    exception: appointments.filter(a => a.status === '异常').length,
  }), [appointments])

  const resetFilters = () => {
    setSearchParams({}, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">车队预约</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent-600 text-white rounded-lg text-sm font-medium hover:bg-accent-700"
        >
          <Plus size={16} /> 新建预约
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg"><Clock size={20} className="text-yellow-600" /></div>
          <div><p className="text-sm text-yellow-700">待确认</p><p className="text-2xl font-bold text-yellow-800">{stats.pending}</p></div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><Calendar size={20} className="text-blue-600" /></div>
          <div><p className="text-sm text-blue-700">已确认</p><p className="text-2xl font-bold text-blue-800">{stats.confirmed}</p></div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg"><MapPin size={20} className="text-purple-600" /></div>
          <div><p className="text-sm text-purple-700">已到场</p><p className="text-2xl font-bold text-purple-800">{stats.arrived}</p></div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg"><Calendar size={20} className="text-green-600" /></div>
          <div><p className="text-sm text-green-700">已完成</p><p className="text-2xl font-bold text-green-800">{stats.completed}</p></div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle size={20} className="text-red-600" /></div>
          <div><p className="text-sm text-red-700">异常</p><p className="text-2xl font-bold text-red-800">{stats.exception}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">状态</label>
            <select
              value={statusFilter}
              onChange={e => setFilter('status', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">预约日期起</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setFilter('date_from', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">预约日期止</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setFilter('date_to', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">车队搜索</label>
            <input
              type="text"
              value={truckCompanySearch}
              onChange={e => setFilter('truck_company', e.target.value)}
              placeholder="输入车队名称"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            <RotateCcw size={16} /> 重置
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-accent-50 border border-accent-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="text-accent-600" size={18} />
            <span className="text-sm font-medium text-accent-800">已选择 {selectedIds.size} 条记录</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchAction('confirm')}
              disabled={batchLoading}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              批量确认
            </button>
            <button
              onClick={() => handleBatchAction('cancel')}
              disabled={batchLoading}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              批量取消
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <p className="text-gray-400 p-8 text-center">加载中...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={appointments.length > 0 && selectedIds.size === appointments.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">箱号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">车队</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">车牌号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">司机/电话</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">预约日期/时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">来源</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">备注</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map(a => (
                  <tr key={a.id} className={`hover:bg-gray-50 ${selectedIds.has(a.id) ? 'bg-accent-50' : ''} ${a.status === '异常' ? 'border-l-4 border-l-red-500' : ''}`}>
                    <td className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(a.id)}
                        onChange={() => toggleSelect(a.id)}
                        className="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{a.container?.container_no || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.truck_company || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.truck_plate || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {a.driver_name || '-'}{a.driver_phone ? ` / ${a.driver_phone}` : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {a.appointment_date || '-'}{a.appointment_time ? ` ${a.appointment_time}` : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {a.gate_release_id ? `闸口#${a.gate_release_id}` : '独立预约'}
                    </td>
                    <td className="px-4 py-3 text-sm"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[120px] truncate" title={a.notes || ''}>
                      {a.notes ? (a.notes.length > 12 ? a.notes.slice(0, 12) + '…' : a.notes) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {a.status === '待确认' && (
                          <button
                            onClick={() => handleQuickAction(a.id, 'confirm')}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                          >
                            确认
                          </button>
                        )}
                        {a.status === '已确认' && (
                          <button
                            onClick={() => handleQuickAction(a.id, 'arrive')}
                            className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700"
                          >
                            到场
                          </button>
                        )}
                        <Link to={`/fleet-appointments/${a.id}`} className="text-blue-600 hover:underline text-xs">查看</Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {appointments.length === 0 && (
                  <tr><td colSpan={10} className="px-6 py-8 text-center text-gray-400">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">新建车队预约</h3>
              <button
                onClick={() => { setShowCreateModal(false); setSelectedContainerId(null); setSelectedGateReleaseId(null); setContainerSearch(''); setContainerResults([]); setGateReleaseSearch(''); setGateReleaseResults([]) }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关联闸口放行（可选）</label>
                <input
                  type="text"
                  value={gateReleaseSearch}
                  onChange={e => { setGateReleaseSearch(e.target.value); searchGateReleases(e.target.value) }}
                  placeholder="输入箱号搜索闸口放行..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                {gateReleaseResults.length > 0 && !selectedGateReleaseId && (
                  <div className="mt-1 border border-gray-200 rounded-lg max-h-32 overflow-y-auto">
                    {gateReleaseResults.map(gr => (
                      <button
                        key={gr.id}
                        onClick={() => {
                          setSelectedGateReleaseId(gr.id)
                          setGateReleaseSearch(`闸口#${gr.id} - ${gr.container?.container_no || ''}`)
                          setGateReleaseResults([])
                          if (gr.container_id) setSelectedContainerId(gr.container_id)
                          if (gr.truck_company) setCreateForm(f => ({ ...f, truck_company: gr.truck_company || f.truck_company }))
                          if (gr.truck_plate) setCreateForm(f => ({ ...f, truck_plate: gr.truck_plate || f.truck_plate }))
                          if (gr.driver_name) setCreateForm(f => ({ ...f, driver_name: gr.driver_name || f.driver_name }))
                          if (gr.driver_phone) setCreateForm(f => ({ ...f, driver_phone: gr.driver_phone || f.driver_phone }))
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent-50 flex items-center justify-between"
                      >
                        <span className="font-medium text-gray-900">闸口#{gr.id} - {gr.container?.container_no}</span>
                        <span className="text-xs text-gray-400">{gr.status}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedGateReleaseId && <p className="mt-1 text-xs text-green-600">已关联闸口放行记录</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">箱号（可选）</label>
                <input
                  type="text"
                  value={containerSearch}
                  onChange={e => { setContainerSearch(e.target.value); searchContainers(e.target.value) }}
                  placeholder="输入箱号搜索..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                {containerResults.length > 0 && !selectedContainerId && (
                  <div className="mt-1 border border-gray-200 rounded-lg max-h-32 overflow-y-auto">
                    {containerResults.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedContainerId(c.id); setContainerSearch(c.container_no); setContainerResults([]) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent-50 flex items-center justify-between"
                      >
                        <span className="font-medium text-gray-900">{c.container_no}</span>
                        <span className="text-xs text-gray-400">{c.size}{c.type}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedContainerId && <p className="mt-1 text-xs text-green-600">已选择箱号</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">车队</label>
                  <input type="text" value={createForm.truck_company} onChange={e => setCreateForm(f => ({ ...f, truck_company: e.target.value }))} placeholder="车队名称" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">车牌号</label>
                  <input type="text" value={createForm.truck_plate} onChange={e => setCreateForm(f => ({ ...f, truck_plate: e.target.value }))} placeholder="车牌号" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">司机姓名</label>
                  <input type="text" value={createForm.driver_name} onChange={e => setCreateForm(f => ({ ...f, driver_name: e.target.value }))} placeholder="司机姓名" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">司机电话</label>
                  <input type="text" value={createForm.driver_phone} onChange={e => setCreateForm(f => ({ ...f, driver_phone: e.target.value }))} placeholder="司机电话" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">预约日期</label>
                  <input type="date" value={createForm.appointment_date} onChange={e => setCreateForm(f => ({ ...f, appointment_date: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">预约时间</label>
                  <input type="time" value={createForm.appointment_time} onChange={e => setCreateForm(f => ({ ...f, appointment_time: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))} placeholder="输入备注..." rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">操作人</label>
                <input type="text" value={createForm.operator} onChange={e => setCreateForm(f => ({ ...f, operator: e.target.value }))} placeholder="操作人姓名" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => { setShowCreateModal(false); setSelectedContainerId(null); setSelectedGateReleaseId(null); setContainerSearch(''); setContainerResults([]); setGateReleaseSearch(''); setGateReleaseResults([]) }}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={createLoading}
                className="px-4 py-2 bg-accent-600 text-white rounded-lg text-sm font-medium hover:bg-accent-700 disabled:opacity-50"
              >
                {createLoading ? '提交中...' : '确认创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
