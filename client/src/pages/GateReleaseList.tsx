import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import type { GateRelease, GateReleaseListParams } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import { Clock, CheckCircle, AlertTriangle, Activity, Search, RotateCcw, AlertCircle } from 'lucide-react'

export default function GateReleaseList() {
  const [releases, setReleases] = useState<GateRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [releaseTypeFilter, setReleaseTypeFilter] = useState('')
  const [containerNoSearch, setContainerNoSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchReleases = useCallback((params?: GateReleaseListParams) => {
    setLoading(true)
    api.gateReleases.list(params)
      .then(setReleases)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchReleases() }, [fetchReleases])

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

  const applyFilters = () => {
    const params: GateReleaseListParams = {}
    if (statusFilter) params.status = statusFilter
    if (releaseTypeFilter) params.release_type = releaseTypeFilter
    if (containerNoSearch) params.container_no = containerNoSearch
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    fetchReleases(params)
  }

  const resetFilters = () => {
    setStatusFilter('')
    setReleaseTypeFilter('')
    setContainerNoSearch('')
    setDateFrom('')
    setDateTo('')
    fetchReleases()
  }

  const truncateNotes = (notes: string | null) => {
    if (!notes) return '-'
    return notes.length > 20 ? notes.slice(0, 20) + '...' : notes
  }

  if (loading) return <p className="text-gray-400 py-8">加载中...</p>

  return (
    <div className="space-y-6">
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
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">全部</option>
            <option value="待处理">待处理</option>
            <option value="已放行">已放行</option>
            <option value="异常退回">异常退回</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">放行类型</label>
          <select
            value={releaseTypeFilter}
            onChange={e => setReleaseTypeFilter(e.target.value)}
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
            onChange={e => setContainerNoSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="输入箱号..."
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">开始日期</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">结束日期</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={applyFilters}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
        >
          <Search size={14} /> 搜索
        </button>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
        >
          <RotateCcw size={14} /> 重置
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
              <tr key={r.id} className="hover:bg-gray-50">
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
                <td colSpan={9} className="px-6 py-8 text-center text-gray-400">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
