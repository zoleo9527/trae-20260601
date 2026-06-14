import { useEffect, useState, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { fetchRecords, fetchLogs, receiveRecord, inspectRecord, reviewRecord, supplementRecord, batchReview } from '@/utils/api'
import { statusLabel, statusColor, statusDotColor, roleLabel, actionLabel, formatTime } from '@/utils/format'
import type { AppointmentRecord, ActionLog, RoleType } from '@/types'
import { Car, ClipboardCheck, ShieldCheck, LogOut, RotateCcw, Eye, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Layers } from 'lucide-react'

const ROLE_META: Record<RoleType, { icon: React.ReactNode; color: string; title: string }> = {
  receptionist: { icon: <Car className="w-5 h-5" />, color: 'text-sky-400', title: '接车员工作台' },
  inspector: { icon: <ClipboardCheck className="w-5 h-5" />, color: 'text-violet-400', title: '检测员工作台' },
  reviewer: { icon: <ShieldCheck className="w-5 h-5" />, color: 'text-amber-400', title: '审核员工作台' },
}

export default function Dashboard() {
  const { currentRole, clearRole, records, setRecords, selectedRecord, setSelectedRecord, logs, setLogs, loading, setLoading } = useStore()
  const [actionRecord, setActionRecord] = useState<AppointmentRecord | null>(null)
  const [receptionNotes, setReceptionNotes] = useState('')
  const [inspectionResult, setInspectionResult] = useState('')
  const [reviewResultState, setReviewResult] = useState<'pass' | 'return' | 'reject'>('pass')
  const [returnReason, setReturnReason] = useState('')
  const [supplementaryNotes, setSupplementaryNotes] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchMode, setBatchMode] = useState(false)
  const [showBatchPanel, setShowBatchPanel] = useState(false)
  const [batchResultState, setBatchResult] = useState<'pass' | 'return' | 'reject'>('pass')
  const [batchReason, setBatchReason] = useState('')
  const [formError, setFormError] = useState('')
  const [batchError, setBatchError] = useState('')

  const setReviewResultWrapped = (v: 'pass' | 'return' | 'reject') => {
    setReviewResult(v)
    setFormError('')
    if (v === 'pass') setReturnReason('')
  }

  const setBatchResultWrapped = (v: 'pass' | 'return' | 'reject') => {
    setBatchResult(v)
    setBatchError('')
    if (v === 'pass') setBatchReason('')
  }

  const loadRecords = useCallback(async () => {
    if (!currentRole) return
    setLoading(true)
    try {
      const data = await fetchRecords(currentRole)
      setRecords(data)
    } finally {
      setLoading(false)
    }
  }, [currentRole, setRecords, setLoading])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  useEffect(() => {
    if (selectedRecord) {
      fetchLogs(selectedRecord.id).then(setLogs)
    }
  }, [selectedRecord, setLogs])

  const handleReceive = async () => {
    if (!actionRecord) return
    if (!receptionNotes.trim()) {
      setFormError('接车备注不能为空，请填写接车时的情况说明')
      return
    }
    setFormError('')
    try {
      await receiveRecord(actionRecord.id, receptionNotes, `${currentRole}-1`)
      setActionRecord(null)
      setReceptionNotes('')
      loadRecords()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '操作失败，请稍后重试')
    }
  }

  const handleInspect = async () => {
    if (!actionRecord) return
    if (!inspectionResult.trim()) {
      setFormError('检测结果不能为空，请填写车辆检测结果')
      return
    }
    setFormError('')
    try {
      await inspectRecord(actionRecord.id, inspectionResult, `${currentRole}-1`)
      setActionRecord(null)
      setInspectionResult('')
      loadRecords()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '操作失败，请稍后重试')
    }
  }

  const handleReview = async () => {
    if (!actionRecord) return
    if ((reviewResultState === 'return' || reviewResultState === 'reject') && !returnReason.trim()) {
      setFormError(reviewResultState === 'return' ? '退回原因不能为空，请说明退回原因' : '终止原因不能为空，请说明终止原因')
      return
    }
    setFormError('')
    try {
      await reviewRecord(actionRecord.id, reviewResultState, returnReason, `${currentRole}-1`)
      setActionRecord(null)
      setReviewResultWrapped('pass')
      setReturnReason('')
      loadRecords()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '操作失败，请稍后重试')
    }
  }

  const handleSupplement = async () => {
    if (!actionRecord) return
    if (!supplementaryNotes.trim()) {
      setFormError('补充备注不能为空，请针对退回原因补充说明')
      return
    }
    setFormError('')
    try {
      await supplementRecord(actionRecord.id, supplementaryNotes, `${currentRole}-1`)
      setActionRecord(null)
      setSupplementaryNotes('')
      loadRecords()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '操作失败，请稍后重试')
    }
  }

  const handleBatchReview = async () => {
    if (selectedIds.size === 0) return
    if ((batchResultState === 'return' || batchResultState === 'reject') && !batchReason.trim()) {
      setBatchError(batchResultState === 'return' ? '批量退回原因不能为空，请说明退回原因' : '批量终止原因不能为空，请说明终止原因')
      return
    }
    setBatchError('')
    try {
      await batchReview(Array.from(selectedIds), batchResultState, batchReason, `${currentRole}-1`)
      setSelectedIds(new Set())
      setBatchMode(false)
      setShowBatchPanel(false)
      setBatchResultWrapped('pass')
      setBatchReason('')
      loadRecords()
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : '操作失败，请稍后重试')
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const selectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)))
    }
  }

  if (!currentRole) return null

  const meta = ROLE_META[currentRole]

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">年检站</div>
              <div className="text-xs text-slate-500">预约接车核验系统</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <div className="px-3 py-2 bg-slate-800 rounded-lg flex items-center gap-3">
            <span className={meta.color}>{meta.icon}</span>
            <span className="text-sm font-medium text-white">{meta.title}</span>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-slate-800/50">
            <span className={meta.color}>{meta.icon}</span>
            <span className="text-sm text-slate-300">{roleLabel(currentRole)}</span>
          </div>
          <button
            onClick={() => { clearRole(); setSelectedRecord(null) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            切换角色
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">待办记录</h2>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{records.length} 条</span>
          </div>
          <div className="flex items-center gap-2">
            {currentRole === 'reviewer' && (
              <button
                onClick={() => setBatchMode(!batchMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${batchMode ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <Layers className="w-3.5 h-3.5" />
                批量模式
              </button>
            )}
            <button
              onClick={loadRecords}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              刷新
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-500">加载中...</div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-600" />
              <div className="text-lg font-medium">暂无待办</div>
              <div className="text-sm mt-1">所有记录均已处理</div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    {batchMode && (
                      <th className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === records.length && records.length > 0}
                          onChange={selectAll}
                          className="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                        />
                      </th>
                    )}
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">车牌号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">车主</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">车型</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">预约时间</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">退回原因</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      {batchMode && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                            className="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-white">{r.plateNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{r.ownerName}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{r.vehicleType}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{r.appointmentTime}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(r.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(r.status)}`} />
                          {statusLabel(r.status)}
                        </span>
                        {r.retryCount > 0 && (
                          <span className="ml-1.5 text-xs text-orange-400">×{r.retryCount}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-orange-400 max-w-40 truncate">{r.returnReason || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedRecord(r); setLogs([]) }}
                            className="p-1.5 text-slate-500 hover:text-sky-400 rounded-md hover:bg-slate-800 transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {currentRole === 'receptionist' && (r.status === 'pending_reception' || r.status === 'returned') && (
                            <button
                              onClick={() => {
                                if (r.status === 'returned') {
                                  setActionRecord(r)
                                  setSupplementaryNotes('')
                                } else {
                                  setActionRecord(r)
                                  setReceptionNotes('')
                                }
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
                            >
                              {r.status === 'returned' ? <RefreshCw className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                              {r.status === 'returned' ? '补充' : '接车'}
                            </button>
                          )}
                          {currentRole === 'inspector' && r.status === 'pending_inspection' && (
                            <button
                              onClick={() => { setActionRecord(r); setInspectionResult('') }}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                            >
                              <ClipboardCheck className="w-3 h-3" />
                              检测
                            </button>
                          )}
                          {currentRole === 'reviewer' && r.status === 'pending_review' && !batchMode && (
                            <button
                              onClick={() => { setActionRecord(r); setReviewResult('pass'); setReturnReason('') }}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              审核
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {batchMode && currentRole === 'reviewer' && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-slate-400">已选 {selectedIds.size} 条</span>
              <button
                onClick={() => setShowBatchPanel(true)}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
              >
                <Layers className="w-4 h-4" />
                批量审核
              </button>
            </div>
          )}
        </div>
      </main>

      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          logs={logs}
          onClose={() => { setSelectedRecord(null); setLogs([]) }}
        />
      )}

      {actionRecord && (
        <ActionModal
          record={actionRecord}
          role={currentRole}
          receptionNotes={receptionNotes}
          setReceptionNotes={setReceptionNotes}
          inspectionResult={inspectionResult}
          setInspectionResult={setInspectionResult}
          reviewResult={reviewResultState}
          setReviewResult={setReviewResultWrapped}
          returnReason={returnReason}
          setReturnReason={setReturnReason}
          supplementaryNotes={supplementaryNotes}
          setSupplementaryNotes={setSupplementaryNotes}
          formError={formError}
          setFormError={setFormError}
          onReceive={handleReceive}
          onInspect={handleInspect}
          onReview={handleReview}
          onSupplement={handleSupplement}
          onClose={() => { setActionRecord(null); setFormError('') }}
        />
      )}

      {showBatchPanel && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => { setShowBatchPanel(false); setBatchError('') }}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">批量审核 ({selectedIds.size} 条记录)</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                {(['pass', 'return', 'reject'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setBatchResultWrapped(opt)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                      batchResultState === opt
                        ? opt === 'pass' ? 'bg-emerald-600 text-white' : opt === 'return' ? 'bg-orange-600 text-white' : 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt === 'pass' ? '通过' : opt === 'return' ? '退回' : '终止'}
                  </button>
                ))}
              </div>
              {(batchResultState === 'return' || batchResultState === 'reject') && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{batchResultState === 'return' ? '退回原因' : '终止原因'}<span className="text-red-400 ml-0.5">*</span></label>
                  <textarea
                    value={batchReason}
                    onChange={(e) => { setBatchReason(e.target.value); setBatchError('') }}
                    placeholder={batchResultState === 'return' ? '请说明退回原因，此原因将通知接车员...' : '请说明终止原因...'}
                    className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none resize-none ${batchError ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-amber-500'}`}
                    rows={3}
                  />
                </div>
              )}
              {batchError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {batchError}
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setShowBatchPanel(false); setBatchError('') }} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg transition-colors">取消</button>
                <button onClick={handleBatchReview} className="px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors">确认</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RecordDetailModal({ record, logs, onClose }: { record: AppointmentRecord; logs: ActionLog[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{record.plateNumber}</h3>
            <p className="text-sm text-slate-400 mt-0.5">{record.ownerName} · {record.vehicleType} · {record.appointmentTime}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(record.status)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(record.status)}`} />
              {statusLabel(record.status)}
            </span>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <InfoField label="接车员" value={record.receptionistId ? roleLabel('receptionist') : '-'} />
            <InfoField label="接车时间" value={formatTime(record.receptionTime)} />
            <InfoField label="接车备注" value={record.receptionNotes || '-'} fullWidth />
            <InfoField label="检测员" value={record.inspectorId ? roleLabel('inspector') : '-'} />
            <InfoField label="检测时间" value={formatTime(record.inspectionTime)} />
            <InfoField label="检测结果" value={record.inspectionResult || '-'} fullWidth />
            <InfoField label="审核员" value={record.reviewerId ? roleLabel('reviewer') : '-'} />
            <InfoField label="审核时间" value={formatTime(record.reviewTime)} />
            <InfoField label="审核结果" value={record.reviewResult === 'pass' ? '通过' : record.reviewResult === 'return' ? '退回' : record.reviewResult === 'reject' ? '终止' : '-'} />
            <InfoField label="退回原因" value={record.returnReason || '-'} fullWidth />
            <InfoField label="补充备注" value={record.supplementaryNotes || '-'} fullWidth />
            <InfoField label="退回次数" value={record.retryCount > 0 ? `${record.retryCount} 次` : '-'} />
          </div>

          {logs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">操作时间线</h4>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-800" />
                {logs.map((log) => (
                  <div key={log.id} className="relative pl-10 pb-6 last:pb-0">
                    <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 border-slate-700 bg-slate-900" />
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-sm font-medium text-white">{actionLabel(log.action)}</span>
                        <span className="text-xs text-slate-500 ml-2">{roleLabel(log.operatorRole)}</span>
                      </div>
                      <span className="text-xs text-slate-600">{formatTime(log.timestamp)}</span>
                    </div>
                    {log.notes && (
                      <p className="text-xs text-slate-400 mt-1">{log.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm text-slate-300 whitespace-pre-wrap">{value}</div>
    </div>
  )
}

interface ActionModalProps {
  record: AppointmentRecord
  role: RoleType
  receptionNotes: string
  setReceptionNotes: (v: string) => void
  inspectionResult: string
  setInspectionResult: (v: string) => void
  reviewResult: 'pass' | 'return' | 'reject'
  setReviewResult: (v: 'pass' | 'return' | 'reject') => void
  returnReason: string
  setReturnReason: (v: string) => void
  supplementaryNotes: string
  setSupplementaryNotes: (v: string) => void
  formError: string
  setFormError: (v: string) => void
  onReceive: () => void
  onInspect: () => void
  onReview: () => void
  onSupplement: () => void
  onClose: () => void
}

function ActionModal({
  record, role, receptionNotes, setReceptionNotes,
  inspectionResult, setInspectionResult,
  reviewResult, setReviewResult, returnReason, setReturnReason,
  supplementaryNotes, setSupplementaryNotes,
  formError, setFormError,
  onReceive, onInspect, onReview, onSupplement, onClose,
}: ActionModalProps) {
  const isReturn = record.status === 'returned'

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">{record.plateNumber}</h3>
            <p className="text-sm text-slate-400">{record.ownerName} · {statusLabel(record.status)}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {isReturn && role === 'receptionist' && (
          <div className="mb-4 p-3 bg-orange-950/50 border border-orange-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-orange-400 text-sm font-medium mb-1">
              <AlertTriangle className="w-4 h-4" />
              退回原因
            </div>
            <p className="text-sm text-orange-300">{record.returnReason}</p>
          </div>
        )}

        {record.receptionNotes && role !== 'receptionist' && (
          <div className="mb-4 p-3 bg-sky-950/50 border border-sky-800/50 rounded-lg">
            <div className="text-xs text-sky-400 font-medium mb-1">接车备注</div>
            <p className="text-sm text-sky-300">{record.receptionNotes}</p>
          </div>
        )}

        {record.inspectionResult && role === 'reviewer' && (
          <div className="mb-4 p-3 bg-violet-950/50 border border-violet-800/50 rounded-lg">
            <div className="text-xs text-violet-400 font-medium mb-1">检测结果</div>
            <p className="text-sm text-violet-300">{record.inspectionResult}</p>
          </div>
        )}

        {role === 'reviewer' && record.retryCount > 0 && record.returnReason && (
          <div className="mb-4 p-3 bg-orange-950/50 border border-orange-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-orange-400 text-xs font-medium mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              上一轮退回原因
            </div>
            <p className="text-sm text-orange-300">{record.returnReason}</p>
            {record.supplementaryNotes && (
              <div className="mt-2 pt-2 border-t border-orange-800/30">
                <div className="text-xs text-sky-400 font-medium mb-1">接车员补充备注</div>
                <p className="text-sm text-sky-300">{record.supplementaryNotes}</p>
              </div>
            )}
          </div>
        )}

        {formError && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-950/50 border border-red-800/50 rounded-lg text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {formError}
          </div>
        )}

        {role === 'receptionist' && record.status === 'pending_reception' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">接车备注<span className="text-red-400 ml-0.5">*</span></label>
              <textarea
                value={receptionNotes}
                onChange={(e) => { setReceptionNotes(e.target.value); setFormError('') }}
                placeholder="填写接车时的情况说明，此备注将传递给检测员和审核员..."
                className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none resize-none ${formError && !receptionNotes.trim() ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-sky-500'}`}
                rows={4}
              />
            </div>
            <button onClick={onReceive} className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              <Car className="w-4 h-4" />
              确认接车
            </button>
          </div>
        )}

        {role === 'receptionist' && isReturn && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">补充备注<span className="text-red-400 ml-0.5">*</span></label>
              <textarea
                value={supplementaryNotes}
                onChange={(e) => { setSupplementaryNotes(e.target.value); setFormError('') }}
                placeholder="针对退回原因补充说明，此备注将传递给检测员和审核员..."
                className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none resize-none ${formError && !supplementaryNotes.trim() ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-sky-500'}`}
                rows={4}
              />
            </div>
            <button onClick={onSupplement} className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              补充备注并重新提交
            </button>
          </div>
        )}

        {role === 'inspector' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">检测结果<span className="text-red-400 ml-0.5">*</span></label>
              <textarea
                value={inspectionResult}
                onChange={(e) => { setInspectionResult(e.target.value); setFormError('') }}
                placeholder="填写车辆检测结果..."
                className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none resize-none ${formError && !inspectionResult.trim() ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-violet-500'}`}
                rows={4}
              />
            </div>
            <button onClick={onInspect} className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              提交检测结果
            </button>
          </div>
        )}

        {role === 'reviewer' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">审核结果</label>
              <div className="flex gap-2">
                {(['pass', 'return', 'reject'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setReviewResult(opt)}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                      reviewResult === opt
                        ? opt === 'pass' ? 'bg-emerald-600 text-white' : opt === 'return' ? 'bg-orange-600 text-white' : 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt === 'pass' ? <CheckCircle2 className="w-4 h-4" /> : opt === 'return' ? <RefreshCw className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {opt === 'pass' ? '通过' : opt === 'return' ? '退回' : '终止'}
                  </button>
                ))}
              </div>
            </div>
            {(reviewResult === 'return' || reviewResult === 'reject') && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">{reviewResult === 'return' ? '退回原因' : '终止原因'}<span className="text-red-400 ml-0.5">*</span></label>
                <textarea
                  value={returnReason}
                  onChange={(e) => { setReturnReason(e.target.value); setFormError('') }}
                  placeholder={reviewResult === 'return' ? '请说明退回原因，此原因将通知接车员...' : '请说明终止原因...'}
                  className={`w-full bg-slate-800 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none resize-none ${formError && !returnReason.trim() ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-amber-500'}`}
                  rows={3}
                />
              </div>
            )}
            <button onClick={onReview} className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              提交审核结果
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
