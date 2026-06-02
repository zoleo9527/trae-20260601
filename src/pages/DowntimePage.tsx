import { InstrumentBadge } from '@/components/StatusBadge';
import { useStore } from '@/store/useStore';
import type { Downtime } from '@/types';
import { fmtFull } from '@/utils/time';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import React, { useState } from 'react';

export default function DowntimePage() {
  const { downtimes, instruments, reservations, addDowntime, resolveDowntime, currentRole } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(false)

  const activeDowntimes = downtimes.filter((d) => d.status === 'active')
  const resolvedDowntimes = downtimes.filter((d) => d.status === 'resolved')

  const isAdmin = currentRole === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">故障停机管理</h2>
          <p className="text-xs text-zinc-500 mt-1">登记仪器故障停机，受影响预约将自动标记为顺延</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors"
          >
            <Plus size={14} />
            登记停机
          </button>
        )}
      </div>

      {activeDowntimes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-red-400 flex items-center gap-1.5">
            <AlertTriangle size={14} />
            当前停机中 ({activeDowntimes.length})
          </h3>
          {activeDowntimes.map((dt) => (
            <DowntimeCard
              key={dt.id}
              downtime={dt}
              instruments={instruments}
              reservations={reservations}
              onResolve={isAdmin ? resolveDowntime : undefined}
            />
          ))}
        </div>
      )}

      {activeDowntimes.length === 0 && (
        <div className="text-center py-12 text-zinc-500 text-sm">
          当前无停机仪器
        </div>
      )}

      {resolvedDowntimes.length > 0 && (
        <div>
          <button
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {historyExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            历史停机记录 ({resolvedDowntimes.length})
          </button>
          {historyExpanded && (
            <div className="space-y-3 mt-3">
              {resolvedDowntimes.map((dt) => (
                <DowntimeCard
                  key={dt.id}
                  downtime={dt}
                  instruments={instruments}
                  reservations={reservations}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <DowntimeForm
          instruments={instruments}
          onSubmit={(data) => {
            addDowntime(data)
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function DowntimeCard({
  downtime,
  instruments,
  reservations,
  onResolve,
}: {
  downtime: Downtime
  instruments: { id: string; name: string; code: string; status: 'normal' | 'fault' | 'maintenance'; nightMode: boolean; nightStart: string; nightEnd: string; location: string }[]
  reservations: { id: string; userName: string; startTime: string; endTime: string }[]
  onResolve?: (id: string) => void
}) {
  const instrument = instruments.find((i) => i.id === downtime.instrumentId)
  const affected = reservations.filter((r) => downtime.affectedReservations.includes(r.id))
  const isActive = downtime.status === 'active'

  return (
    <div
      className={`rounded-lg border p-4 ${
        isActive
          ? 'border-red-900/40 bg-red-950/20'
          : 'border-zinc-800 bg-zinc-900/30'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {isActive ? (
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
          ) : (
            <CheckCircle size={16} className="text-zinc-500 shrink-0" />
          )}
          <span className={`text-sm font-medium ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`}>
            {instrument?.name || downtime.instrumentId}
          </span>
          {instrument && (
            <InstrumentBadge status={instrument.status} />
          )}
        </div>
        {isActive && onResolve && (
          <button
            onClick={() => onResolve(downtime.id)}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium rounded transition-colors"
          >
            <CheckCircle size={12} />
            恢复运行
          </button>
        )}
      </div>

      <div className={`mt-2 text-xs space-y-1 ${isActive ? 'text-zinc-400' : 'text-zinc-600'}`}>
        <div>
          {fmtFull(downtime.startTime)} ~ {fmtFull(downtime.endTime)}
        </div>
        <div>原因：{downtime.reason}</div>
        {affected.length > 0 && (
          <div className="text-red-400/80">
            受影响预约：{affected.length} 条
          </div>
        )}
      </div>

      {affected.length > 0 && (
        <div className={`mt-3 pt-3 border-t ${isActive ? 'border-red-900/30' : 'border-zinc-800/50'}`}>
          <div className={`text-[11px] mb-1.5 ${isActive ? 'text-zinc-500' : 'text-zinc-600'}`}>受影响预约</div>
          <div className="space-y-1">
            {affected.map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between text-[11px] ${
                  isActive ? 'text-zinc-400' : 'text-zinc-600'
                }`}
              >
                <span>{r.userName}</span>
                <span>{fmtFull(r.startTime)} ~ {fmtFull(r.endTime)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DowntimeForm({
  instruments,
  onSubmit,
  onClose,
}: {
  instruments: { id: string; name: string; code: string; status: 'normal' | 'fault' | 'maintenance'; nightMode: boolean; nightStart: string; nightEnd: string; location: string }[]
  onSubmit: (data: { instrumentId: string; startTime: string; endTime: string; reason: string }) => void
  onClose: () => void
}) {
  const [instrumentId, setInstrumentId] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!instrumentId || !startTime || !endTime || !reason) return
    onSubmit({ instrumentId, startTime, endTime, reason })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-[#16162e] border border-[#1e1e3a] rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e1e3a]">
          <h3 className="text-sm font-semibold text-zinc-100">登记停机</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">仪器</label>
            <select
              value={instrumentId}
              onChange={(e) => setInstrumentId(e.target.value)}
              className="w-full bg-[#0f0f24] border border-[#1e1e3a] rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">选择仪器</option>
              {instruments.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">开始时间</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#0f0f24] border border-[#1e1e3a] rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">结束时间</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[#0f0f24] border border-[#1e1e3a] rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">停机原因</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full bg-[#0f0f24] border border-[#1e1e3a] rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!instrumentId || !startTime || !endTime || !reason}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-xs font-medium rounded transition-colors"
            >
              确认登记
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
