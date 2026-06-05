import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, CheckCircle, Activity, User } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import NoteCard from '@/components/NoteCard'
import { useIncidentStore } from '@/store/useIncidentStore'
import type { IncidentStatus, NoteCategory } from '@/shared/types'
import { STATUS_LABELS, STATUS_FLOW, NOTE_CATEGORY_LABELS } from '@/shared/types'

const noteCategories: NoteCategory[] = ['rescue', 'medical', 'insurance', 'anomaly']

export default function IncidentProcess() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentIncident, notes, operationLogs, loading, fetchIncidentDetail, addNote, transitionStatus } = useIncidentStore()

  const [noteContent, setNoteContent] = useState('')
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('rescue')
  const [noteAuthor, setNoteAuthor] = useState('')
  const [showStatusConfirm, setShowStatusConfirm] = useState<IncidentStatus | null>(null)
  const [statusRemark, setStatusRemark] = useState('')
  const [statusOperator, setStatusOperator] = useState('')

  useEffect(() => {
    if (id) {
      fetchIncidentDetail(id)
    }
  }, [id, fetchIncidentDetail])

  const incident = currentIncident
  const displayNotes = notes
  const displayLogs = operationLogs

  const currentStatusIndex = incident ? STATUS_FLOW.indexOf(incident.status) : -1
  const nextStatus = currentStatusIndex >= 0 && currentStatusIndex < STATUS_FLOW.length - 1 
    ? STATUS_FLOW[currentStatusIndex + 1] 
    : null
  const availableNextStatuses = nextStatus ? [nextStatus] : []

  const handleAddNote = () => {
    if (!noteContent.trim() || !noteAuthor.trim()) return
    addNote(id!, { 
      author: noteAuthor.trim(), 
      category: noteCategory, 
      content: noteContent.trim() 
    })
    setNoteContent('')
  }

  const handleTransitionStatus = (toStatus: IncidentStatus) => {
    setShowStatusConfirm(toStatus)
    setStatusRemark('')
    if (incident?.responsible_person) {
      setStatusOperator(incident.responsible_person)
    }
  }

  const confirmTransition = () => {
    if (showStatusConfirm && statusOperator.trim()) {
      transitionStatus(id!, showStatusConfirm, statusOperator.trim(), statusRemark.trim())
      setShowStatusConfirm(null)
    }
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(`/incident/${id}`)}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回事件详情
      </button>

      {loading ? (
        <div className="text-center py-12 text-slate-500">加载中...</div>
      ) : !incident ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
          未找到事件数据
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-lg font-bold text-slate-800">{incident.incident_no}</h1>
                  <StatusBadge status={incident.status} />
                </div>
                <p className="text-sm text-slate-500">
                  {incident.location} · 伤者: {incident.injured_name || '未记录'} · 责任人: {incident.responsible_person || '未分配'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-800 mb-4">添加备注</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-2">操作人</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={noteAuthor}
                        onChange={(e) => setNoteAuthor(e.target.value)}
                        placeholder="请输入您的姓名"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ice-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-2">备注分类</label>
                    <div className="flex gap-2">
                      {noteCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setNoteCategory(cat)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            noteCategory === cat
                              ? 'bg-ice-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {NOTE_CATEGORY_LABELS[cat]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-2">备注内容</label>
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="输入备注内容..."
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ice-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleAddNote}
                    disabled={!noteContent.trim() || !noteAuthor.trim()}
                    className="w-full px-4 py-2 bg-ice-600 text-white text-sm font-medium rounded-lg hover:bg-ice-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    提交备注
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mt-6">
                <h2 className="text-base font-semibold text-slate-800 mb-4">状态流转</h2>
                {availableNextStatuses.length > 0 ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">当前状态：</span>
                        <span className="text-slate-800">{STATUS_LABELS[incident.status]}</span>
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        <span className="font-medium">下一步：</span>
                        <span className="text-ice-600 font-medium">{STATUS_LABELS[nextStatus!]}</span>
                      </p>
                    </div>
                    {availableNextStatuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleTransitionStatus(status)}
                        className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg hover:border-ice-300 hover:bg-ice-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          变更为: {STATUS_LABELS[status]}
                        </span>
                        <CheckCircle className="w-4 h-4 text-ice-600" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3">
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">当前状态：</span>
                        <span className="text-slate-800">{STATUS_LABELS[incident.status]}</span>
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        <span className="font-medium">下一步：</span>
                        <span className="text-slate-400">无（已到达最终状态）</span>
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">已到达最终状态</p>
                  </div>
                )}

                {showStatusConfirm && (
                  <div className="mt-4 p-4 bg-ice-50 rounded-lg border border-ice-200">
                    <p className="text-sm font-medium text-slate-700 mb-3">
                      确认变更状态为: {STATUS_LABELS[showStatusConfirm]}
                    </p>
                    <div className="mb-3">
                      <label className="block text-xs text-slate-500 mb-1">操作人</label>
                      <input
                        type="text"
                        value={statusOperator}
                        onChange={(e) => setStatusOperator(e.target.value)}
                        placeholder="请输入操作人姓名"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ice-500 focus:border-transparent"
                      />
                    </div>
                    <textarea
                      value={statusRemark}
                      onChange={(e) => setStatusRemark(e.target.value)}
                      placeholder="填写变更备注（可选）..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ice-500 focus:border-transparent mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={confirmTransition}
                        disabled={!statusOperator.trim()}
                        className="flex-1 px-3 py-2 bg-ice-600 text-white text-sm font-medium rounded-lg hover:bg-ice-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        确认变更
                      </button>
                      <button
                        onClick={() => setShowStatusConfirm(null)}
                        className="flex-1 px-3 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-800 mb-4">已有备注</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                  {displayNotes.length > 0 ? (
                    displayNotes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">暂无备注记录</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mt-6">
                <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  操作日志
                </h2>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {displayLogs.length > 0 ? (
                    displayLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                        <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-slate-700">{log.operator}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {log.action}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{log.detail}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(log.created_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">暂无操作日志</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
