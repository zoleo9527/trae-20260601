import { useState } from 'react'
import { api } from '@/api/client'
import type { Exception, WordingMismatchDetails, PostSurgeryComplaintDetails, InstallmentMismatchDetails } from '@/types'
import { EXCEPTION_TYPE_LABELS } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import {
  X,
  MessageSquareWarning,
  Receipt,
  HandCoins,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Play,
} from 'lucide-react'

interface ExceptionDrawerProps {
  isOpen: boolean
  exception: Exception | null
  onClose: () => void
  onResolved: () => void
}

function isWordingMismatch(d: any): d is WordingMismatchDetails {
  return d && typeof d.consultantWording === 'string' && typeof d.doctorWording === 'string'
}

function isPostSurgeryComplaint(d: any): d is PostSurgeryComplaintDetails {
  return d && typeof d.complaintContent === 'string' && typeof d.relatedProject === 'string'
}

function isInstallmentMismatch(d: any): d is InstallmentMismatchDetails {
  return d && Array.isArray(d.plannedInstallments) && Array.isArray(d.differenceItems)
}

export default function ExceptionDrawer({ isOpen, exception, onClose, onResolved }: ExceptionDrawerProps) {
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)
  const [startingProcess, setStartingProcess] = useState(false)

  if (!exception) return null

  const handleStartProcessing = async () => {
    setStartingProcess(true)
    try {
      await api.exceptions.update(exception.id, 'processing')
      onResolved()
    } catch (err) {
      console.error(err)
    } finally {
      setStartingProcess(false)
    }
  }

  const handleResolve = async () => {
    setResolving(true)
    try {
      await api.exceptions.update(exception.id, 'resolved', resolveNote || '已处理')
      setResolveNote('')
      onResolved()
    } catch (err) {
      console.error(err)
    } finally {
      setResolving(false)
    }
  }

  const details = exception.details

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed right-0 top-0 bottom-0 w-[480px] max-w-full bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  exception.type === 'wording_mismatch' ? 'bg-blue-100 text-blue-600' :
                  exception.type === 'post_surgery_complaint' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {exception.type === 'wording_mismatch' && <MessageSquareWarning className="w-4 h-4" />}
                  {exception.type === 'post_surgery_complaint' && <Receipt className="w-4 h-4" />}
                  {exception.type === 'installment_mismatch' && <HandCoins className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1A1A1A]">{EXCEPTION_TYPE_LABELS[exception.type]}</div>
                  <div className="text-xs text-[#9CA3AF]">
                    {exception.severity === 'high' ? '高优先级' : exception.severity === 'medium' ? '中优先级' : '低优先级'}
                    {' · '}
                    {exception.status === 'open' ? '待处理' : exception.status === 'processing' ? '处理中' : '已解决'}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F3F4F6] transition-colors">
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-5">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A] mb-1">{exception.title}</h3>
                <p className="text-sm text-[#6B7280]">{exception.description}</p>
                <div className="text-xs text-[#9CA3AF] mt-2">
                  创建于 {dayjs(exception.created_at).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>

              {exception.status === 'open' && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    待处理异常
                  </div>
                  <p className="text-xs text-amber-600">点击下方按钮开始处理此异常</p>
                </div>
              )}

              {exception.status === 'processing' && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    正在处理
                  </div>
                  <p className="text-xs text-blue-600">请在确认处理完成后填写处理备注并标记为已解决</p>
                </div>
              )}

              {isWordingMismatch(details) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    冲突内容对比
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <div className="text-xs font-medium text-blue-700 mb-1.5">咨询师口径</div>
                      <p className="text-sm text-[#1A1A1A]">{details.consultantWording}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                      <div className="text-xs font-medium text-purple-700 mb-1.5">医生口径</div>
                      <p className="text-sm text-[#1A1A1A]">{details.doctorWording}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                    <div className="text-xs font-medium text-red-700 mb-1">冲突项</div>
                    <div className="flex flex-wrap gap-1.5">
                      {details.conflictItems.map((item, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-medium">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isPostSurgeryComplaint(details) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    投诉详情
                  </h4>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-sm text-[#1A1A1A]">{details.complaintContent}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E7EB]">
                      <div className="text-xs text-[#9CA3AF]">关联项目</div>
                      <div className="text-sm font-medium text-[#1A1A1A] mt-0.5">{details.relatedProject}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E5E7EB]">
                      <div className="text-xs text-[#9CA3AF]">手术日期</div>
                      <div className="text-sm font-medium text-[#1A1A1A] mt-0.5">{details.surgeryDate}</div>
                    </div>
                  </div>
                </div>
              )}

              {isInstallmentMismatch(details) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    分期对账
                  </h4>
                  <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#FAFAF8]">
                          <th className="text-left px-3 py-2 text-xs text-[#9CA3AF] font-medium">期数</th>
                          <th className="text-right px-3 py-2 text-xs text-[#9CA3AF] font-medium">计划金额</th>
                          <th className="text-right px-3 py-2 text-xs text-[#9CA3AF] font-medium">实付金额</th>
                          <th className="text-right px-3 py-2 text-xs text-[#9CA3AF] font-medium">差异</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.plannedInstallments.map((plan) => {
                          const actual = details.actualPayments.find((p) => p.period === plan.period)
                          const diff = details.differenceItems.find((d) => d.period === plan.period)
                          const hasDiff = !!diff
                          return (
                            <tr key={plan.period} className={`border-t border-[#E5E7EB] ${hasDiff ? 'bg-red-50' : ''}`}>
                              <td className="px-3 py-2">第{plan.period}期</td>
                              <td className="px-3 py-2 text-right font-mono">¥{plan.plannedAmount.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right font-mono">
                                {actual ? `¥${actual.paidAmount.toLocaleString()}` : '-'}
                              </td>
                              <td className={`px-3 py-2 text-right font-mono ${hasDiff ? 'text-red-600 font-medium' : 'text-[#9CA3AF]'}`}>
                                {diff ? `¥${diff.difference.toLocaleString()}` : '-'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {exception.status === 'resolved' && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium mb-1">
                    <CheckCircle className="w-4 h-4" />
                    已解决
                  </div>
                  {exception.resolve_note && (
                    <p className="text-sm text-green-600">{exception.resolve_note}</p>
                  )}
                </div>
              )}
            </div>

            {exception.status === 'open' && (
              <div className="border-t border-[#E5E7EB] p-5">
                <button
                  onClick={handleStartProcessing}
                  disabled={startingProcess}
                  className="w-full py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {startingProcess ? '操作中...' : '开始处理'}
                </button>
              </div>
            )}

            {exception.status === 'processing' && (
              <div className="border-t border-[#E5E7EB] p-5">
                <div className="mb-3">
                  <label className="block text-xs text-[#6B7280] mb-1.5">处理备注</label>
                  <textarea
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    placeholder="请描述处理结果..."
                    rows={3}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2BA88C]/30 focus:border-[#2BA88C] resize-none"
                  />
                </div>
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="w-full py-2.5 bg-[#2BA88C] text-white rounded-lg text-sm font-medium hover:bg-[#249577] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {resolving ? '处理中...' : '标记为已解决'}
                </button>
              </div>
            )}

            {exception.status === 'resolved' && (
              <div className="border-t border-[#E5E7EB] p-5">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-[#F3F4F6] text-[#6B7280] rounded-lg text-sm font-medium hover:bg-[#E5E7EB] transition-colors"
                >
                  关闭
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
