import { useEffect, useState, useMemo } from 'react'
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
  ChevronDown,
  ChevronUp,
  Link2,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'
import { useIncidentStore } from '@/store/useIncidentStore'
import type { IncidentType, MaterialStatus, InsuranceMaterialWithNotes } from '@/shared/types'
import { STATUS_FLOW, STATUS_LABELS, NOTE_CATEGORY_LABELS } from '@/shared/types'

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

const materialStatusLabels: Record<MaterialStatus, string> = {
  pending: '待提交',
  submitted: '已提交',
  reviewed: '已审核',
  rejected: '已驳回',
}

const materialStatusColors: Record<MaterialStatus, string> = {
  pending: 'bg-slate-100 text-slate-600',
  submitted: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const noteCategoryColors: Record<string, string> = {
  rescue: 'bg-blue-100 text-blue-700',
  medical: 'bg-red-100 text-red-700',
  insurance: 'bg-green-100 text-green-700',
  anomaly: 'bg-amber-100 text-amber-700',
}

function formatDateTime(isoString: string) {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentIncident, timeline, insuranceMaterials, loading, fetchIncidentDetail, fetchTimeline } = useIncidentStore()
  const [dataReady, setDataReady] = useState(false)
  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null)

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
  const materials = insuranceMaterials
  const currentStatusIndex = incident ? STATUS_FLOW.indexOf(incident.status) : -1
  const TypeIcon = incident ? (typeIcons[incident.type] || HelpCircle) : HelpCircle

  const noteReferenceCount = useMemo(() => {
    const countMap = new Map<string, number>()
    materials.forEach((m) => {
      if (m.referenced_notes && m.referenced_notes.length > 0) {
        m.referenced_notes.forEach((note) => {
          countMap.set(note.id, (countMap.get(note.id) || 0) + 1)
        })
      }
      if (m.anomaly_referenced_notes && m.anomaly_referenced_notes.length > 0) {
        m.anomaly_referenced_notes.forEach((note) => {
          countMap.set(note.id, (countMap.get(note.id) || 0) + 1)
        })
      }
    })
    return countMap
  }, [materials])

  const toggleMaterialExpand = (materialId: string) => {
    setExpandedMaterialId(expandedMaterialId === materialId ? null : materialId)
  }

  const getTotalReferencedNotesCount = (material: InsuranceMaterialWithNotes) => {
    let count = 0
    if (material.referenced_notes) count += material.referenced_notes.length
    if (material.anomaly_referenced_notes) count += material.anomaly_referenced_notes.length
    return count
  }

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
            <div className="col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-800 mb-4">事件时间线</h2>
                {displayTimeline.length > 0 ? (
                  <Timeline items={displayTimeline} noteReferenceCount={noteReferenceCount} />
                ) : (
                  <div className="text-center py-8 text-slate-500">暂无时间线记录</div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-800">保险材料</h2>
                  <span className="text-xs text-slate-500">共 {materials.length} 份材料</span>
                </div>
                {materials.length > 0 ? (
                  <div className="space-y-3">
                    {materials.map((material) => {
                      const totalNotes = getTotalReferencedNotesCount(material)
                      return (
                        <div
                          key={material.id}
                          className="border border-slate-200 rounded-lg overflow-hidden"
                        >
                          <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => toggleMaterialExpand(material.id)}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="p-2 bg-ice-50 rounded-lg">
                                <FileText className="w-5 h-5 text-ice-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-sm font-medium text-slate-800">{material.material_type}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${materialStatusColors[material.status]}`}>
                                    {materialStatusLabels[material.status]}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    审核人: {material.reviewer || '未分配'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDateTime(material.created_at)}
                                  </span>
                                  {totalNotes > 0 && (
                                    <span className="flex items-center gap-1 text-ice-600">
                                      <Link2 className="w-3 h-3" />
                                      引用 {totalNotes} 条备注
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                                {expandedMaterialId === material.id ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>
                          {expandedMaterialId === material.id && (
                            <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
                              {material.referenced_notes && material.referenced_notes.length > 0 && (
                                <div className="pl-4 border-l-2 border-ice-300">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Link2 className="w-4 h-4 text-ice-600" />
                                    <span className="text-xs font-medium text-ice-700">引用来源备注</span>
                                  </div>
                                  <div className="space-y-3">
                                    {material.referenced_notes.map((note, noteIndex) => (
                                      <div key={note.id} className="relative">
                                        {noteIndex > 0 && (
                                          <div className="absolute -top-3 left-4 w-0.5 h-3 bg-slate-300" />
                                        )}
                                        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <User className="w-3.5 h-3.5 text-slate-400" />
                                              <span className="text-xs font-medium text-slate-700">{note.author}</span>
                                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${noteCategoryColors[note.category]}`}>
                                                {NOTE_CATEGORY_LABELS[note.category]}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                              <Clock className="w-3 h-3" />
                                              {formatDateTime(note.created_at)}
                                            </div>
                                          </div>
                                          <p className="text-sm text-slate-600">{note.content}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {material.anomaly_referenced_notes && material.anomaly_referenced_notes.length > 0 && (
                                <div className="pl-4 border-l-2 border-amber-300">
                                  <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    <span className="text-xs font-medium text-amber-700">异常说明引用备注</span>
                                  </div>
                                  <div className="space-y-3">
                                    {material.anomaly_referenced_notes.map((note, noteIndex) => (
                                      <div key={note.id} className="relative">
                                        {noteIndex > 0 && (
                                          <div className="absolute -top-3 left-4 w-0.5 h-3 bg-slate-300" />
                                        )}
                                        <div className="bg-white border border-amber-200 rounded-lg p-3 shadow-sm bg-amber-50">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <User className="w-3.5 h-3.5 text-slate-400" />
                                              <span className="text-xs font-medium text-slate-700">{note.author}</span>
                                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${noteCategoryColors[note.category]}`}>
                                                {NOTE_CATEGORY_LABELS[note.category]}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                              <Clock className="w-3 h-3" />
                                              {formatDateTime(note.created_at)}
                                            </div>
                                          </div>
                                          <p className="text-sm text-slate-600">{note.content}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>暂无保险材料记录</p>
                  </div>
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
