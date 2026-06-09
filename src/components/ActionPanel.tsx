import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useReturnStore, type ReturnItemDetail, type ReturnLog } from '@/store/returnStore'
import { CheckCircle, XCircle, MessageSquare, FileText, AlertTriangle, ArrowLeftRight } from 'lucide-react'

interface ActionPanelProps {
  returnItem: ReturnItemDetail
  onAction: () => void
}

function findLatestRejection(logs: ReturnLog[]): ReturnLog | null {
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].action.includes('驳回')) return logs[i]
  }
  return null
}

export default function ActionPanel({ returnItem, onAction }: ActionPanelProps) {
  const user = useAuthStore((s) => s.user)
  const processReturn = useReturnStore((s) => s.processReturn)
  const createReview = useReturnStore((s) => s.createReview)
  const [remark, setRemark] = useState('')
  const [conclusion, setConclusion] = useState('')
  const [improvement, setImprovement] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!user) return null

  const handleProcess = async (action: string) => {
    setSubmitting(true)
    setError('')
    try {
      await processReturn(returnItem.id, action, remark.trim() || undefined)
      setRemark('')
      onAction()
    } catch (e: any) {
      setError(e.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReview = async () => {
    if (!conclusion.trim()) {
      setError('复盘结论不能为空')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createReview(returnItem.id, {
        conclusion: conclusion.trim(),
        improvement: improvement.trim() || undefined,
      })
      setConclusion('')
      setImprovement('')
      onAction()
    } catch (e: any) {
      setError(e.message || '复盘提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const { status, logs } = returnItem
  const latestRejection = findLatestRejection(logs)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        操作面板
      </h3>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      {latestRejection && ['已驳回-待补录', '已驳回-待客服补录'].includes(status) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1.5">
          <p className="text-sm font-medium text-red-700">
            驳回原因（{latestRejection.operatorName} · {latestRejection.operatorRole}）
          </p>
          <p className="text-sm text-red-600">{latestRejection.remark || '未填写原因'}</p>
          <p className="text-xs text-red-400">{latestRejection.createdAt}</p>
        </div>
      )}

      {status === '待派件员确认' && user.role === '派件员' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">确认说明</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="选填确认说明（如：已联系收件人确认）"
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400 resize-none"
            />
          </div>
          <button
            onClick={() => handleProcess('confirm')}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            确认退回
          </button>
        </div>
      )}

      {status === '待驿站认定' && user.role === '驿站负责人' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">处理备注</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="驳回时必须填写原因"
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleProcess('approve')}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              认定通过
            </button>
            <button
              onClick={() => {
                if (!remark.trim()) {
                  setError('驳回时必须填写原因')
                  return
                }
                handleProcess('reject')
              }}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              驳回
            </button>
          </div>
        </div>
      )}

      {status === '已驳回-待补录' && user.role === '派件员' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">补充说明</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请填写补充说明（必填）"
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!remark.trim()) {
                  setError('补充说明不能为空')
                  return
                }
                handleProcess('supplement')
              }}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              补充说明并重新提交
            </button>
            <button
              onClick={() => {
                if (!remark.trim()) {
                  setError('驳回至客服时必须填写原因')
                  return
                }
                handleProcess('reject-to-kefu')
              }}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
              驳回至客服
            </button>
          </div>
        </div>
      )}

      {status === '已驳回-待客服补录' && user.role === '客服' && (
        <div className="space-y-4">
          <div className="px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm">
            派件员已将此单驳回至客服，请补录信息后退回派件员重新确认
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">客服补录备注</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请填写补录信息（必填）"
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400 resize-none"
            />
          </div>
          <button
            onClick={() => {
              if (!remark.trim()) {
                setError('补录备注不能为空')
                return
              }
              handleProcess('supplement-kefu')
            }}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            补录并退回派件员
          </button>
        </div>
      )}

      {status === '退回处理完成' && user.role === '驿站负责人' && (
        <div className="space-y-4">
          <div className="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm">
            退回处理已完成，可发起责任复盘
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">复盘结论</label>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="请输入复盘结论"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">改进措施</label>
            <textarea
              value={improvement}
              onChange={(e) => setImprovement(e.target.value)}
              placeholder="选填改进措施"
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400 resize-none"
            />
          </div>
          <button
            onClick={handleReview}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            发起复盘
          </button>
        </div>
      )}

      {status === '复盘进行中' && user.role === '驿站负责人' && (
        <div className="space-y-4">
          <div className="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm">
            复盘进行中，追加复盘后将自动完成
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">追加复盘结论</label>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="请输入追加复盘结论"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">改进措施</label>
            <textarea
              value={improvement}
              onChange={(e) => setImprovement(e.target.value)}
              placeholder="选填改进措施"
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400 resize-none"
            />
          </div>
          <button
            onClick={handleReview}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            追加复盘（完成）
          </button>
        </div>
      )}

      {!['待派件员确认', '待驿站认定', '已驳回-待补录', '已驳回-待客服补录', '退回处理完成', '复盘进行中'].includes(status) && (
        <p className="text-sm text-slate-500">当前状态暂无可执行操作</p>
      )}

      {['待派件员确认', '待驿站认定', '已驳回-待补录', '已驳回-待客服补录'].includes(status) && (
        user.role !== (
          status === '待派件员确认' ? '派件员' :
          status === '待驿站认定' ? '驿站负责人' :
          status === '已驳回-待补录' ? '派件员' :
          '客服'
        )
      ) && !['退回处理完成', '复盘进行中'].includes(status) && (
        <p className="text-sm text-slate-400">
          当前需{
            status === '待派件员确认' ? '派件员' :
            status === '待驿站认定' ? '驿站负责人' :
            status === '已驳回-待补录' ? '派件员' :
            '客服'
          }操作
        </p>
      )}
    </div>
  )
}
