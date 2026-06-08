import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Plus, Send, Phone, MessageSquare, X, Clock, ChevronRight, CalendarPlus, User } from "lucide-react"
import { useCargoStore } from "@/store/useCargoStore"
import type { Cargo, CargoStatus } from "@/types"

const statusColors: Record<CargoStatus, string> = {
  "待通知": "bg-yellow-500/20 text-yellow-400",
  "已通知": "bg-blue-500/20 text-blue-400",
  "已预约": "bg-purple-500/20 text-purple-400",
  "提货中": "bg-cyan-500/20 text-cyan-400",
  "超期未提": "bg-red-500/20 text-red-400",
  "已完成": "bg-green-500/20 text-green-400",
}

const emptyForm = { trainNo: "", ticketNo: "", goodsName: "", weight: "", consignee: "", consigneePhone: "", arrivalTime: "" }

export default function Arrival() {
  const { cargos, addCargo, sendNotify, makeAppointment, getNotifiesForCargo, getNotifyCount } = useCargoStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [form, setForm] = useState(emptyForm)
  const [toast, setToast] = useState("")
  const [selected, setSelected] = useState<Cargo | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showApptForm, setShowApptForm] = useState(false)
  const [apptForm, setApptForm] = useState({ pickerName: "", pickerIdCard: "", relation: "本人", appointmentTime: "" })

  const recent = [...cargos].sort((a, b) => b.arrivalTime.localeCompare(a.arrivalTime))

  useEffect(() => {
    const cargoId = searchParams.get("openDrawer")
    if (cargoId) {
      const cargo = cargos.find((c) => c.id === cargoId)
      if (cargo) {
        setSelected(cargo)
        setDrawerOpen(true)
        setShowApptForm(true)
      }
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, cargos, setSearchParams])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cargo: Cargo = {
      id: Date.now().toString(),
      trainNo: form.trainNo,
      ticketNo: form.ticketNo,
      goodsName: form.goodsName,
      weight: Number(form.weight),
      consignee: form.consignee,
      consigneePhone: form.consigneePhone,
      arrivalTime: form.arrivalTime.replace("T", " "),
      status: "待通知",
    }
    addCargo(cargo)
    setForm(emptyForm)
    setToast(`货票 ${cargo.ticketNo} 登记成功`)
    setTimeout(() => setToast(""), 2500)
  }

  const openDrawer = (cargo: Cargo) => {
    setSelected(cargo)
    setDrawerOpen(true)
    setShowApptForm(false)
    setApptForm({ pickerName: "", pickerIdCard: "", relation: "本人", appointmentTime: "" })
  }

  const handleNotify = (method: "短信" | "电话") => {
    if (!selected) return
    sendNotify(selected.id, method, "客服-赵敏")
    setSelected({ ...selected, status: "已通知" })
  }

  const handleApptSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    makeAppointment({
      id: `a${Date.now()}`,
      cargoId: selected.id,
      pickerName: apptForm.pickerName,
      pickerIdCard: apptForm.pickerIdCard,
      relation: apptForm.relation,
      appointmentTime: apptForm.appointmentTime.replace("T", " "),
    })
    setSelected({ ...selected, status: "已预约" })
    setToast(`预约 ${selected.ticketNo} 提货成功`)
    setTimeout(() => setToast(""), 2500)
    setShowApptForm(false)
    setApptForm({ pickerName: "", pickerIdCard: "", relation: "本人", appointmentTime: "" })
  }

  const selectedNotifies = selected ? getNotifiesForCargo(selected.id) : []

  return (
    <div className="flex gap-6 h-full relative">
      <div className="w-[60%] flex flex-col gap-6">
        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-500" />到站登记
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">车次</label>
              <input required value={form.trainNo} onChange={set("trainNo")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">货票号</label>
              <input required value={form.ticketNo} onChange={set("ticketNo")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">品名</label>
              <input required value={form.goodsName} onChange={set("goodsName")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">重量/吨</label>
              <input required type="number" step="0.1" min="0" value={form.weight} onChange={set("weight")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">收货人</label>
              <input required value={form.consignee} onChange={set("consignee")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">收货人电话</label>
              <input required value={form.consigneePhone} onChange={set("consigneePhone")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-slate-400 mb-1 block">到站时间</label>
              <input required type="datetime-local" value={form.arrivalTime} onChange={set("arrivalTime")} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 [color-scheme:dark]" />
            </div>
            <div className="col-span-2">
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />登记到站
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="w-[40%] flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />近期登记
        </h2>
        <div className="flex-1 overflow-auto space-y-2 pr-1">
          {recent.map((c) => (
            <div key={c.id} onClick={() => openDrawer(c)} className="bg-slate-900 rounded-lg p-4 cursor-pointer hover:bg-slate-800/80 transition-colors flex items-center justify-between group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-white">{c.ticketNo}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>{c.status}</span>
                  {getNotifyCount(c.id) > 0 && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{getNotifyCount(c.id)}次通知</span>
                  )}
                </div>
                <div className="text-sm text-slate-400 truncate">{c.goodsName} · {c.consignee}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-500 transition-colors shrink-0 ml-2" />
            </div>
          ))}
        </div>
      </div>

      <div className={`fixed inset-0 z-40 transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
      </div>

      <div className={`fixed top-0 right-0 h-full w-[420px] bg-slate-900 border-l border-slate-800 z-50 transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        {selected && (
          <div className="h-full flex flex-col p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-mono text-lg text-white">{selected.ticketNo}</h3>
                <p className="text-sm text-slate-400">{selected.goodsName} · {selected.consignee}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">发送通知</h4>
              <div className="flex gap-3">
                <button onClick={() => handleNotify("短信")} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500 border border-slate-700 text-white py-2.5 rounded-lg transition-colors">
                  <MessageSquare className="w-4 h-4" />短信
                </button>
                <button onClick={() => handleNotify("电话")} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500 border border-slate-700 text-white py-2.5 rounded-lg transition-colors">
                  <Phone className="w-4 h-4" />电话
                </button>
              </div>
            </div>

            {(selected.status === "已通知" || selected.status === "超期未提") && (
              <div className="mb-6 border border-slate-700 rounded-lg overflow-hidden">
                <button onClick={() => setShowApptForm(!showApptForm)} className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-750 transition-colors">
                  <span className="text-sm font-semibold text-cyan-400 flex items-center gap-2"><CalendarPlus className="w-4 h-4" />创建预约提货</span>
                  <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${showApptForm ? "rotate-90" : ""}`} />
                </button>
                {showApptForm && (
                  <form onSubmit={handleApptSubmit} className="p-4 space-y-3 bg-slate-800/50">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">预约人姓名</label>
                      <input required value={apptForm.pickerName} onChange={(e) => setApptForm({ ...apptForm, pickerName: e.target.value })} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" placeholder="请输入预约人姓名" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">身份证号</label>
                      <input required value={apptForm.pickerIdCard} onChange={(e) => setApptForm({ ...apptForm, pickerIdCard: e.target.value })} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500" placeholder="请输入身份证号" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">与收货人关系</label>
                      <div className="flex gap-2">
                        {["本人", "受委托人"].map((r) => (
                          <button key={r} type="button" onClick={() => setApptForm({ ...apptForm, relation: r })} className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${apptForm.relation === r ? "border-cyan-500 bg-cyan-500/15 text-cyan-400" : "border-slate-600 bg-slate-900 text-slate-400 hover:border-slate-500"}`}>
                            <User className="w-3.5 h-3.5 inline mr-1" />{r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">预约时间</label>
                      <input required type="datetime-local" value={apptForm.appointmentTime} onChange={(e) => setApptForm({ ...apptForm, appointmentTime: e.target.value })} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 [color-scheme:dark]" />
                    </div>
                    <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <CalendarPlus className="w-4 h-4" />确认预约
                    </button>
                  </form>
                )}
              </div>
            )}

            <div className="flex-1 overflow-auto">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">通知记录</h4>
              {selectedNotifies.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">暂无通知记录</p>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-700 space-y-4">
                  {selectedNotifies.map((n) => (
                    <div key={n.id} className="relative">
                      <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900" />
                      <div className="bg-slate-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            {n.method === "短信" ? <MessageSquare className="w-3 h-3" /> : <Phone className="w-3 h-3" />}{n.method}
                          </span>
                          <span className="text-xs text-slate-500">{n.time}</span>
                        </div>
                        <div className="text-sm text-white">{n.result}</div>
                        <div className="text-xs text-slate-500 mt-1">{n.operator}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-5 py-2.5 rounded-lg font-semibold shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
}
