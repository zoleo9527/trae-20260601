import { SampleBadge } from '@/components/StatusBadge';
import { useStore } from '@/store/useStore';
import type { Sample, SampleStatus } from '@/types';
import { fmtDateTime } from '@/utils/time';
import { ChevronDown, ChevronRight, Download, Edit3, Plus, Search } from 'lucide-react';
import React, { useState } from 'react';

const TABS: { label: string; value: SampleStatus | null }[] = [
  { label: '全部', value: null },
  { label: '待测', value: 'waiting' },
  { label: '检测中', value: 'testing' },
  { label: '完成', value: 'done' },
  { label: '异常', value: 'abnormal' },
  { label: '顺延待处理', value: 'pending_postpone' },
  { label: '已顺延', value: 'postponed' },
  { label: '已取消', value: 'cancelled' },
]

const STATUS_OPTIONS: { label: string; value: SampleStatus; needNote: boolean }[] = [
  { label: '待测', value: 'waiting', needNote: false },
  { label: '检测中', value: 'testing', needNote: false },
  { label: '完成', value: 'done', needNote: false },
  { label: '异常', value: 'abnormal', needNote: true },
  { label: '顺延待处理', value: 'pending_postpone', needNote: true },
  { label: '已顺延', value: 'postponed', needNote: true },
  { label: '已取消', value: 'cancelled', needNote: true },
]

const isDispositionStatus = (status: SampleStatus) =>
  status === 'pending_postpone' || status === 'postponed' || status === 'cancelled'

const getDefaultDispositionNote = (status: SampleStatus) => {
  switch (status) {
    case 'pending_postpone':
      return '关联预约被标记顺延，等待管理员安排新时段';
    case 'postponed':
      return '样本已顺延至新时段，请按时安排测试';
    case 'cancelled':
      return '样本取消测试，请及时取回';
    case 'abnormal':
      return '检测异常，需进一步处理';
    default:
      return '';
  }
};

export default function SamplesPage() {
  const { samples, instruments, reservations, addSample, updateSampleDisposition, currentRole, currentUserId } = useStore()
  const [statusFilter, setStatusFilter] = useState<SampleStatus | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusTargetSample, setStatusTargetSample] = useState<Sample | null>(null)
  const [newStatus, setNewStatus] = useState<SampleStatus>('waiting')
  const [dispositionNote, setDispositionNote] = useState('')

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

  const handleStatusClick = (sample: Sample) => {
    setStatusTargetSample(sample)
    setNewStatus(sample.status)
    const statusOpt = STATUS_OPTIONS.find((o) => o.value === sample.status)
    setDispositionNote(statusOpt?.needNote ? (sample.dispositionNote || getDefaultDispositionNote(sample.status)) : '')
    setShowStatusModal(true)
  }

  const handleStatusOptionChange = (status: SampleStatus) => {
    setNewStatus(status)
    const statusOpt = STATUS_OPTIONS.find((o) => o.value === status)
    if (statusOpt?.needNote && !dispositionNote) {
      setDispositionNote(getDefaultDispositionNote(status))
    }
  }

  const handleConfirmStatus = () => {
    if (!statusTargetSample) return
    const statusOpt = STATUS_OPTIONS.find((o) => o.value === newStatus)
    const note = statusOpt?.needNote ? dispositionNote : ''
    updateSampleDisposition(statusTargetSample.id, newStatus, note)
    setShowStatusModal(false)
    setStatusTargetSample(null)
    setDispositionNote('')
  }

  const handleExport = () => {
    const headers = ['样本名称', '关联仪器', '提交人', '课题组', '状态', '存放位置', '备注', '处置说明', '创建时间']
    const rows = filtered.map((s) =>
      [
        s.name,
        getInstrumentName(s.instrumentId),
        s.submitter,
        s.group,
        STATUS_OPTIONS.find((o) => o.value === s.status)?.label || s.status,
        s.storageLocation,
        `"${s.notes.replace(/"/g, '""')}"`,
        `"${(s.dispositionNote || '').replace(/"/g, '""')}"`,
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

  const showNoteField = STATUS_OPTIONS.find((o) => o.value === newStatus)?.needNote ?? false

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1 bg-[#12122a] rounded-lg p-1 flex-wrap">
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
              <th className="text-left px-3 py-2.5 font-medium">处置说明</th>
              <th className="text-left px-3 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sample, idx) => {
              const isExpanded = expandedId === sample.id
              const hasDisposition = isDispositionStatus(sample.status)
              return (
                <React.Fragment key={sample.id}>
                  <tr
                    className={`cursor-pointer transition-colors ${
                      hasDisposition ? 'bg-yellow-950/10' : idx % 2 === 0 ? 'bg-[#0e0e20]' : 'bg-[#111128]'
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
                    <td className="px-3 py-2.5 text-zinc-400 max-w-[180px] truncate">
                      {sample.dispositionNote || '-'}
                    </td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      {currentRole !== 'student' && (
                        <button
                          onClick={() => handleStatusClick(sample)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-[#12122a] border border-[#1e1e3a] text-[11px] text-zinc-300 hover:text-zinc-100 hover:border-blue-500/50 transition-colors"
                        >
                          <Edit3 size={10} />
                          修改
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className={hasDisposition ? 'bg-yellow-950/10' : idx % 2 === 0 ? 'bg-[#0e0e20]' : 'bg-[#111128]'}>
                      <td colSpan={9} className="px-6 py-3 border-t border-[#1e1e3a]">
                        <div className="space-y-2 text-xs">
                          <div className="flex gap-6">
                            <div>
                              <span className="text-zinc-500">备注：</span>
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
                          {hasDisposition && sample.dispositionNote && (
                            <div className="flex items-start gap-2 pt-2 border-t border-[#1e1e3a]/50">
                              <span className="text-yellow-400/70 shrink-0">处置：</span>
                              <span className="text-yellow-300/80 leading-relaxed">{sample.dispositionNote}</span>
                            </div>
                          )}
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

      {showStatusModal && statusTargetSample && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="bg-[#16162e] border border-[#1e1e3a] rounded-xl w-full max-w-md p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-zinc-100 mb-1">修改样本状态</h3>
            <p className="text-xs text-zinc-500 mb-4">
              样本：<span className="text-zinc-300 font-medium">{statusTargetSample.name}</span>
            </p>
            <div className="mb-4">
              <label className="block text-[11px] text-zinc-500 mb-1">新状态</label>
              <select
                value={newStatus}
                onChange={(e) => handleStatusOptionChange(e.target.value as SampleStatus)}
                className="w-full px-3 py-2 rounded bg-[#0e0e20] border border-[#1e1e3a] text-xs text-zinc-200 focus:outline-none focus:border-blue-500/50"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                    {opt.needNote && ' *'}
                  </option>
                ))}
              </select>
            </div>
            {showNoteField && (
              <div className="mb-4">
                <label className="block text-[11px] text-zinc-500 mb-1">处置说明</label>
                <textarea
                  value={dispositionNote}
                  onChange={(e) => setDispositionNote(e.target.value)}
                  rows={3}
                  placeholder="请描述处置说明和样本去向"
                  className="w-full px-3 py-2 rounded bg-[#0e0e20] border border-[#1e1e3a] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none"
                />
                <p className="text-[10px] text-zinc-600 mt-1">
                  {newStatus === 'cancelled'
                    ? '建议说明取消原因和样本去向（如"请于3日内到B栋304取回"）'
                    : newStatus === 'postponed'
                      ? '建议说明新时段安排和注意事项'
                      : newStatus === 'pending_postpone'
                        ? '建议说明顺延原因和预计处理时间'
                        : '建议说明异常情况和后续处理方式'}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmStatus}
                className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

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
      dispositionNote: '',
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
