import { useEffect, useState } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { ProblemStatusBadge, RoleBadge } from '@/components/StatusBadge'
import { PROBLEM_TYPE_LABELS, CONTACT_TYPE_LABELS, type ProblemStatus, type ContactType, type Role, type ProblemType } from '../../shared/types'
import { ArrowLeft, RotateCcw, FileEdit, ClipboardCheck, Phone } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

export default function ProblemDetail() {
  const { problemDetail, loadProblemDetail, returnProblem, supplementProblem, reviewProblem, createContact, currentUser } = useAppStore()
  const { id } = useParams<{ id: string }>()

  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [showSupplementDialog, setShowSupplementDialog] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)

  const [returnResolution, setReturnResolution] = useState('')
  const [supplementDesc, setSupplementDesc] = useState('')
  const [supplementType, setSupplementType] = useState<ProblemType | ''>('')
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | ''>('')
  const [reviewResolution, setReviewResolution] = useState('')
  const [contactType, setContactType] = useState<ContactType>('phone')
  const [contactResponse, setContactResponse] = useState('')
  const [contactFollowUp, setContactFollowUp] = useState(false)
  const [contactNotes, setContactNotes] = useState('')

  useEffect(() => {
    if (id) loadProblemDetail(id)
  }, [id])

  if (!problemDetail || problemDetail.id !== id) {
    return (
      <div className="p-6">
        <Link to="/problems" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> 返回问题件列表
        </Link>
        <p className="text-slate-400">加载中...</p>
      </div>
    )
  }

  const p = problemDetail
  const canReturn = ['pending', 'contacting', 'supplementing', 'reviewing'].includes(p.status) && (currentUser.role === 'station_cs' || currentUser.role === 'station_manager')
  const canSupplement = ['pending', 'contacting'].includes(p.status) && currentUser.role === 'station_cs'
  const canReview = p.status === 'reviewing' && currentUser.role === 'station_manager'
  const canSubmitReview = ['pending', 'contacting', 'supplementing'].includes(p.status) && currentUser.role === 'station_cs'
  const canContact = ['pending', 'contacting', 'supplementing'].includes(p.status) && (currentUser.role === 'station_cs' || currentUser.role === 'courier')

  return (
    <div className="p-6">
      <Link to="/problems" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> 返回问题件列表
      </Link>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-800">{p.trackingNumber}</h3>
                  <ProblemStatusBadge status={p.status as ProblemStatus} />
                  <span className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                    {PROBLEM_TYPE_LABELS[p.problemType as ProblemType] || p.problemType}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{p.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-slate-400">报告人：</span>
                <span className="text-slate-700">{p.reporterName}</span>
                <RoleBadge role={p.reporterRole as Role} />
              </div>
              <div>
                <span className="text-slate-400">责任人：</span>
                <span className="text-slate-700">{p.responsiblePersonName}</span>
              </div>
              <div>
                <span className="text-slate-400">登记时间：</span>
                <span className="text-slate-600">{p.createdAt}</span>
              </div>
              <div>
                <span className="text-slate-400">更新时间：</span>
                <span className="text-slate-600">{p.updatedAt}</span>
              </div>
              {p.resolution && (
                <div className="col-span-2">
                  <span className="text-slate-400">处理结果：</span>
                  <span className="text-slate-700">{p.resolution}</span>
                </div>
              )}
            </div>

            {p.delivery && (
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <p className="text-xs font-medium text-slate-500 mb-2">派件信息</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-400">收件人：</span>{p.delivery.recipientName}</div>
                  <div><span className="text-slate-400">电话：</span>{p.delivery.recipientPhone}</div>
                  <div className="col-span-2"><span className="text-slate-400">地址：</span>{p.delivery.deliveryAddress}</div>
                  <div><span className="text-slate-400">派件员：</span>{p.delivery.courierName}</div>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
              {canReturn && (
                <button onClick={() => setShowReturnDialog(true)} className="flex items-center gap-1.5 text-xs bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700">
                  <RotateCcw className="w-3.5 h-3.5" /> 退回
                </button>
              )}
              {canSupplement && (
                <button onClick={() => setShowSupplementDialog(true)} className="flex items-center gap-1.5 text-xs bg-orange-500 text-white px-3 py-2 rounded hover:bg-orange-600">
                  <FileEdit className="w-3.5 h-3.5" /> 补录
                </button>
              )}
              {canSubmitReview && (
                <button onClick={() => { reviewProblem(p.id, { action: 'submit' }) }} className="flex items-center gap-1.5 text-xs bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700">
                  <ClipboardCheck className="w-3.5 h-3.5" /> 提交复核
                </button>
              )}
              {canReview && (
                <button onClick={() => setShowReviewDialog(true)} className="flex items-center gap-1.5 text-xs bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700">
                  <ClipboardCheck className="w-3.5 h-3.5" /> 复核处理
                </button>
              )}
              {canContact && (
                <button onClick={() => setShowContactDialog(true)} className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700">
                  <Phone className="w-3.5 h-3.5" /> 客户联系
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">客户联系记录</h4>
            {p.contacts && p.contacts.length > 0 ? (
              <div className="space-y-3">
                {p.contacts.map((c) => (
                  <div key={c.id} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5">{CONTACT_TYPE_LABELS[c.contactType as ContactType] || c.contactType}</span>
                        <span className="text-xs text-slate-500">{c.contactPersonName}</span>
                        <RoleBadge role={c.contactPersonRole as Role} />
                      </div>
                      <span className="text-xs text-slate-400">{c.createdAt}</span>
                    </div>
                    <p className="text-sm text-slate-700">{c.customerResponse}</p>
                    {c.notes && <p className="text-xs text-slate-500 mt-1">备注：{c.notes}</p>}
                    {c.followUpRequired && (
                      <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-700 rounded px-2 py-0.5">需要跟进</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">暂无联系记录</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">处理历史</h4>
            {p.history && p.history.length > 0 ? (
              <div className="space-y-3">
                {p.history.map((h) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                      <div className="w-px flex-1 bg-slate-200"></div>
                    </div>
                    <div className="pb-3">
                      <p className="text-xs font-medium text-slate-700">{h.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{h.operatorName}</span>
                        <RoleBadge role={h.operatorRole as Role} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{h.createdAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">暂无历史</p>
            )}
          </div>
        </div>
      </div>

      {showReturnDialog && (
        <Dialog title="确认退回" onClose={() => setShowReturnDialog(false)}>
          <p className="text-sm text-slate-600 mb-3">确认将问题件 <strong>{p.trackingNumber}</strong> 退回发件方？</p>
          <textarea value={returnResolution} onChange={(e) => setReturnResolution(e.target.value)} placeholder="退回原因/说明" className="w-full border border-slate-200 rounded px-3 py-2 text-sm mb-3" rows={3} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowReturnDialog(false)} className="text-sm px-4 py-2 text-slate-600 border border-slate-200 rounded hover:bg-slate-50">取消</button>
            <button onClick={async () => { await returnProblem(p.id, { resolution: returnResolution }); setShowReturnDialog(false); setReturnResolution(''); }} className="text-sm px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">确认退回</button>
          </div>
        </Dialog>
      )}

      {showSupplementDialog && (
        <Dialog title="补录信息" onClose={() => setShowSupplementDialog(false)}>
          <p className="text-sm text-slate-600 mb-3">补录问题件 <strong>{p.trackingNumber}</strong> 的信息</p>
          <div className="mb-3">
            <label className="text-xs text-slate-500 block mb-1">问题类型</label>
            <select value={supplementType} onChange={(e) => setSupplementType(e.target.value as ProblemType)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm">
              <option value="">保持不变</option>
              {(Object.entries(PROBLEM_TYPE_LABELS) as [string, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <textarea value={supplementDesc} onChange={(e) => setSupplementDesc(e.target.value)} placeholder="补录说明" className="w-full border border-slate-200 rounded px-3 py-2 text-sm mb-3" rows={3} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowSupplementDialog(false)} className="text-sm px-4 py-2 text-slate-600 border border-slate-200 rounded hover:bg-slate-50">取消</button>
            <button onClick={async () => { await supplementProblem(p.id, { description: supplementDesc, problemType: supplementType || undefined }); setShowSupplementDialog(false); setSupplementDesc(''); setSupplementType(''); }} className="text-sm px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">确认补录</button>
          </div>
        </Dialog>
      )}

      {showReviewDialog && (
        <Dialog title="复核处理" onClose={() => setShowReviewDialog(false)}>
          <p className="text-sm text-slate-600 mb-3">复核问题件 <strong>{p.trackingNumber}</strong></p>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setReviewAction('approve')} className={`text-sm px-4 py-2 rounded ${reviewAction === 'approve' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>通过</button>
            <button onClick={() => setReviewAction('reject')} className={`text-sm px-4 py-2 rounded ${reviewAction === 'reject' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>退回</button>
          </div>
          <textarea value={reviewResolution} onChange={(e) => setReviewResolution(e.target.value)} placeholder="复核意见" className="w-full border border-slate-200 rounded px-3 py-2 text-sm mb-3" rows={3} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowReviewDialog(false)} className="text-sm px-4 py-2 text-slate-600 border border-slate-200 rounded hover:bg-slate-50">取消</button>
            <button onClick={async () => { if (reviewAction) { await reviewProblem(p.id, { action: reviewAction, resolution: reviewResolution }); setShowReviewDialog(false); setReviewAction(''); setReviewResolution(''); } }} className="text-sm px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" disabled={!reviewAction}>确认</button>
          </div>
        </Dialog>
      )}

      {showContactDialog && (
        <Dialog title="添加客户联系" onClose={() => setShowContactDialog(false)}>
          <p className="text-sm text-slate-600 mb-2">问题件 <strong>{p.trackingNumber}</strong> | 责任人：<strong>{p.responsiblePersonName}</strong></p>
          <div className="mb-3">
            <label className="text-xs text-slate-500 block mb-1">联系方式</label>
            <select value={contactType} onChange={(e) => setContactType(e.target.value as ContactType)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm">
              {(Object.entries(CONTACT_TYPE_LABELS) as [string, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="text-xs text-slate-500 block mb-1">客户回应</label>
            <textarea value={contactResponse} onChange={(e) => setContactResponse(e.target.value)} placeholder="客户反馈内容" className="w-full border border-slate-200 rounded px-3 py-2 text-sm" rows={3} />
          </div>
          <div className="mb-3">
            <label className="text-xs text-slate-500 block mb-1">备注</label>
            <input value={contactNotes} onChange={(e) => setContactNotes(e.target.value)} placeholder="联系备注" className="w-full border border-slate-200 rounded px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 mb-3 text-sm text-slate-600">
            <input type="checkbox" checked={contactFollowUp} onChange={(e) => setContactFollowUp(e.target.checked)} />
            需要后续跟进
          </label>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowContactDialog(false)} className="text-sm px-4 py-2 text-slate-600 border border-slate-200 rounded hover:bg-slate-50">取消</button>
            <button onClick={async () => { await createContact({ problemRecordId: p.id, trackingNumber: p.trackingNumber, contactType, contactPersonId: currentUser.id, contactPersonName: currentUser.name, contactPersonRole: currentUser.role, customerResponse: contactResponse, followUpRequired: contactFollowUp, notes: contactNotes }); setShowContactDialog(false); setContactResponse(''); setContactNotes(''); setContactFollowUp(false); }} className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[480px] max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
