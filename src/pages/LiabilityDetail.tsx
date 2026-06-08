import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Link2, CheckCircle2, RotateCcw, FileText, MessageSquare } from 'lucide-react'
import clsx from 'clsx'
import { useAppState } from '@/context/AppContext'
import { evidenceData } from '@/data/mock'
import { SeverityBadge, CategoryBadge, LiabilityStatusBadge } from '@/components/Badges'
import SubmitDeterminationModal from '@/components/SubmitDeterminationModal'
import ReturnRedeterminationModal from '@/components/ReturnRedeterminationModal'
import AddEvidenceModal from '@/components/AddEvidenceModal'
import type { LiabilityParty, EvidenceSource } from '@/types'

export default function LiabilityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useAppState()
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [addEvidenceModalOpen, setAddEvidenceModalOpen] = useState(false)

  const record = state.liabilityRecords.find(r => r.id === id)

  if (!record) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-surface-500">未找到该责任认定记录</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/liability')}>返回列表</button>
      </div>
    )
  }

  const relatedDamage = state.damageRecords.find(d => d.id === record.damageId)
  const staticEvidence = evidenceData.filter(e => record.evidenceIds.includes(e.id))
  const userEvidence = relatedDamage
    ? relatedDamage.evidenceChain.filter(e => e.id.startsWith('ev-usr-'))
    : []
  const relatedEvidence = [...staticEvidence, ...userEvidence]

  function handleSubmitDetermination(data: { responsibleParty: LiabilityParty; responsibleDetail: string; basis: string }) {
    dispatch({
      type: 'SUBMIT_LIABILITY',
      payload: { id: record!.id, ...data },
    })
    setSubmitModalOpen(false)
  }

  function handleReturnLiability(data: { returnReason: string }) {
    dispatch({
      type: 'RETURN_LIABILITY',
      payload: { id: record!.id, ...data },
    })
    setReturnModalOpen(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button className="btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-surface-900">{record.id}</h1>
            <CategoryBadge category={record.category} />
            <SeverityBadge severity={record.severity} />
            <LiabilityStatusBadge status={record.status} />
          </div>
          <p className="text-sm text-surface-500 mt-0.5">
            运单 {record.awb} · {record.flightNo}
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => navigate(`/damage/${record.damageId}`)}
        >
          查看关联货损 →
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {record.status === '已退回' && record.returnReason && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-800">退回原因</span>
              </div>
              <p className="text-sm text-orange-700 leading-relaxed">{record.returnReason}</p>
              {record.abnormalNote && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <div className="text-xs font-semibold text-orange-800 mb-1">异常说明</div>
                  <p className="text-xs text-orange-700 leading-relaxed">{record.abnormalNote}</p>
                </div>
              )}
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-surface-800">责任认定详情</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <div className="text-xs font-medium text-surface-400 mb-1">责任方</div>
                <div className={clsx(
                  'inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold',
                  record.responsibleParty === '待定' ? 'bg-surface-100 text-surface-500' : 'bg-indigo-50 text-indigo-700'
                )}>
                  {record.responsibleParty}
                </div>
              </div>
              {record.responsibleDetail && (
                <div>
                  <div className="text-xs font-medium text-surface-400 mb-1">责任说明</div>
                  <p className="text-sm text-surface-700 leading-relaxed bg-surface-50 rounded-lg p-3">{record.responsibleDetail}</p>
                </div>
              )}
              {record.basis && (
                <div>
                  <div className="text-xs font-medium text-surface-400 mb-1">认定依据</div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    {record.basis.split('\n').map((line, i) => (
                      <p key={i} className="text-sm text-blue-800 leading-relaxed">{line}</p>
                    ))}
                  </div>
                </div>
              )}
              {record.compensationAmount && (
                <div>
                  <div className="text-xs font-medium text-surface-400 mb-1">赔偿金额</div>
                  <p className="text-lg font-bold text-red-600">¥ {record.compensationAmount.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {relatedEvidence.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-sm font-semibold text-surface-800">关联证据链</h2>
                <span className="text-xs text-surface-400">{relatedEvidence.length} 条</span>
              </div>
              <div className="divide-y divide-surface-100">
                {relatedEvidence.map(ev => (
                  <div key={ev.id} className="px-5 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-surface-100 text-surface-600">
                        {ev.type}
                      </span>
                      <span className="text-sm font-medium text-surface-800">{ev.title}</span>
                    </div>
                    <p className="text-sm text-surface-600 leading-relaxed">{ev.content}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-surface-400">
                      <span>{ev.timestamp}</span>
                      <span>{ev.operator}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-surface-800">判断依据</h2>
              <Link2 className="w-4 h-4 text-brand-500" />
            </div>
            <div className="card-body space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-800">证据完整性</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  {relatedEvidence.length >= 3
                    ? '证据链包含台账、现场和沟通三方记录，信息交叉验证充分'
                    : relatedEvidence.length >= 1
                      ? '证据链不完整，缺少部分关键证据，认定需谨慎'
                      : '尚无关联证据，无法进行责任认定'}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">争议识别</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  {record.abnormalNote || record.status === '已退回'
                    ? '存在争议点，各方陈述存在矛盾，需重点关注信息断层'
                    : '暂无争议，各方陈述一致'}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-800">认定逻辑</span>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  {record.responsibleParty === '待定'
                    ? '需先确认证据链完整性，再逐步排除各方责任'
                    : `已认定${record.responsibleParty}为责任方，基于证据链和排除法判断`}
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-800">信息断层</span>
                </div>
                <p className="text-xs text-purple-700 leading-relaxed">
                  {record.status === '已退回'
                    ? '退回记录表明原认定可能忽略了关键信息，需重新审视证据链'
                    : relatedEvidence.some(e => e.type === '沟通截图')
                      ? '已有沟通记录可交叉验证，注意各方陈述一致性'
                      : '缺少沟通截图，各方陈述无法交叉验证，存在信息断层风险'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-surface-800">认定操作</h2>
            </div>
            <div className="card-body space-y-2">
              {(record.status === '待认定' || record.status === '认定中') && (
                <button
                  className="btn-primary w-full justify-center"
                  onClick={() => setSubmitModalOpen(true)}
                >
                  提交认定结果
                </button>
              )}
              {record.status === '已退回' && (
                <button
                  className="btn-primary w-full justify-center"
                  onClick={() => setSubmitModalOpen(true)}
                >
                  重新认定
                </button>
              )}
              {record.status === '已认定' && (
                <button
                  className="btn-primary w-full justify-center"
                  onClick={() => setSubmitModalOpen(true)}
                >
                  更新认定
                </button>
              )}
              <button
                className="btn-secondary w-full justify-center"
                onClick={() => setAddEvidenceModalOpen(true)}
              >
                补充证据
              </button>
              {(record.status === '已认定' || record.status === '已退回') && (
                <button
                  className="btn-secondary w-full justify-center"
                  onClick={() => setReturnModalOpen(true)}
                >
                  退回重认
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-surface-800">认定信息</h2>
            </div>
            <div className="card-body space-y-3 text-sm">
              <div>
                <span className="text-surface-400">认定人</span>
                <p className="text-surface-800 font-medium mt-0.5">{record.determiner}</p>
              </div>
              {record.determinedAt && (
                <div>
                  <span className="text-surface-400">认定时间</span>
                  <p className="text-surface-800 font-medium mt-0.5">{record.determinedAt}</p>
                </div>
              )}
              <div>
                <span className="text-surface-400">创建时间</span>
                <p className="text-surface-800 font-medium mt-0.5">{record.createdAt}</p>
              </div>
              <div>
                <span className="text-surface-400">最后更新</span>
                <p className="text-surface-800 font-medium mt-0.5">{record.updatedAt}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SubmitDeterminationModal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSubmit={handleSubmitDetermination}
        currentParty={record.responsibleParty}
        currentDetail={record.responsibleDetail}
        currentBasis={record.basis}
      />

      <ReturnRedeterminationModal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        onSubmit={handleReturnLiability}
      />

      <AddEvidenceModal
        open={addEvidenceModalOpen}
        onClose={() => setAddEvidenceModalOpen(false)}
        onSubmit={(evidence: Omit<EvidenceSource, 'id'>) => {
          dispatch({
            type: 'ADD_EVIDENCE',
            payload: { liabilityId: record!.id, evidence },
          })
        }}
      />
    </div>
  )
}
