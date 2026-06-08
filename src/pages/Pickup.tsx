import { useState, useMemo } from "react"
import { ShieldCheck, AlertTriangle, CheckCircle2, X, Clock, User, FileCheck, Unlock, Timer, Search, ClipboardCheck, Package, ClockAlert } from "lucide-react"
import { useCargoStore } from "@/store/useCargoStore"
import type { Cargo, CargoStatus, VerifyItemName } from "@/types"

const PICKUP_STATUSES: CargoStatus[] = ["已预约", "提货中", "超期未提", "已完成"]

const STATUS_COLORS: Record<string, string> = {
  已预约: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
  提货中: "bg-violet-500/20 text-violet-400 border border-violet-500/30",
  超期未提: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  已完成: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
}

const TAB_COLORS: Record<string, string> = {
  全部: "text-slate-300",
  已预约: "text-cyan-400",
  提货中: "text-violet-400",
  超期未提: "text-amber-400",
  已完成: "text-emerald-400",
}

const STAT_CARDS = [
  { key: "已预约" as CargoStatus, label: "待复核", icon: ClipboardCheck, color: "text-cyan-400", bg: "bg-cyan-900/30 ring-1 ring-cyan-500/30", iconBg: "bg-cyan-500/15" },
  { key: "提货中" as CargoStatus, label: "提货中", icon: Package, color: "text-violet-400", bg: "bg-violet-900/30 ring-1 ring-violet-500/30", iconBg: "bg-violet-500/15" },
  { key: "超期未提" as CargoStatus, label: "超期未提", icon: ClockAlert, color: "text-amber-400", bg: "bg-amber-900/30 ring-1 ring-amber-500/30", iconBg: "bg-amber-500/15" },
  { key: "今日签收" as const, label: "今日签收", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-900/30 ring-1 ring-emerald-500/30", iconBg: "bg-emerald-500/15" },
]

const VERIFY_ITEMS: VerifyItemName[] = ["身份证", "提货单", "委托书", "单位证明"]
const PORTS = ["1号口", "2号口", "3号口", "4号口"]

function StatusBadge({ status }: { status: string }) {
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status] ?? ""}`}>{status}</span>
}

function ExceptionModal({ cargoId, onClose }: { cargoId: string; onClose: () => void }) {
  const exceptionRelease = useCargoStore((s) => s.exceptionRelease)
  const [reason, setReason] = useState("")
  const [approver, setApprover] = useState("")
  const [condition, setCondition] = useState("")

  const submit = () => {
    if (!reason.trim() || !approver.trim()) return
    exceptionRelease({ id: `e${Date.now()}`, cargoId, reason, approver, condition, releaseTime: new Date().toLocaleString("zh-CN").replace(/\//g, "-") })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md border border-red-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4 text-red-500 font-bold text-lg">
          <AlertTriangle className="w-5 h-5" /> 异常放行
        </div>
        <label className="block text-sm text-slate-400 mb-1">异常原因</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full bg-slate-800 rounded-lg p-2 text-sm text-slate-200 border border-slate-700 mb-3 focus:outline-none focus:border-red-500" />
        <label className="block text-sm text-slate-400 mb-1">审批人</label>
        <input value={approver} onChange={(e) => setApprover(e.target.value)} className="w-full bg-slate-800 rounded-lg p-2 text-sm text-slate-200 border border-slate-700 mb-3 focus:outline-none focus:border-red-500" />
        <label className="block text-sm text-slate-400 mb-1">放行条件</label>
        <textarea value={condition} onChange={(e) => setCondition(e.target.value)} rows={2} className="w-full bg-slate-800 rounded-lg p-2 text-sm text-slate-200 border border-slate-700 mb-4 focus:outline-none focus:border-red-500" />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600">取消</button>
          <button onClick={submit} disabled={!reason.trim() || !approver.trim()} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-500 disabled:opacity-40">确认异常放行</button>
        </div>
      </div>
    </div>
  )
}

function SignoffModal({ cargoId, onClose }: { cargoId: string; onClose: () => void }) {
  const signOff = useCargoStore((s) => s.signOff)
  const [signer, setSigner] = useState("")
  const [port, setPort] = useState(PORTS[0])

  const submit = () => {
    if (!signer.trim()) return
    signOff(cargoId, signer, port)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold text-lg">
          <CheckCircle2 className="w-5 h-5" /> 签收确认
        </div>
        <label className="block text-sm text-slate-400 mb-1">签收人</label>
        <input value={signer} onChange={(e) => setSigner(e.target.value)} className="w-full bg-slate-800 rounded-lg p-2 text-sm text-slate-200 border border-slate-700 mb-3 focus:outline-none focus:border-emerald-500" />
        <label className="block text-sm text-slate-400 mb-1">提货口</label>
        <select value={port} onChange={(e) => setPort(e.target.value)} className="w-full bg-slate-800 rounded-lg p-2 text-sm text-slate-200 border border-slate-700 mb-4 focus:outline-none focus:border-emerald-500">
          {PORTS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600">取消</button>
          <button onClick={submit} disabled={!signer.trim()} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 disabled:opacity-40">确认签收</button>
        </div>
      </div>
    </div>
  )
}

function VerifyPanel({ cargo, onClose }: { cargo: Cargo; onClose: () => void }) {
  const appointment = useCargoStore((s) => s.getAppointmentForCargo(cargo.id))
  const notifyCount = useCargoStore((s) => s.getNotifyCount(cargo.id))
  const existingVerification = useCargoStore((s) => s.getVerificationForCargo(cargo.id))
  const verifyChecklist = useCargoStore((s) => s.verifyChecklist)
  const [items, setItems] = useState<Record<VerifyItemName, boolean>>(
    () => {
      if (existingVerification) {
        const map = {} as Record<VerifyItemName, boolean>
        existingVerification.items.forEach((i) => { map[i.name] = i.passed })
        return map
      }
      return { 身份证: false, 提货单: false, 委托书: false, 单位证明: false }
    }
  )
  const [exceptionOpen, setExceptionOpen] = useState(false)

  const canVerify = items["身份证"] && items["提货单"]

  const toggle = (name: VerifyItemName) => setItems((prev) => ({ ...prev, [name]: !prev[name] }))

  const handleVerify = () => {
    verifyChecklist({
      cargoId: cargo.id,
      items: VERIFY_ITEMS.map((name) => ({ name, passed: items[name] })),
      verifiedBy: "货运员-刘强",
      verifiedTime: new Date().toLocaleString("zh-CN").replace(/\//g, "-"),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[720px] bg-slate-900 border-l border-slate-700 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <span className="text-lg font-bold text-slate-100">提货复核</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="w-1/2 p-6 border-r border-slate-800 space-y-5 overflow-y-auto">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-1"><FileCheck className="w-4 h-4" /> 货票信息</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">货票号</span><span className="font-mono text-slate-200">{cargo.ticketNo}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">车次</span><span className="font-mono text-slate-200">{cargo.trainNo}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">品名</span><span className="text-slate-200">{cargo.goodsName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">重量</span><span className="text-slate-200">{cargo.weight} 吨</span></div>
                <div className="flex justify-between"><span className="text-slate-500">收货人</span><span className="text-slate-200">{cargo.consignee}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">电话</span><span className="text-slate-200">{cargo.consigneePhone}</span></div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-1"><Clock className="w-4 h-4" /> 通知记录</h3>
              <p className="text-sm text-slate-300">累计通知 <span className="text-amber-400 font-bold">{notifyCount}</span> 次</p>
            </div>
            {appointment && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-1"><User className="w-4 h-4" /> 预约信息</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">预约人</span><span className="text-slate-200">{appointment.pickerName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">身份证</span><span className="font-mono text-slate-200">{appointment.pickerIdCard}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">关系</span><span className="text-slate-200">{appointment.relation}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">预约时间</span><span className="text-slate-200">{appointment.appointmentTime}</span></div>
                </div>
              </div>
            )}
            {cargo.exceptionRemark && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> 异常备注</p>
                <p className="text-sm text-amber-300">{cargo.exceptionRemark}</p>
              </div>
            )}
          </div>
          <div className="w-1/2 p-6 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> 证件复核</h3>
            <div className="space-y-3 flex-1">
              {VERIFY_ITEMS.map((name) => (
                <div key={name} className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3">
                  <span className="text-sm text-slate-200">{name}</span>
                  <button onClick={() => toggle(name)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${items[name] ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {items[name] ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleVerify} disabled={!canVerify} className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-40 flex items-center justify-center gap-1.5"><ShieldCheck className="w-4 h-4" /> 复核通过</button>
              <button onClick={() => setExceptionOpen(true)} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 flex items-center justify-center gap-1.5"><Unlock className="w-4 h-4" /> 异常放行</button>
            </div>
          </div>
        </div>
        {exceptionOpen && <ExceptionModal cargoId={cargo.id} onClose={() => setExceptionOpen(false)} />}
      </div>
    </div>
  )
}

export default function Pickup() {
  const cargos = useCargoStore((s) => s.cargos)
  const getNotifyCount = useCargoStore((s) => s.getNotifyCount)
  const getAppointmentForCargo = useCargoStore((s) => s.getAppointmentForCargo)

  const [selected, setSelected] = useState<Cargo | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [signoffCargoId, setSignoffCargoId] = useState<string | null>(null)
  const [filter, setFilter] = useState<CargoStatus | "全部">("全部")
  const [search, setSearch] = useState("")

  const pickupCargos = useMemo(() => cargos.filter((c) => PICKUP_STATUSES.includes(c.status)), [cargos])

  const todayStr = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-")
  const todaySignedCount = useMemo(() => pickupCargos.filter((c) => c.status === "已完成" && c.signTime?.startsWith(todayStr)).length, [pickupCargos, todayStr])

  const statCounts = useMemo(() => ({
    "已预约": pickupCargos.filter((c) => c.status === "已预约").length,
    "提货中": pickupCargos.filter((c) => c.status === "提货中").length,
    "超期未提": pickupCargos.filter((c) => c.status === "超期未提").length,
    "今日签收": todaySignedCount,
  }), [pickupCargos, todaySignedCount])

  const activeCard = filter === "已完成" ? null : filter === "全部" ? null : filter

  const filtered = useMemo(() => {
    const byStatus = filter === "全部" ? pickupCargos : filter === "已完成" ? pickupCargos : pickupCargos.filter((c) => c.status === filter)
    const q = search.trim().toLowerCase()
    const bySearch = q ? byStatus.filter((c) => c.ticketNo.toLowerCase().includes(q) || c.goodsName.toLowerCase().includes(q) || c.consignee.toLowerCase().includes(q)) : byStatus
    return [...bySearch].sort((a, b) => {
      const apptA = getAppointmentForCargo(a.id)
      const apptB = getAppointmentForCargo(b.id)
      const timeA = apptA?.appointmentTime ?? a.arrivalTime
      const timeB = apptB?.appointmentTime ?? b.arrivalTime
      return timeA.localeCompare(timeB)
    })
  }, [pickupCargos, filter, search, getAppointmentForCargo])

  const statusBeforeSearch = useMemo(() => {
    const byStatus = filter === "全部" ? pickupCargos : filter === "已完成" ? pickupCargos : pickupCargos.filter((c) => c.status === filter)
    return byStatus.length
  }, [pickupCargos, filter])

  const openVerify = (cargo: Cargo) => { setSelected(cargo); setPanelOpen(true) }
  const openSignoff = (cargoId: string) => setSignoffCargoId(cargoId)

  const getApptTiming = (cargo: Cargo) => {
    if (cargo.status !== "已预约") return null
    const appt = getAppointmentForCargo(cargo.id)
    if (!appt) return null
    const apptDate = new Date(appt.appointmentTime.replace(/(\d{4})-(\d{2})-(\d{2})/, "$1/$2/$3"))
    const now = new Date()
    const diffMs = apptDate.getTime() - now.getTime()
    if (diffMs < 0) return "overdue" as const
    if (diffMs < 3600000) return "soon" as const
    return null
  }

  const tabs: (CargoStatus | "全部")[] = ["全部", ...PICKUP_STATUSES]

  const emptyText = filtered.length === 0 && (search.trim() || filter !== "全部")
    ? search.trim() && statusBeforeSearch > 0
      ? `未找到与"${search.trim()}"匹配的记录`
      : `当前${filter === "全部" ? "" : filter}状态下暂无任务`
    : "暂无提货数据"

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <h1 className="text-xl font-bold text-slate-100 mb-5 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-emerald-500" /> 提货验证</h1>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon
          const count = statCounts[card.key as keyof typeof statCounts] ?? 0
          const isActive = activeCard === card.key
          return (
            <button key={card.key} onClick={() => setFilter(card.key === "今日签收" ? "已完成" : card.key)} className={`rounded-xl p-4 text-left transition-all ${card.bg} ${isActive ? "ring-2 ring-amber-500 shadow-lg" : "hover:shadow-md"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{card.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}><Icon className={`w-4 h-4 ${card.color}`} /></div>
              </div>
              <div className={`text-2xl font-bold ${card.color}`}>{count}</div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-2">
          {tabs.map((t) => {
            const count = t === "全部" ? pickupCargos.length : pickupCargos.filter((c) => c.status === t).length
            return (
              <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${filter === t ? "bg-slate-800 ring-1 ring-amber-500" : "bg-slate-900 hover:bg-slate-800"} ${TAB_COLORS[t]}`}>
                {t !== "全部" && <span className="w-1.5 h-1.5 rounded-full bg-current" />}{t} <span className="text-xs opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
        <div className="ml-auto relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索货票号/品名/收货人" className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 w-64 focus:outline-none focus:border-amber-500 transition-colors" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><X className="w-3.5 h-3.5" /></button>}
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-800">
              <th className="px-4 py-3">货票号</th>
              <th className="px-4 py-3">品名</th>
              <th className="px-4 py-3">收货人</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">通知次数</th>
              <th className="px-4 py-3">预约人</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const appt = getAppointmentForCargo(c.id)
              const timing = getApptTiming(c)
              return (
                <tr key={c.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-200">{c.ticketNo}</td>
                  <td className="px-4 py-3 text-slate-300">{c.goodsName}</td>
                  <td className="px-4 py-3 text-slate-300">{c.consignee}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={c.status} />
                      {timing === "overdue" && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-0.5"><Timer className="w-3 h-3" />已到期</span>}
                      {timing === "soon" && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center gap-0.5"><Timer className="w-3 h-3" />即将到期</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{getNotifyCount(c.id)}</td>
                  <td className="px-4 py-3 text-slate-300">{appt?.pickerName ?? "—"}</td>
                  <td className="px-4 py-3">
                    {(c.status === "已预约" || c.status === "超期未提") && (
                      <button onClick={() => openVerify(c)} className="px-3 py-1 rounded bg-cyan-600/20 text-cyan-400 text-xs font-medium hover:bg-cyan-600/30">复核</button>
                    )}
                    {c.status === "提货中" && (
                      <button onClick={() => openSignoff(c.id)} className="px-3 py-1 rounded bg-violet-600/20 text-violet-400 text-xs font-medium hover:bg-violet-600/30">签收</button>
                    )}
                    {c.status === "已完成" && (
                      <button onClick={() => openVerify(c)} className="px-3 py-1 rounded bg-slate-700 text-slate-400 text-xs font-medium hover:bg-slate-600">查看</button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Search className="w-8 h-8 text-slate-700 mb-1" />
                  <p className="text-slate-500 text-sm">{emptyText}</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      {panelOpen && selected && <VerifyPanel cargo={selected} onClose={() => { setPanelOpen(false); setSelected(null) }} />}
      {signoffCargoId && <SignoffModal cargoId={signoffCargoId} onClose={() => setSignoffCargoId(null)} />}
    </div>
  )
}
