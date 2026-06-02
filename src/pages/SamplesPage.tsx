import { SampleBadge } from '@/components/StatusBadge';
import { useStore } from '@/store/useStore';
import type { Sample, SampleStatus } from '@/types';
import { fmtDateTime } from '@/utils/time';
import { ChevronDown, ChevronRight, Download, Plus, Search } from 'lucide-react';
import React, { useState } from 'react';

const TABS: { label: string; value: SampleStatus | null }[] = [
  { label: '全部', value: null },
  { label: '待测', value: 'waiting' },
  { label: '检测中', value: 'testing' },
  { label: '完成', value: 'done' },
  { label: '异常', value: 'abnormal' },
]

const STATUS_OPTIONS: { label: string; value: SampleStatus }[] = [
  { label: '待测', value: 'waiting' },
  { label: '检测中', value: 'testing' },
  { label: '完成', value: 'done' },
  { label: '异常', value: 'abnormal' },
]

export default function SamplesPage() {
  const { samples, instruments, reservations, addSample, updateSampleStatus, currentRole, currentUserId } = useStore()
  const [statusFilter, setStatusFilter] = useState<SampleStatus | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const currentUserName = reservations.find((r) => r.userId === currentUserId)?.userName ?? ''

  const filtered = samples.filter((s) => {
    if (currentRole === 'student' && s.submitter !== currentUserName) return false
    if (statusFilter && s.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!s.name.toLowerCase().includes(q) && !s.submitter.toLowerCase().includes(q)) return false
    }
    return true
  })

  const getInstrumentName = (instrumentId: string) =>
    instruments.find((i) => i.id === instrumentId)?.name ?? instrumentId

  const handleExport = () => {
    const headers = ['样本名称', '关联仪器', '提交人', '课题组', '状态', '存放位置', '备注', '创建时间']
    const rows = filtered.map((s) =>
      [
        s.name,
        getInstrumentName(s.instrumentId),
        s.submitter,
        s.group,
        s.status,
        s.storageLocation,
        `"${s.notes.replace(/"/g, '""')}"`,
        fmtDateTime(s.createdAt),
      ].join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'samples.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1 bg-[#12122a] rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索样本名称或提交人"
            className="w-full bg-[#12122a] border border-[#1e1e3a] rounded pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12122a] border border-[#1e1e3a] rounded text-xs text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            <Download size={14} />
            导出CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium transition-colors"
          >
            <Plus size={14} />
            登记样本
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-[#1e1e3a]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#12122a] text-zinc-400">
              <th className="w-8 px-2 py-2.5" />
              <th className="text-left px-3 py-2.5 font-medium">样本名称</th>
              <th className="text-left px-3 py-2.5 font-medium">关联仪器</th>
              <th className="text-left px-3 py-2.5 font-medium">提交人</th>
              <th className="text-left px-3 py-2.5 font-medium">课题组</th>
              <th className="text-left px-3 py-2.5 font-medium">状态</th>
              <th className="text-left px-3 py-2.5 font-medium">存放位置</th>
              <th className="text-left px-3 py-2.5 font-medium">备注</th>
              <th className="text-left px-3 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sample, idx) => {
              const isExpanded = expandedId === sample.id
              return (
                <React.Fragment key={sample.id}>
                  <tr
                    className={`cursor-pointer transition-colors ${
                      idx % 2 === 0 ? 'bg-[#0e0e20]' : 'bg-[#111128]'
                    } hover:bg-[#1a1a3a]`}
                    onClick={() => setExpandedId(isExpanded ? null : sample.id)}
                  >
                    <td className="px-2 py-2.5 text-zinc-500">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-200 font-medium">{sample.name}</td>
                    <td className="px-3 py-2.5 text-zinc-300">{getInstrumentName(sample.instrumentId)}</td>
                    <td className="px-3 py-2.5 text-zinc-300">{sample.submitter}</td>
                    <td className="px-3 py-2.5 text-zinc-400">{sample.group}</td>
                    <td className="px-3 py-2.5">
                      <SampleBadge status={sample.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-zinc-300 text-[11px]">{sample.storageLocation}</span>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-400 max-w-[160px] truncate">{sample.notes}</td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      {currentRole !== 'student' && (
                        <select
                          value={sample.status}
                          onChange={(e) => updateSampleStatus(sample.id, e.target.value as SampleStatus)}
                          className="bg-[#12122a] border border-[#1e1e3a] rounded px-1.5 py-0.5 text-[11px] text-zinc-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className={idx % 2 === 0 ? 'bg-[#0e0e20]' : 'bg-[#111128]'}>
                      <td colSpan={9} className="px-6 py-3 border-t border-[#1e1e3a]">
                        <div className="flex gap-6 text-xs">
                          <div>
                            <span className="text-zinc-500">完整备注：</span>
                            <span className="text-zinc-300 ml-1">{sample.notes || '无'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">登记时间：</span>
                            <span className="text-zinc-300 ml-1">{fmtDateTime(sample.createdAt)}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">存放位置：</span>
                            <span className="font-mono text-zinc-300 ml-1">{sample.storageLocation}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-zinc-500">
                  暂无样本数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <SampleFormModal
          instruments={instruments}
          reservations={reservations}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentRole={currentRole}
          onSubmit={(data) => {
            addSample(data)
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function SampleFormModal({
  instruments,
  reservations,
  currentUserId,
  currentUserName,
  currentRole,
  onSubmit,
  onClose,
}: {
  instruments: { id: string; name: string }[]
  reservations: { id: string; instrumentId: string; userId: string; userName: string; userGroup: string; startTime: string; endTime: string; status: string }[]
  currentUserId: string
  currentUserName: string
  currentRole: string
  onSubmit: (data: Omit<Sample, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [instrumentId, setInstrumentId] = useState('')
  const [reservationId, setReservationId] = useState('')
  const [submitter, setSubmitter] = useState(currentRole === 'student' ? currentUserName : '')
  const [group, setGroup] = useState('')
  const [storageLocation, setStorageLocation] = useState('')
  const [notes, setNotes] = useState('')

  const userReservations = currentRole === 'student'
    ? reservations.filter((r) => r.userId === currentUserId)
    : reservations

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !instrumentId || !submitter || !group) return
    onSubmit({
      name,
      instrumentId,
      reservationId,
      submitter,
      group,
      storageLocation,
      notes,
      status: 'waiting',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#16162e] border border-[#1e1e3a] rounded-xl w-full max-w-lg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-zinc-100 mb-4">登记样本</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">样本名称 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0e0e20] border border-[#1e1e3a] rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500/50"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">关联仪器 *</label>
              <select
                value={instrumentId}
                onChange={(e) => setInstrumentId(e.target.value)}
                className="w-full bg-[#0e0e20] border border-[#1e1e3a] rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500/50"
                required
              >
                <option value="">选择仪器</option>
                {instruments.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">关联预约</label>
              <select
                value={reservationId}
                onChange={(e) => {
                  setReservationId(e.target.value)
                  const res = reservations.find((r) => r.id === e.target.value)
                  if (res) {
                    setInstrumentId(res.instrumentId)
                    setSubmitter(res.userName)
                    setGroup(res.userGroup)
                  }
                }}
                className="w-full bg-[#0e0e20] border border-[#1e1e3a] rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500/50"
              >
                <option value="">选择预约</option>
                {userReservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {instruments.find((i) => i.id === r.instrumentId)?.name ?? r.instrumentId} - {fmtDateTime(r.startTime)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">提交人 *</label>
              <input
                value={submitter}
                onChange={(e) => setSubmitter(e.target.value)}
                className="w-full bg-[#0e0e20] border border-[#1e1e3a] rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">课题组 *</label>
              <input
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full bg-[#0e0e20] border border-[#1e1e3a] rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500/50"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">存放位置</label>
            <input
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder="如 B栋304样品柜A-03"
              className="w-full bg-[#0e0e20] border border-[#1e1e3a] rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-[#0e0e20] border border-[#1e1e3a] rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
            >
              提交
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
