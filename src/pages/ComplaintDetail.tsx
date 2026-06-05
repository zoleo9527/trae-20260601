import { useParams, useNavigate } from "react-router-dom"
import { useComplaintStore, useCurrentRole } from "@/store/complaintStore"
import {
  PROBLEM_TYPE_LABELS,
  PROBLEM_TYPE_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  URGENCY_LABELS,
  COMPENSATION_LABELS,
} from "@/types"
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  Phone,
  User,
  AlertTriangle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { resolvePersonName } from "@/utils/resolvePersonName"
import TimelineEntry from "@/components/TimelineEntry"
import CompensationPanel from "@/components/CompensationPanel"
import AddNote from "@/components/AddNote"
import ReviewForm from "@/components/ReviewForm"
import { useState } from "react"

type CloseBlockReason = "no_compensation" | "compensation_unconfirmed" | null

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getComplaintById, closeComplaint } = useComplaintStore()
  const currentRole = useCurrentRole((s) => s.currentRole)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [closeReason, setCloseReason] = useState("")
  const [closeBlockReason, setCloseBlockReason] = useState<CloseBlockReason>(null)

  const complaint = id ? getComplaintById(id) : undefined

  if (!complaint) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-moss-400">工单不存在</p>
      </div>
    )
  }

  const isCompensationConfirmed = !!complaint.compensation?.confirmedAt

  const handleCloseClick = () => {
    if (!complaint.compensation) {
      setCloseBlockReason("no_compensation")
      return
    }
    if (!isCompensationConfirmed) {
      setCloseBlockReason("compensation_unconfirmed")
      return
    }
    setShowCloseConfirm(true)
  }

  const handleClose = () => {
    const personName = resolvePersonName(complaint, currentRole)
    closeComplaint(complaint.id, closeReason, personName, currentRole)
    setShowCloseConfirm(false)
    setCloseReason("")
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-lg hover:bg-moss-50 text-moss-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-2xl font-semibold text-moss-900">{complaint.id}</h2>
            <span
              className={cn(
                "px-2 py-0.5 rounded-md text-xs font-medium border",
                PROBLEM_TYPE_COLORS[complaint.problemType]
              )}
            >
              {PROBLEM_TYPE_LABELS[complaint.problemType]}
            </span>
            <span
              className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[complaint.status])}
            >
              {STATUS_LABELS[complaint.status]}
            </span>
            {complaint.urgency === "urgent" && (
              <span className="flex items-center gap-1 text-blush-500 text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                {URGENCY_LABELS[complaint.urgency]}
              </span>
            )}
          </div>
          <p className="text-sm text-moss-500 mt-0.5">订单号: {complaint.orderId}</p>
        </div>

        {complaint.status !== "closed" && complaint.status !== "reviewed" && (
          <button
            onClick={handleCloseClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-moss-200 text-sm text-moss-600 hover:bg-moss-50 hover:border-moss-300 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            关闭售后
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-moss-100 p-5">
            <h3 className="font-serif text-base font-semibold text-moss-900 mb-3">订单信息</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <InfoRow icon={<User className="w-3.5 h-3.5" />} label="收件人" value={complaint.customerName} />
              <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="联系电话" value={complaint.customerPhone} />
              <InfoRow icon={<Package className="w-3.5 h-3.5" />} label="花束内容" value={complaint.bouquetContent} />
              <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="配送地址" value={complaint.deliveryAddress} />
              <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="期望送达" value={complaint.expectedDelivery} />
              <InfoRow
                icon={<Clock className="w-3.5 h-3.5" />}
                label="实际送达"
                value={complaint.actualDelivery || "—"}
                highlight={!complaint.actualDelivery}
              />
            </div>

            <div className="floral-divider my-4" />

            <div>
              <p className="text-sm font-medium text-moss-700 mb-1.5">客诉描述</p>
              <p className="text-sm text-moss-800/80 leading-relaxed">{complaint.description}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-moss-100 p-5">
            <h3 className="font-serif text-base font-semibold text-moss-900 mb-4">协作时间线</h3>
            <div>
              {complaint.timeline.map((entry) => (
                <TimelineEntry key={entry.id} {...entry} />
              ))}
            </div>
          </div>

          <AddNote complaint={complaint} />
        </div>

        <div className="space-y-6">
          <CompensationPanel complaint={complaint} />

          {complaint.status === "closed" || complaint.status === "reviewed" ? (
            <>
              <CloseInfoCard complaint={complaint} />
              <ReviewForm complaint={complaint} />
            </>
          ) : (
            <div className="bg-moss-50/50 rounded-xl border border-moss-100 p-5 text-center">
              <p className="text-sm text-moss-500">请先确认补偿并关闭售后工单</p>
              <p className="text-xs text-moss-400 mt-1">关闭后可填写复盘结论</p>
            </div>
          )}
        </div>
      </div>

      {closeBlockReason && (
        <div className="fixed inset-0 bg-moss-900/30 flex items-center justify-center z-50" onClick={() => setCloseBlockReason(null)}>
          <div className="bg-white rounded-2xl p-6 w-[420px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-blush-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-serif text-lg font-semibold text-moss-900 mb-1">无法关闭售后</h3>
                {closeBlockReason === "no_compensation" && (
                  <p className="text-sm text-moss-600 leading-relaxed">
                    当前工单尚未设置补偿方案。请先在右侧面板中选择补偿方式并保存，确保客户获得合理的补偿后再关闭工单。
                  </p>
                )}
                {closeBlockReason === "compensation_unconfirmed" && (
                  <p className="text-sm text-moss-600 leading-relaxed">
                    补偿方案已保存但尚未确认。请先在右侧面板中点击「确认补偿」，确认 {COMPENSATION_LABELS[complaint.compensation!.type]}方案后再关闭工单。
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setCloseBlockReason(null)}
              className="w-full px-4 py-2.5 rounded-lg bg-moss-700 text-white text-sm font-medium hover:bg-moss-800 transition-colors"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {showCloseConfirm && (
        <div className="fixed inset-0 bg-moss-900/30 flex items-center justify-center z-50" onClick={() => setShowCloseConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-semibold text-moss-900 mb-2">确认关闭售后</h3>
            <p className="text-sm text-moss-600 mb-4">关闭后客户将收到通知，关闭原因将记录在协作时间线中。</p>
            <textarea
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-moss-200 text-sm mb-4 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 resize-none"
              placeholder="填写关闭原因…"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-moss-200 text-sm text-moss-600 hover:bg-moss-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClose}
                disabled={!closeReason.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg bg-moss-700 text-white text-sm font-medium hover:bg-moss-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                确认关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CloseInfoCard({ complaint }: { complaint: import("@/types").Complaint }) {
  return (
    <div className="bg-white rounded-xl border border-moss-100 p-5">
      <h3 className="font-serif text-base font-semibold text-moss-900 mb-3">关闭信息</h3>
      <div className="space-y-2.5">
        {complaint.closeReason && (
          <div>
            <p className="text-xs text-moss-400 mb-0.5">关闭原因</p>
            <p className="text-sm text-moss-700 leading-relaxed">{complaint.closeReason}</p>
          </div>
        )}
        {complaint.closedBy && (
          <div className="flex items-center justify-between text-xs text-moss-500">
            <span>关闭人: {complaint.closedBy}</span>
            <span>{complaint.closedAt}</span>
          </div>
        )}
        {complaint.compensation && (
          <>
            <div className="floral-divider my-3" />
            <div>
              <p className="text-xs text-moss-400 mb-0.5">补偿方案</p>
              <p className="text-sm text-moss-700">
                {COMPENSATION_LABELS[complaint.compensation.type]}
                {complaint.compensation.amount > 0 && ` ¥${complaint.compensation.amount}`}
                {complaint.compensation.confirmedAt && (
                  <span className="text-moss-400 ml-2">· 已确认</span>
                )}
              </p>
            </div>
            {complaint.compensation.reason && (
              <p className="text-xs text-moss-500 leading-relaxed">{complaint.compensation.reason}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-moss-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-moss-400">{label}</p>
        <p className={cn("text-sm text-moss-800", highlight && "text-honey-500 font-medium")}>{value}</p>
      </div>
    </div>
  )
}
