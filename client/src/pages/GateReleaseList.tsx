import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'
import type { GateRelease, GateReleaseListParams, Container, GateReleaseCreate } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import { Clock, CheckCircle, AlertTriangle, Activity, Search, RotateCcw, AlertCircle, Plus, X, CheckSquare } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: '待处理', label: '待处理' },
  { value: '已放行', label: '已放行' },
  { value: '异常退回', label: '异常' },
]

export default function GateReleaseList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [releases, setReleases] = useState<GateRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  const statusFilter = searchParams.get('status') || ''
  const releaseTypeFilter = searchParams.get('release_type') || ''
  const containerNoSearch = searchParams.get('container_no') || ''
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || ''

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
  const [createForm, setCreateForm] = useState({
    release_type: '进港',
    truck_company: '',
    truck_plate: '',
    driver_name: '',
    driver_phone: '',
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

  const handleCreate = async () => {
    if (!selectedContainerId || createLoading) return
    setCreateLoading(true)
    try {
      const data: GateReleaseCreate = {
        container_id: selectedContainerId,
        release_type: createForm.release_type,
        truck_company: createForm.truck_company || undefined,
        truck_plate: createForm.truck_plate || undefined,
        driver_name: createForm.driver_name || undefined,
        driver_phone: createForm.driver_phone || undefined,
        notes: createForm.notes || undefined,
        operator: createForm.operator || undefined,
      }
      await api.gateReleases.create(data)
      setShowCreateModal(false)
      setSelectedContainerId(null)
      setContainerSearch('')
      setContainerResults([])
      setCreateForm({ release_type: '进港', truck_company: '', truck_plate: '', driver_name: '', driver_phone: '', notes: '', operator: '' })
      fetchReleases()
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
    if (selectedIds.size === releases.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(releases.map(r => r.id)))
    }
  }

  const handleBatchAction = async (action: 'release' | 'reject') => {
    if (selectedIds.size === 0 || batchLoading) return
    setBatchLoading(true)
    try {
      const data = { ids: Array.from(selectedIds), operator: '操作员' }
      const result = action === 'release'
        ? await api.gateReleases.batchRelease(data)
        : await api.gateReleases.batchReject(data)
      setSelectedIds(new Set())
      fetchReleases(buildParams())
      if (result.failed.length > 0) {
        alert(`${result.success.length} 条成功，${result.failed.length} 条失败：\n${result.failed.map(f => `#${f.id}: ${f.reason}`).join('\n')}`)
      }
    } catch (err) {
      alert('批量操作失败：' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setBatchLoading(false)
    }
  }

  const buildParams = useCallback((): GateReleaseListParams => {
    const params: GateReleaseListParams = {}
    if (statusFilter) params.status = statusFilter
    if (releaseTypeFilter) params.release_type = releaseTypeFilter
    if (containerNoSearch) params.container_no = containerNoSearch
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    return params
  }, [statusFilter, releaseTypeFilter, containerNoSearch, dateFrom, dateTo])

  const fetchReleases = useCallback((params?: GateReleaseListParams) => {
    setLoading(true)
    setSelectedIds(new Set())
    api.gateReleases.list(params)
      .then(setReleases)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchReleases(buildParams())
  }, [buildParams, fetchReleases])

  const stats = useMemo(() => ({
    pending: releases.filter(r => r.status === '待处理').length,
    released: releases.filter(r => r.status === '已放行').length,
    rejected: releases.filter(r => r.status === '异常退回').length,
    todayProcessed: releases.filter(r => {
      if (!r.released_at) return false
      const today = new Date().toISOString().slice(0, 10)
      return r.released_at.startsWith(today)
    }).length,
  }), [releases])

  const exceptions = useMemo(() => releases.filter(r => r.status === '异常退回'), [releases])

  const resetFilters = () => {
    setSearchParams({}, { replace: true })
  }

  const truncateNotes = (notes: string | null) => {
    if (!notes) return '-'
    return notes.length > 20 ? notes.slice(0, 20) + '...' : notes
  }

  if (loading) return <p className="text-gray-400 py-8">加载中...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">闸口放行</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          <Plus size={16} /> 新建放行
        </button>
      </div>

      {exceptions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-red-700 font-semibold">{exceptions.length} 条异常退回记录需要处理</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {exceptions.map(r => (
              <div key={r.id} className="bg-white border border-red-200 rounded-lg p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{r.container?.container_no || '-'}</p>
                  {r.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{r.notes}</p>}
                </div>
                <Link
                  to={`/gate-releases/${r.id}`}
                  className="text-xs text-red-600 hover:text-red-800 font-medium whitespace-nowrap ml-3"
                >
                  去处理 →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock className="text-yellow-600" size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            <p className="text-xs text-yellow-600">待处理</p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-700">{stats.released}</p>
            <p className="text-xs text-green-600">已放行</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="text-red-600" size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
            <p className="text-xs text-red-600">异常退回</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Activity className="text-blue-600" size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">{stats.todayProcessed}</p>
            <p className="text-xs text-blue-600">今日处理</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">状态</label>
          <select
            value={statusFilter}
            onChange={e => setFilter('status', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">放行类型</label>
          <select
            value={releaseTypeFilter}
            onChange={e => setFilter('release_type', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">全部</option>
            <option value="进港">进港</option>
            <option value="出港">出港</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">箱号搜索</label>
          <input
            type="text"
            value={containerNoSearch}
            onChange={e => setFilter('container_no', e.target.value)}
            placeholder="输入箱号..."
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">开始日期</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setFilter('date_from', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">结束日期</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setFilter('date_to', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
        >
          <RotateCcw size={14} /> 重置
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="text-primary-600" size={18} />
            <span className="text-sm font-medium text-primary-800">已选择 {selectedIds.size} 条记录</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchAction('release')}
              disabled={batchLoading}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              批量放行
            </button>
            <button
              onClick={() => handleBatchAction('reject')}
              disabled={batchLoading}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              批量异常退回
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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={releases.length > 0 && selectedIds.size === releases.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">箱号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">放行类型</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">车队</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">车牌号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">司机/电话</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">备注</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {releases.map(r => (
              <tr key={r.id} className={`hover:bg-gray-50 ${selectedIds.has(r.id) ? 'bg-primary-50' : ''}`}>
                <td className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td className={`px-4 py-3 text-sm ${r.status === '异常退回' ? 'border-l-4 border-l-red-400' : ''}`}>
                  <Link to={`/gate-releases/${r.id}`} className="text-primary-600 hover:underline">
                    {r.container?.container_no || '-'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.release_type}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.truck_company || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.truck_plate || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {r.driver_name || '-'}
                  {r.driver_phone && <span className="text-gray-400 ml-1">({r.driver_phone})</span>}
                </td>
                <td className="px-4 py-3 text-sm"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px]" title={r.notes || undefined}>
                  {truncateNotes(r.notes)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(r.created_at).toLocaleString('zh-CN')}</td>
                <td className="px-4 py-3 text-sm">
                  {r.status === '待处理' ? (
                    <Link to={`/gate-releases/${r.id}`} className="text-primary-600 hover:underline font-medium">处理</Link>
                  ) : (
                    <Link to={`/gate-releases/${r.id}`} className="text-gray-500 hover:text-gray-700">查看</Link>
                  )}
                </td>
              </tr>
            ))}
            {releases.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-gray-400">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">新建闸口放行</h3>
              <button
                onClick={() => { setShowCreateModal(false); setSelectedContainerId(null); setContainerSearch(''); setContainerResults([]) }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">箱号 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={containerSearch}
                  onChange={e => { setContainerSearch(e.target.value); searchContainers(e.target.value) }}
                  placeholder="输入箱号搜索..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {containerResults.length > 0 && !selectedContainerId && (
                  <div className="mt-1 border border-gray-200 rounded-lg max-h-32 overflow-y-auto">
                    {containerResults.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedContainerId(c.id); setContainerSearch(c.container_no); setContainerResults([]) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 flex items-center justify-between"
                      >
                        <span className="font-medium text-gray-900">{c.container_no}</span>
                        <span className="text-xs text-gray-400">{c.size}{c.type}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedContainerId && (
                  <p className="mt-1 text-xs text-green-600">已选择箱号</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">放行类型 <span className="text-red-500">*</span></label>
                <select
                  value={createForm.release_type}
                  onChange={e => setCreateForm(f => ({ ...f, release_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="进港">进港</option>
                  <option value="出港">出港</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">车队</label>
                  <input
                    type="text"
                    value={createForm.truck_company}
                    onChange={e => setCreateForm(f => ({ ...f, truck_company: e.target.value }))}
                    placeholder="车队名称"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">车牌号</label>
                  <input
                    type="text"
                    value={createForm.truck_plate}
                    onChange={e => setCreateForm(f => ({ ...f, truck_plate: e.target.value }))}
                    placeholder="车牌号"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">司机姓名</label>
                  <input
                    type="text"
                    value={createForm.driver_name}
                    onChange={e => setCreateForm(f => ({ ...f, driver_name: e.target.value }))}
                    placeholder="司机姓名"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">司机电话</label>
                  <input
                    type="text"
                    value={createForm.driver_phone}
                    onChange={e => setCreateForm(f => ({ ...f, driver_phone: e.target.value }))}
                    placeholder="司机电话"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={createForm.notes}
                  onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="输入备注..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">操作人</label>
                <input
                  type="text"
                  value={createForm.operator}
                  onChange={e => setCreateForm(f => ({ ...f, operator: e.target.value }))}
                  placeholder="操作人姓名"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => { setShowCreateModal(false); setSelectedContainerId(null); setContainerSearch(''); setContainerResults([]) }}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!selectedContainerId || createLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
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
