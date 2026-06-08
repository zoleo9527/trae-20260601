import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useStore from '@/store'

const TABS = [
  { key: 'linen', label: '布草损耗分析' },
  { key: 'inspection', label: '查房漏项统计' },
  { key: 'maintenance', label: '维修响应时效' },
]

const GROUP_BY: Record<string, { linen: string; inspection: string }> = {
  floor: { linen: '楼层', inspection: '楼层' },
  person: { linen: '人员', inspection: '人员' },
  category: { linen: '品类', inspection: '项目' },
}

export default function Statistics() {
  const { stats, fetchLinenLossStats, fetchInspectionMissStats, fetchMaintenanceResponseStats } = useStore()
  const [tab, setTab] = useState('linen')
  const [groupBy, setGroupBy] = useState('floor')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchStats = (t: string, gb: string, from: string, to: string) => {
    const params: Record<string, string> = {}
    if (from) params.from = from
    if (to) params.to = to
    if (t === 'linen') { params.groupBy = gb; fetchLinenLossStats(params) }
    else if (t === 'inspection') { params.groupBy = gb; fetchInspectionMissStats(params) }
    else fetchMaintenanceResponseStats(params)
  }

  useEffect(() => {
    fetchStats(tab, groupBy, dateFrom, dateTo)
  }, [tab, groupBy, dateFrom, dateTo])

  const linenData = (stats.linenLoss as any[]) || []
  const inspectionData = (stats.inspectionMiss as any[]) || []
  const maintData = (stats.maintenanceResponse as any) || {}

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">数据统计</h1>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-white shadow-sm text-[#1e3a5f]' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-3 items-center">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        <span className="text-gray-400">至</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        {tab !== 'maintenance' && (
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
            <option value="floor">按楼层</option>
            <option value="person">按人员</option>
            {tab === 'linen' && <option value="category">按品类</option>}
            {tab === 'inspection' && <option value="item">按项目</option>}
          </select>
        )}
      </div>

      {tab === 'linen' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-[#1e3a5f] mb-4">布草损耗分析</h3>
          {linenData.length > 0 ? (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={linenData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-12 text-gray-400">暂无数据</div>}
        </div>
      )}

      {tab === 'inspection' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-[#1e3a5f] mb-4">查房漏项统计</h3>
          {inspectionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={inspectionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#d4940a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-12 text-gray-400">暂无数据</div>}
        </div>
      )}

      {tab === 'maintenance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">平均响应时间</p>
              <p className="text-2xl font-bold text-[#1e3a5f]">{maintData.avgResponseTime ?? '-'}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">工单总数</p>
              <p className="text-2xl font-bold text-[#d4940a]">{maintData.total ?? '-'}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">完成率</p>
              <p className="text-2xl font-bold text-[#16a34a]">{maintData.completionRate ?? '-'}</p>
            </div>
          </div>
          {maintData.byStatus && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-[#1e3a5f] mb-4">按状态分布</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={maintData.byStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
