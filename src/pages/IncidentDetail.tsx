import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Calendar,
  UserCheck,
  Wrench,
  FileText,
  Heart,
  Snowflake,
  Wrench as WrenchIcon,
  HelpCircle,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'
import { useIncidentStore } from '@/store/useIncidentStore'
import type { IncidentType } from '@/shared/types'
import { STATUS_FLOW, STATUS_LABELS } from '@/shared/types'

const typeIcons: Record<IncidentType, typeof Heart> = {
  rescue: Heart,
  medical: Heart,
  weather: Snowflake,
  equipment: WrenchIcon,
  other: HelpCircle,
}

const typeLabels: Record<IncidentType, string> = {
  rescue: '滑雪救援',
  medical: '医疗急救',
  weather: '天气相关',
  equipment: '设备故障',
  other: '其他事件',
}

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentIncident, timeline, loading, fetchIncidentDetail, fetchTimeline } = useIncidentStore()
  const [dataReady, setDataReady] = useState(false)

  useEffect(() => {
    if (id) {
      fetchIncidentDetail(id)
      fetchTimeline(id)
      const timer = setTimeout(() => setDataReady(true), 300)
      return () => clearTimeout(timer)
    }
  }, [id, fetchIncidentDetail, fetchTimeline])

  const incident = currentIncident
  const displayTimeline = timeline
  const currentStatusIndex = incident ? STATUS_FLOW.indexOf(incident.status) : -1
  const TypeIcon = incident ? (typeIcons[incident.type] || HelpCircle) : HelpCircle

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回事件总览
      </button>

      {loading && !dataReady ? (
        <div className="text-center py-12 text-slate-500">加载中...</div>
      ) : !incident ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
          未找到事件数据
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-ice-50 rounded-xl">
                  <TypeIcon className="w-6 h-6 text-ice-600" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl font-bold text-slate-800">{incident.incident_no}</h1>
                    <StatusBadge status={incident.status} />
                  </div>
                  <p className="text-sm text-slate-500">{typeLabels[incident.type] || '其他事件'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/incident/${id}/process`)}
                  className="px-4 py-2 bg-ice-600 text-white text-sm font-medium rounded-lg hover:bg-ice-700 transition-colors flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  处置事件
                </button>
                <button
                  onClick={() => navigate(`/incident/${id}/insurance`)}
                  className="px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  保险材料
                </button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-3">处理进度</p>
              <div className="flex items-center">
                {STATUS_FLOW.map((status, index) => {
                  const isActive = index <= currentStatusIndex
                  const isCurrent = index === currentStatusIndex
                  return (
                    <div key={status} className="flex items-center flex-1 last:flex-none">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                          isActive
                            ? 'bg-ice-600 text-white'
                            : 'bg-slate-100 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-ice-100' : ''}`}
                      >
                        {index + 1}
                      </div>
                      <div className="ml-2 mr-4">
                        <p className={`text-xs font-medium ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>
                          {STATUS_LABELS[status]}
                        </p>
                      </div>
                      {index < STATUS_FLOW.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 -ml-3 mr-1 ${
                            index < currentStatusIndex ? 'bg-ice-600' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-800 mb-4">事件时间线</h2>
                {displayTimeline.length > 0 ? (
                  <Timeline items={displayTimeline} />
                ) : (
                  <div className="text-center py-8 text-slate-500">暂无时间线记录</div>
                )}
              </div>
            </div>

            <div className="col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-800 mb-4">基本信息</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">事件位置</p>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {incident.location || '未记录'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">伤者姓名</p>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <User className="w-4 h-4 text-slate-400" />
                      {incident.injured_name || '未记录'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">联系电话</p>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {incident.injured_phone || '未记录'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">责任人</p>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      {incident.responsible_person || '未分配'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">发生时间</p>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(incident.occurred_at || incident.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">事件描述</p>
                    <p className="text-sm text-slate-600">{incident.description || '暂无描述'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
