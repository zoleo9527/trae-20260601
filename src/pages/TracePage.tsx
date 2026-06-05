import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { StatusBadge, UrgencyBadge, GradingBadge } from "@/components/StatusBadge"
import { formatRelativeTime, formatDateTime, cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
import type { Procurement, Grading, StatusChange, User, ProcurementStatus, GradingLevel, Urgency } from "@/types"
import { STATUS_LABELS, URGENCY_LABELS, GRADING_LABELS, ROLE_LABELS } from "@/types"
import { Search, Eye, Clock, FileText, AlertCircle, Check, ArrowRight, RotateCcw, Flag, ArrowLeft, Loader2 } from "lucide-react"

interface TimelineEvent {
  id: string
  type: "created" | "remarks" | "status_change" | "grading" | "anomaly" | "grading_remarks"
  timestamp: string
  user?: User
  data: any
}

interface TraceData {
  procurement: Procurement
  timeline: TimelineEvent[]
}

export default function TracePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [traceData, setTraceData] = useState<TraceData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTrace = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/trace/${id}`)
      const result = await res.json()
      if (result.success) {
        setTraceData(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch trace:", error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTrace()
  }, [fetchTrace])

  const getEventColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "created":
        return "bg-emerald-500 border-emerald-400"
      case "remarks":
        return "bg-amber-500 border-amber-400"
      case "status_change":
        return "bg-blue-500 border-blue-400"
      case "grading":
        return "bg-purple-500 border-purple-400"
      case "anomaly":
        return "bg-red-500 border-red-400"
      case "grading_remarks":
        return "bg-sky-500 border-sky-400"
      default:
        return "bg-zinc-500 border-zinc-400"
    }
  }

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "created":
        return <Check size={12} className="text-white" />
      case "remarks":
        return <FileText size={12} className="text-white" />
      case "status_change":
        return <ArrowRight size={12} className="text-white" />
      case "grading":
        return <Eye size={12} className="text-white" />
      case "anomaly":
        return <AlertCircle size={12} className="text-white" />
      case "grading_remarks":
        return <FileText size={12} className="text-white" />
      default:
        return <Clock size={12} className="text-white" />
    }
  }

  const buildTimelineEvents = (): TimelineEvent[] => {
    if (!traceData) return []

    const events: TimelineEvent[] = []
    const { procurement } = traceData

    events.push({
      id: "created",
      type: "created",
      timestamp: procurement.createdAt,
      user: procurement.createdBy,
      data: {
        flowerName: procurement.flowerName,
        quantity: procurement.quantity,
        unit: procurement.unit,
        supplier: procurement.supplier,
        urgency: procurement.urgency,
      },
    })

    if (procurement.remarks) {
      events.push({
        id: "remarks",
        type: "remarks",
        timestamp: procurement.createdAt,
        user: procurement.createdBy,
        data: { remarks: procurement.remarks },
      })
    }

    if (procurement.statusChanges) {
      procurement.statusChanges.forEach((change, index) => {
        events.push({
          id: `status_${index}`,
          type: "status_change",
          timestamp: change.changedAt,
          user: change.changedBy,
          data: {
            fromStatus: change.fromStatus,
            toStatus: change.toStatus,
            reason: change.reason,
          },
        })
      })
    }

    if (procurement.grading) {
      events.push({
        id: "grading",
        type: "grading",
        timestamp: procurement.grading.gradedAt,
        user: procurement.grading.gradedBy,
        data: {
          level: procurement.grading.level,
        },
      })

      if (procurement.grading.anomalyNote) {
        events.push({
          id: "anomaly",
          type: "anomaly",
          timestamp: procurement.grading.gradedAt,
          user: procurement.grading.gradedBy,
          data: { anomalyNote: procurement.grading.anomalyNote },
        })
      }

      if (procurement.grading.remarks) {
        events.push({
          id: "grading_remarks",
          type: "grading_remarks",
          timestamp: procurement.grading.gradedAt,
          user: procurement.grading.gradedBy,
          data: { remarks: procurement.grading.remarks },
        })
      }
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  const renderEventContent = (event: TimelineEvent) => {
    switch (event.type) {
      case "created":
        return (
          <div>
            <p className="font-medium text-zinc-200 mb-2">
              {ROLE_LABELS[event.user?.role || "FLORIST"]}-{event.user?.name} 创建采购单
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-zinc-500">花材：</span>
                <span className="text-zinc-300">{event.data.flowerName}</span>
              </div>
              <div>
                <span className="text-zinc-500">数量：</span>
                <span className="text-zinc-300">{event.data.quantity}{event.data.unit}</span>
              </div>
              <div>
                <span className="text-zinc-500">供应商：</span>
                <span className="text-zinc-300">{event.data.supplier}</span>
              </div>
              <div>
                <span className="text-zinc-500">紧急度：</span>
                <span className="text-zinc-300">{URGENCY_LABELS[event.data.urgency as Urgency]}</span>
              </div>
            </div>
          </div>
        )

      case "remarks":
        return (
          <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-3">
            <p className="text-amber-400 font-medium text-sm mb-1 flex items-center gap-2">
              <FileText size={12} />
              采购备注
            </p>
            <p className="text-zinc-200 text-sm whitespace-pre-wrap">{event.data.remarks}</p>
          </div>
        )

      case "status_change":
        return (
          <div>
            <p className="font-medium text-zinc-200 mb-2">状态变更</p>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={event.data.fromStatus as ProcurementStatus} />
              <ArrowRight size={14} className="text-zinc-500" />
              <StatusBadge status={event.data.toStatus as ProcurementStatus} />
            </div>
            {event.data.reason && (
              <p className="text-sm text-zinc-400">
                <span className="text-zinc-500">原因：</span>
                {event.data.reason}
              </p>
            )}
            <p className="text-xs text-zinc-500 mt-1">
              操作人：{ROLE_LABELS[event.user?.role || "FLORIST"]}-{event.user?.name}
            </p>
          </div>
        )

      case "grading":
        return (
          <div>
            <p className="font-medium text-zinc-200 mb-2">到货分级</p>
            <div className="flex items-center gap-3 mb-2">
              <GradingBadge level={event.data.level as GradingLevel} />
            </div>
            <p className="text-xs text-zinc-500">
              分级人：{ROLE_LABELS[event.user?.role || "DISPATCHER"]}-{event.user?.name}
            </p>
          </div>
        )

      case "anomaly":
        return (
          <div className="border border-red-500/30 bg-red-500/5 rounded-lg p-3">
            <p className="text-red-400 font-medium text-sm mb-1 flex items-center gap-2">
              <AlertCircle size={12} />
              异常说明
            </p>
            <p className="text-zinc-200 text-sm whitespace-pre-wrap">{event.data.anomalyNote}</p>
          </div>
        )

      case "grading_remarks":
        return (
          <div className="border border-sky-500/30 bg-sky-500/5 rounded-lg p-3">
            <p className="text-sky-400 font-medium text-sm mb-1 flex items-center gap-2">
              <FileText size={12} />
              分级备注
            </p>
            <p className="text-zinc-200 text-sm whitespace-pre-wrap">{event.data.remarks}</p>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] text-zinc-100 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-zinc-500" />
      </div>
    )
  }

  if (!traceData) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-zinc-500" />
          <p className="text-zinc-400">未找到数据</p>
        </div>
      </div>
    )
  }

  const { procurement } = traceData
  const timelineEvents = buildTimelineEvents()

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-zinc-100">
      <div className="max-w-4xl mx-auto p-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          返回
        </button>

        <div className="bg-[#14141f] border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-3">{procurement.flowerName}</h1>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <StatusBadge status={procurement.status} />
                <UrgencyBadge urgency={procurement.urgency} />
                {procurement.grading && <GradingBadge level={procurement.grading.level} />}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500 block text-xs mb-1">数量</span>
                  <span className="text-zinc-200 font-medium">{procurement.quantity}{procurement.unit}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs mb-1">供应商</span>
                  <span className="text-zinc-200 font-medium">{procurement.supplier}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs mb-1">创建人</span>
                  <span className="text-zinc-200 font-medium">{procurement.createdBy.name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs mb-1">创建时间</span>
                  <span className="text-zinc-200 font-medium">{formatDateTime(procurement.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#14141f] border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Clock size={18} className="text-zinc-400" />
            链路追踪
          </h2>

          <div className="relative">
            {timelineEvents.map((event, index) => (
              <div key={event.id} className="flex gap-4 relative">
                {index < timelineEvents.length - 1 && (
                  <div className="absolute left-[19px] top-10 bottom-0 w-px bg-zinc-700" />
                )}

                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2",
                      getEventColor(event.type)
                    )}
                  >
                    {getEventIcon(event.type)}
                  </div>
                </div>

                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-zinc-300 font-medium">
                      {formatDateTime(event.timestamp)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      ({formatRelativeTime(event.timestamp)})
                    </span>
                  </div>
                  {renderEventContent(event)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
