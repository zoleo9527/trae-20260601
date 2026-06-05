import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  MapPin,
  User,
  Phone,
  AlertTriangle,
  Activity,
  FileText,
  Heart,
  Snowflake,
  Wrench,
  HelpCircle,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { useIncidentStore } from '@/store/useIncidentStore'
import type { IncidentStatus, IncidentType } from '@/shared/types'
import { STATUS_LABELS } from '@/shared/types'

const typeIcons: Record<IncidentType, typeof Heart> = {
  rescue: Heart,
  medical: Heart,
  weather: Snowflake,
  equipment: Wrench,
  other: HelpCircle,
}

const typeLabels: Record<IncidentType, string> = {
  rescue: '滑雪救援',
  medical: '医疗急救',
  weather: '天气相关',
  equipment: '设备故障',
  other: '其他事件',
}

export default function IncidentList() {
  const navigate = useNavigate()
  const { incidents, filters, loading, setFilters, fetchIncidents } = useIncidentStore()

  useEffect(() => {
    fetchIncidents()
  }, [fetchIncidents])

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayRescues = incidents.filter(i => i.created_at.startsWith(today)).length
    const processing = incidents.filter(i => i.status === 'processing').length
    const needInsurance = incidents.filter(i => 
      ['processing', 'review'].includes(i.status)
    ).length

    return [
      { label: '今日救援', value: String(todayRescues), icon: Activity, color: 'bg-red-50 text-red-600' },
      { label: '处置中', value: String(processing), icon: AlertTriangle, color: 'bg-blue-50 text-blue-600' },
      { label: '待保险材料', value: String(needInsurance), icon: FileText, color: 'bg-amber-50 text-amber-600' },
    ]
  }, [incidents])

  const statusOptions = [
    { value: '', label: '全部状态' },
    ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ]

  const responsiblePersons = useMemo(() => {
    const persons = new Set<string>()
    incidents.forEach(i => {
      if (i.responsible_person) persons.add(i.responsible_person)
    })
    return ['', ...Array.from(persons)]
  }, [incidents])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">事件总览</h1>
        <p className="text-sm text-slate-500 mt-1">查看和管理所有雪场救援事件</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">筛选:</span>
          </div>
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ status: e.target.value as IncidentStatus | '' })
              setTimeout(() => fetchIncidents(), 0)
            }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-ice-500 focus:border-transparent"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={filters.responsible_person}
            onChange={(e) => {
              setFilters({ responsible_person: e.target.value })
              setTimeout(() => fetchIncidents(), 0)
            }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-ice-500 focus:border-transparent"
          >
            {responsiblePersons.map((person) => (
              <option key={person} value={person}>
                {person || '全部责任人'}
              </option>
            ))}
          </select>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索事件编号、位置、伤者姓名..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ search: e.target.value })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchIncidents()
                }
              }}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-ice-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">加载中...</div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
          暂无救援事件数据
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {incidents.map((incident) => {
            const TypeIcon = typeIcons[incident.type] || HelpCircle
            return (
              <div
                key={incident.id}
                onClick={() => navigate(`/incident/${incident.id}`)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-ice-200 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-ice-50 rounded-lg">
                      <TypeIcon className="w-5 h-5 text-ice-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        {incident.incident_no}
                      </h3>
                      <p className="text-xs text-slate-500">{typeLabels[incident.type] || '其他事件'}</p>
                    </div>
                  </div>
                  <StatusBadge status={incident.status} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{incident.location || '未记录位置'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>伤者: {incident.injured_name || '未记录'}</span>
                    {incident.injured_phone && (
                      <>
                        <span className="text-slate-300">|</span>
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{incident.injured_phone}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      责任人: {incident.responsible_person || '未分配'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(incident.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
