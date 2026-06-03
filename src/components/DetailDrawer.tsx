import { useSampleStore } from '@/store/sampleStore'
import { useShallow } from 'zustand/shallow'
import { useMemo, useState } from 'react'
import type { TraceStage, TraceStatus, RecordStatus, SampleNote, BatchTrace } from '@/types'
import {
  X,
  ShoppingCart,
  Factory,
  FlaskConical,
  Truck,
  Store,
  AlertTriangle,
  CheckCircle2,
  Zap,
  AlertOctagon,
  HelpCircle,
  Send,
  XCircle,
} from 'lucide-react'

type ExceptionType = 'rush' | 'allergen' | 'receiving' | 'other'

const exceptionTypeOptions: { value: ExceptionType; label: string; color: string }[] = [
  { value: 'rush', label: '临时加单', color: 'text-amber-400' },
  { value: 'allergen', label: '过敏原漏标', color: 'text-red-400' },
  { value: 'receiving', label: '收货不清', color: 'text-orange-400' },
  { value: 'other', label: '其他异常', color: 'text-slate-400' },
]

function filterNotes(notes: SampleNote[], recordId: string) {
  return notes.filter((n) => n.recordId === recordId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

function filterTraces(traces: BatchTrace[], recordId: string) {
  return traces.filter((t) => t.recordId === recordId).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

const stageConfig: Record<TraceStage, { label: string; icon: typeof ShoppingCart; color: string }> = {
  procurement: { label: '原料采购', icon: ShoppingCart, color: 'text-teal-400' },
  production: { label: '生产加工', icon: Factory, color: 'text-indigo-400' },
  sampling: { label: '留样', icon: FlaskConical, color: 'text-sky-400' },
  dispatch: { label: '出餐配送', icon: Truck, color: 'text-violet-400' },
  store_receiving: { label: '门店收货', icon: Store, color: 'text-rose-400' },
}

const traceStatusConfig: Record<TraceStatus, { dot: string; ring: string }> = {
  normal: { dot: 'bg-emerald-400', ring: 'ring-emerald-400/30' },
  warning: { dot: 'bg-amber-400', ring: 'ring-amber-400/30' },
  error: { dot: 'bg-red-400', ring: 'ring-red-400/30' },
}

const statusConfig: Record<RecordStatus, { label: string; bg: string; text: string }> = {
  pending: { label: '待处理', bg: 'bg-slate-500/20', text: 'text-slate-300' },
  sampling: { label: '留样中', bg: 'bg-sky-500/20', text: 'text-sky-300' },
  completed: { label: '已完成', bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  abnormal: { label: '异常', bg: 'bg-amber-500/20', text: 'text-amber-300' },
}

const CURRENT_OPERATOR = '张伟'
const CURRENT_ROLE = '品控员'

export default function DetailDrawer() {
  const { detailRecordId, records, notes, traces, closeDetail, confirmSampling, completeSampling, markAsAbnormal, reprocessRecord, addNote } = useSampleStore(
    useShallow((s) => ({
      detailRecordId: s.detailRecordId,
      records: s.records,
      notes: s.notes,
      traces: s.traces,
      closeDetail: s.closeDetail,
      confirmSampling: s.confirmSampling,
      completeSampling: s.completeSampling,
      markAsAbnormal: s.markAsAbnormal,
      reprocessRecord: s.reprocessRecord,
      addNote: s.addNote,
    }))
  )

  const [activeTab, setActiveTab] = useState<'trace' | 'notes'>('trace')
  const [noteInput, setNoteInput] = useState('')
  const [showAbnormalDialog, setShowAbnormalDialog] = useState(false)
  const [abnormalReason, setAbnormalReason] = useState('')
  const [abnormalType, setAbnormalType] = useState<ExceptionType>('other')

  const record = records.find((r) => r.id === detailRecordId)

  const filteredTraces = useMemo(
    () => (record ? filterTraces(traces, record.id) : []),
    [traces, record]
  )
  const filteredNotes = useMemo(
    () => (record ? filterNotes(notes, record.id) : []),
    [notes, record]
  )

  if (!record) return null

  const sc = statusConfig[record.status]
  const hasException = record.isRushOrder || record.allergenMissing || record.receivingUnclear

  const handleConfirmSampling = () => {
    confirmSampling(record.id, CURRENT_OPERATOR)
  }

  const handleCompleteSampling = () => {
    completeSampling(record.id, CURRENT_OPERATOR)
  }

  const handleOpenAbnormalDialog = () => {
    const suggestedType: ExceptionType = record.allergenMissing
      ? 'allergen'
      : record.receivingUnclear
        ? 'receiving'
        : record.isRushOrder
          ? 'rush'
          : 'other'
    setAbnormalType(suggestedType)
    setAbnormalReason('')
    setShowAbnormalDialog(true)
  }

  const handleConfirmAbnormal = () => {
    if (!abnormalReason.trim()) return
    markAsAbnormal(record.id, abnormalReason.trim(), abnormalType, CURRENT_OPERATOR, CURRENT_ROLE)
    setShowAbnormalDialog(false)
    setAbnormalReason('')
  }

  const handleReprocess = () => {
    reprocessRecord(record.id, CURRENT_OPERATOR, CURRENT_ROLE)
  }

  const handleAddNote = () => {
    if (!noteInput.trim()) return
    addNote(record.id, CURRENT_OPERATOR, CURRENT_ROLE, noteInput.trim(), 'manual')
    setNoteInput('')
  }

  return (
    <>
      {detailRecordId && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={closeDetail}
        />
      )}

      {showAbnormalDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAbnormalDialog(false)}
          />
          <div className="relative z-10 w-[420px] rounded-xl border border-slate-600 bg-slate-800 p-6 shadow-2xl animate-fade-in-up">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">标注异常</h3>
              <button
                onClick={() => setShowAbnormalDialog(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                异常类型
              </label>
              <div className="grid grid-cols-2 gap-2">
                {exceptionTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAbnormalType(opt.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                      abnormalType === opt.value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                异常原因 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={abnormalReason}
                onChange={(e) => setAbnormalReason(e.target.value)}
                placeholder="请详细描述异常原因..."
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                异常原因将同步写入批次追溯链和历史备注
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAbnormalDialog(false)}
                className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAbnormal}
                disabled={!abnormalReason.trim()}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                确认标注
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-[560px] flex-col border-l border-slate-700/50 bg-slate-900 shadow-2xl transition-transform duration-300 ${
          detailRecordId ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="font-mono text-lg font-bold text-slate-100">{record.id}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
              {sc.label}
            </span>
          </div>
          <button
            onClick={closeDetail}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-700/50 px-6 py-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">产品名称</span>
              <p className="mt-0.5 font-medium text-slate-200">{record.productName}</p>
            </div>
            <div>
              <span className="text-slate-500">批次号</span>
              <p className="mt-0.5 font-mono text-xs text-slate-300">{record.batchNo}</p>
            </div>
            <div>
              <span className="text-slate-500">门店</span>
              <p className="mt-0.5 text-slate-300">{record.store}</p>
            </div>
            <div>
              <span className="text-slate-500">留样克数</span>
              <p className="mt-0.5 font-mono text-slate-300">{record.sampleWeight}g</p>
            </div>
            <div>
              <span className="text-slate-500">留样时间</span>
              <p className="mt-0.5 text-xs text-slate-300">{record.sampleTime}</p>
            </div>
            <div>
              <span className="text-slate-500">过敏原</span>
              <p className="mt-0.5 text-xs text-slate-300">
                {record.allergenInfo || (
                  <span className="text-red-400">⚠ 未填写</span>
                )}
              </p>
            </div>
          </div>

          {hasException && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {record.isRushOrder && (
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-400">
                  <Zap className="h-3 w-3" /> 临时加单
                </span>
              )}
              {record.allergenMissing && (
                <span className="inline-flex items-center gap-1 rounded bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-400">
                  <AlertOctagon className="h-3 w-3" /> 过敏原漏标
                </span>
              )}
              {record.receivingUnclear && (
                <span className="inline-flex items-center gap-1 rounded bg-orange-500/20 px-2 py-1 text-xs font-semibold text-orange-400">
                  <HelpCircle className="h-3 w-3" /> 收货不清
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab('trace')}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              activeTab === 'trace'
                ? 'border-b-2 border-sky-500 text-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            批次追溯链
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              activeTab === 'notes'
                ? 'border-b-2 border-sky-500 text-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            历史备注
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'trace' && (
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-700/50" />
              {filteredTraces.map((t, i) => {
                const cfg = stageConfig[t.stage]
                const Icon = cfg.icon
                const tc = traceStatusConfig[t.status]
                return (
                  <div key={t.id} className="relative mb-6 last:mb-0 pl-10" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className={`absolute left-[7px] top-1.5 h-[18px] w-[18px] rounded-full ring-2 ${tc.ring} flex items-center justify-center`}>
                      <div className={`h-2 w-2 rounded-full ${tc.dot} ${t.status === 'error' ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                      <span className="text-sm font-medium text-slate-200">{cfg.label}</span>
                      {t.timestamp && (
                        <span className="ml-auto text-[10px] text-slate-500">{t.timestamp}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{t.detail}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{t.operator}</p>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-3">
              {filteredNotes.map((n) => (
                <div key={n.id} className="flex gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                    n.type === 'exception' ? 'bg-amber-600' : n.type === 'system' ? 'bg-slate-600' : 'bg-sky-600'
                  }`}>
                    {n.author.slice(0, 1)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">{n.author}</span>
                      <span className="text-[10px] text-slate-500">{n.role}</span>
                      {n.type === 'exception' && (
                        <AlertTriangle className="h-3 w-3 text-amber-400" />
                      )}
                    </div>
                    <p className={`mt-1 text-sm ${
                      n.type === 'exception' ? 'text-amber-300' : n.type === 'system' ? 'text-slate-400' : 'text-slate-300'
                    }`}>
                      {n.content}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">{n.createdAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-700/50 p-4">
          {record.status !== 'completed' && (
            <div className="mb-3 flex gap-2">
              {record.status === 'pending' && (
                <button
                  onClick={handleConfirmSampling}
                  className="flex-1 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500"
                >
                  确认留样
                </button>
              )}
              {record.status === 'sampling' && (
                <button
                  onClick={handleCompleteSampling}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
                >
                  完成留样
                </button>
              )}
              {record.status !== 'abnormal' && (
                <button
                  onClick={handleOpenAbnormalDialog}
                  className="rounded-lg bg-amber-600/20 px-3 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-600/30"
                >
                  标注异常
                </button>
              )}
              {record.status === 'abnormal' && (
                <button
                  onClick={handleReprocess}
                  className="flex-1 rounded-lg bg-slate-600/20 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-600/30"
                >
                  重新处理
                </button>
              )}
            </div>
          )}
          {record.status === 'completed' && (
            <div className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-emerald-600/10 py-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              留样已完成
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="追加备注..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              className="h-9 flex-1 rounded-lg border border-slate-600 bg-slate-800/50 px-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
            />
            <button
              onClick={handleAddNote}
              disabled={!noteInput.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white transition-colors hover:bg-sky-500 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
