import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import type { AppointmentDetail, Exception, PlanConfirmationStep, Appointment } from '@/types'
import { STATUS_LABELS, EXCEPTION_TYPE_LABELS, ROLE_LABELS } from '@/types'
import dayjs from 'dayjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Phone,
  User as UserIcon,
  Tag,
  Calendar,
  FileText,
  ClipboardList,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Send,
  Clock,
  HandCoins,
  CheckCircle,
} from 'lucide-react'
import ExceptionDrawer from '@/components/ExceptionDrawer'

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [data, setData] = useState<AppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [confirmingStep, setConfirmingStep] = useState<string | null>(null)
  const [stepNote, setStepNote] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedException, setSelectedException] = useState<Exception | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    notes: true,
    plan: true,
    visits: true,
    steps: true,
  })
  const noteInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (id) loadDetail()
  }, [id])

  const loadDetail = async () => {
    if (!id) return
    try {
      const detail = await api.appointments.detail(id)
      setData(detail)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return
    setAddingNote(true)
    try {
      await api.notes.create(id, newNote.trim())
      setNewNote('')
      await loadDetail()
    } catch (err) {
      console.error(err)
    } finally {
      setAddingNote(false)
    }
  }

  const handleConfirmStep = async (step: PlanConfirmationStep) => {
    setConfirmingStep(step.id)
    try {
      const result = await api.plans.confirmStep(step.id, stepNote || undefined)
      setStepNote('')
      if (data && result.appointment) {
        setData({
          ...data,
          appointment: result.appointment as Appointment,
          confirmationSteps: result.steps,
        })
      } else {
        await loadDetail()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setConfirmingStep(null)
    }
  }

  const openExceptionDrawer = (exc: Exception) => {
    setSelectedException(exc)
    setDrawerOpen(true)
  }

  const handleExceptionResolved = () => {
    setDrawerOpen(false)
    setSelectedException(null)
    loadDetail()
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-[#9CA3AF]">加载中...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-[#9CA3AF]">预约不存在</div>
      </div>
    )
  }

  const { appointment, exceptions, plans, consultationNotes, visitRecords, confirmationSteps, installmentPlan } = data
  const openExceptions = exceptions.filter((e) => e.status !== 'resolved')
  const currentStep = confirmationSteps.find((s) => s.status === 'current')
  const isCurrentUserStep = currentStep && user && currentStep.role === user.role
  const allStepsCompleted = confirmationSteps.every((s) => s.status === 'completed')

  return (
    <div className="h-full overflow-auto relative">
      <div className="max-w-4xl mx-auto p-6 space-y-4 pb-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg hover:bg-[#F3F4F6] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#1A1A1A]">{appointment.patient_name}</h1>
            <p className="text-xs text-[#9CA3AF]">
              面诊预约 ·
              <span className={`ml-1 ${appointment.status === 'completed' ? 'text-[#2BA88C]' : 'text-[#1A1A1A]'}`}>
                {STATUS_LABELS[appointment.status]}
              </span>
            </p>
          </div>
          {openExceptions.length > 0 && (
            <button
              onClick={() => openExceptionDrawer(openExceptions[0])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm hover:bg-red-100 transition-colors animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {openExceptions.length}项异常
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E5E7EB]/60">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#2BA88C]/10 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-[#2BA88C]" />
              </div>
              <div>
                <div className="text-xs text-[#9CA3AF]">姓名</div>
                <div className="text-sm font-medium text-[#1A1A1A]">{appointment.patient_name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#2BA88C]/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-[#2BA88C]" />
              </div>
              <div>
                <div className="text-xs text-[#9CA3AF]">电话</div>
                <div className="text-sm font-mono text-[#1A1A1A]">{appointment.patient_phone}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#2BA88C]/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#2BA88C]" />
              </div>
              <div>
                <div className="text-xs text-[#9CA3AF]">预约时间</div>
                <div className="text-sm text-[#1A1A1A]">{dayjs(appointment.appointment_time).format('M月D日 HH:mm')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#2BA88C]/10 flex items-center justify-center">
                <Tag className="w-4 h-4 text-[#2BA88C]" />
              </div>
              <div>
                <div className="text-xs text-[#9CA3AF]">标签</div>
                <div className="flex gap-1 flex-wrap">
                  {appointment.tags && appointment.tags.length > 0 ? appointment.tags.map((tag: string) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-[#2BA88C]/10 text-[#2BA88C]">{tag}</span>
                  )) : <span className="text-sm text-[#6B7280]">-</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB]/60 overflow-hidden">
          <button
            onClick={() => toggleSection('steps')}
            className="w-full flex items-center justify-between p-4 hover:bg-[#FAFAF8] transition-colors"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#2BA88C]" />
              <span className="text-sm font-semibold text-[#1A1A1A]">方案确认 · 接力流程</span>
              {currentStep && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#2BA88C]/10 text-[#2BA88C] text-xs font-medium">
                  当前: {currentStep.label}
                </span>
              )}
              {allStepsCompleted && (
                <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  已完成
                </span>
              )}
            </div>
            {expandedSections.steps ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
          </button>
          <AnimatePresence>
            {expandedSections.steps && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  <div className="flex items-start gap-0">
                    {confirmationSteps.map((step, idx) => (
                      <div key={step.id} className="flex-1 flex items-start">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                            step.status === 'completed'
                              ? 'bg-[#2BA88C] text-white'
                              : step.status === 'current'
                              ? 'bg-[#2BA88C]/20 text-[#2BA88C] ring-2 ring-[#2BA88C]/40'
                              : 'bg-[#F3F4F6] text-[#9CA3AF]'
                          }`}>
                            {step.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : step.status === 'current' ? (
                              <span className="font-bold">{idx + 1}</span>
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </div>
                          <div className="mt-2 text-center">
                            <div className={`text-xs font-medium ${
                              step.status === 'completed' ? 'text-[#2BA88C]' : step.status === 'current' ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'
                            }`}>
                              {step.label}
                            </div>
                            <div className="text-xs text-[#9CA3AF]">{ROLE_LABELS[step.role]}</div>
                            {step.role === 'consultant' && <div className="text-[10px] text-[#9CA3AF] mt-0.5">@张咨询师</div>}
                            {step.role === 'assistant' && <div className="text-[10px] text-[#9CA3AF] mt-0.5">@李医生助理</div>}
                            {step.role === 'service' && <div className="text-[10px] text-[#9CA3AF] mt-0.5">@王客服</div>}
                          </div>
                          {step.status === 'completed' && step.completed_at && (
                            <div className="mt-1 text-xs text-[#9CA3AF]">
                              {dayjs(step.completed_at).format('HH:mm')}
                            </div>
                          )}
                          {step.status === 'completed' && step.note && (
                            <div className="mt-0.5 text-xs text-[#6B7280] max-w-[120px] truncate">
                              {step.note}
                            </div>
                          )}
                        </div>
                        {idx < confirmationSteps.length - 1 && (
                          <div className={`h-0.5 w-full mt-[18px] flex-shrink-0 ${
                            step.status === 'completed' ? 'bg-[#2BA88C]' : 'bg-[#E5E7EB]'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {currentStep && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-5 p-4 rounded-lg border ${
                        isCurrentUserStep
                          ? 'bg-[#2BA88C]/5 border-[#2BA88C]/20'
                          : 'bg-[#F9FAFB] border-[#E5E7EB]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-2 h-2 rounded-full ${isCurrentUserStep ? 'bg-[#2BA88C]' : 'bg-[#9CA3AF]'}`} />
                        <span className="text-sm font-medium text-[#1A1A1A]">
                          {currentStep.label}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-xs bg-[#2BA88C]/10 text-[#2BA88C]">
                          {ROLE_LABELS[currentStep.role]}
                        </span>
                        {!isCurrentUserStep && (
                          <span className="ml-auto text-xs text-[#9CA3AF]">
                            等待{ROLE_LABELS[currentStep.role]}处理
                          </span>
                        )}
                      </div>

                      {isCurrentUserStep && (
                        <>
                          <div className="text-xs text-[#6B7280] mb-3">
                            确认后将自动推进至下一步，并同步更新预约状态为「{STATUS_LABELS[{
                              1: 'plan_submitted',
                              2: 'plan_confirmed',
                              3: 'completed',
                            }[currentStep.step] as keyof typeof STATUS_LABELS]}」
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={stepNote}
                              onChange={(e) => setStepNote(e.target.value)}
                              placeholder="添加确认备注（可选）..."
                              className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2BA88C]/30 focus:border-[#2BA88C]"
                            />
                            <button
                              onClick={() => handleConfirmStep(currentStep)}
                              disabled={confirmingStep === currentStep.id}
                              className="px-5 py-2 bg-[#2BA88C] text-white rounded-lg text-sm font-medium hover:bg-[#249577] transition-colors disabled:opacity-60 flex items-center gap-1.5"
                            >
                              {confirmingStep === currentStep.id ? (
                                '处理中...'
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  确认完成
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}

                      {!isCurrentUserStep && (
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-[#E5E7EB]">
                          <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs text-[#6B7280] font-medium">
                            {currentStep.role === 'consultant' ? '咨' : currentStep.role === 'assistant' ? '助' : '客'}
                          </div>
                          <div className="text-xs text-[#6B7280]">
                            此步骤需要
                            <span className="font-medium text-[#1A1A1A]">
                              {ROLE_LABELS[currentStep.role]}
                            </span>
                            角色处理，请切换账号后操作
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {allStepsCompleted && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 rounded-lg bg-green-50 border border-green-100 flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <div>
                        <div className="text-sm font-medium text-green-700">方案确认流程已完成</div>
                        <div className="text-xs text-green-600">所有步骤已确认，预约已标记为「已完成」</div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {exceptions.length > 0 && (
          <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-700">异常标记</span>
                {openExceptions.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                    {openExceptions.length}项待处理
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {exceptions.map((exc) => (
                <button
                  key={exc.id}
                  onClick={() => openExceptionDrawer(exc)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-all ${
                    exc.status === 'resolved'
                      ? 'bg-white opacity-60'
                      : 'bg-white hover:shadow-sm border-l-3 border-l-red-500'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    exc.severity === 'high' ? 'bg-red-500' : exc.severity === 'medium' ? 'bg-amber-500' : 'bg-yellow-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#1A1A1A] line-clamp-1">{exc.title}</div>
                    <div className="text-xs text-[#6B7280]">{EXCEPTION_TYPE_LABELS[exc.type]}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    exc.status === 'open' ? 'bg-red-100 text-red-700' :
                    exc.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {exc.status === 'open' ? '待处理' : exc.status === 'processing' ? '处理中' : '已解决'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9CA3AF] -rotate-90" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-[#E5E7EB]/60 overflow-hidden">
          <button
            onClick={() => toggleSection('notes')}
            className="w-full flex items-center justify-between p-4 hover:bg-[#FAFAF8] transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#2BA88C]" />
              <span className="text-sm font-semibold text-[#1A1A1A]">咨询记录</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] text-xs">
                {consultationNotes.length}
              </span>
            </div>
            {expandedSections.notes ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
          </button>
          <AnimatePresence>
            {expandedSections.notes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  {consultationNotes.map((note) => (
                    <div key={note.id} className="relative pl-6 pb-3 border-l-2 border-[#E5E7EB] last:border-l-0 last:pb-0">
                      <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-[#2BA88C]" />
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[#1A1A1A]">{note.author_name}</span>
                        <span className="px-1.5 py-0 rounded text-xs bg-[#F3F4F6] text-[#6B7280]">{ROLE_LABELS[note.author_role as 'consultant' | 'assistant' | 'service']}</span>
                        <span className="text-xs text-[#9CA3AF]">{dayjs(note.created_at).format('HH:mm')}</span>
                      </div>
                      <p className="text-sm text-[#374151] leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-3">
                    <input
                      ref={noteInputRef}
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                      placeholder="添加备注..."
                      className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2BA88C]/30 focus:border-[#2BA88C]"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={addingNote || !newNote.trim()}
                      className="px-3 py-2 bg-[#2BA88C] text-white rounded-lg hover:bg-[#249577] transition-colors disabled:opacity-60"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB]/60 overflow-hidden">
          <button
            onClick={() => toggleSection('plan')}
            className="w-full flex items-center justify-between p-4 hover:bg-[#FAFAF8] transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2BA88C]" />
              <span className="text-sm font-semibold text-[#1A1A1A]">方案报价单</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] text-xs">
                {plans.length}
              </span>
            </div>
            {expandedSections.plan ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
          </button>
          <AnimatePresence>
            {expandedSections.plan && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4">
                  {plans.map((plan) => (
                    <div key={plan.id} className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-[#FAFAF8]">
                        <span className="text-xs font-medium text-[#6B7280]">
                          方案 · {dayjs(plan.created_at).format('HH:mm')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          plan.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          plan.status === 'submitted' ? 'bg-[#2BA88C]/10 text-[#2BA88C]' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {plan.status === 'draft' ? '草稿' : plan.status === 'submitted' ? '已提交' : plan.status === 'confirmed' ? '已确认' : '已归档'}
                        </span>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-t border-[#E5E7EB]">
                            <th className="text-left px-3 py-2 text-xs text-[#9CA3AF] font-medium">项目</th>
                            <th className="text-left px-3 py-2 text-xs text-[#9CA3AF] font-medium">部位</th>
                            <th className="text-right px-3 py-2 text-xs text-[#9CA3AF] font-medium">单价</th>
                            <th className="text-right px-3 py-2 text-xs text-[#9CA3AF] font-medium">小计</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.items.map((item, idx) => (
                            <tr key={idx} className="border-t border-[#F3F4F6] hover:bg-[#FAFAF8]">
                              <td className="px-3 py-2">
                                <div className="text-[#1A1A1A]">{item.name}</div>
                                {item.note && <div className="text-xs text-[#9CA3AF]">{item.note}</div>}
                              </td>
                              <td className="px-3 py-2 text-[#6B7280]">{item.area}</td>
                              <td className="px-3 py-2 text-right font-mono text-[#6B7280]">¥{item.unitPrice.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right font-mono text-[#1A1A1A]">¥{item.subtotal.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="border-t border-[#E5E7EB] px-3 py-2 bg-[#FAFAF8] flex items-center justify-between">
                        <div className="text-xs text-[#9CA3AF]">
                          {plan.discount > 0 && `优惠 -¥${plan.discount.toLocaleString()}`}
                        </div>
                        <div className="text-base font-bold text-[#1A1A1A] font-mono">
                          ¥{plan.final_price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {visitRecords.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E5E7EB]/60 overflow-hidden">
            <button
              onClick={() => toggleSection('visits')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#FAFAF8] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2BA88C]" />
                <span className="text-sm font-semibold text-[#1A1A1A]">术后回访</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] text-xs">
                  {visitRecords.length}
                </span>
              </div>
              {expandedSections.visits ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
            </button>
            <AnimatePresence>
              {expandedSections.visits && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3">
                    {visitRecords.map((record) => (
                      <div key={record.id} className="p-3 border border-[#E5E7EB] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-[#6B7280]">
                            {record.visitor_name} · {dayjs(record.visit_date).format('M月D日')}
                          </span>
                          <div className="flex items-center gap-2">
                            {record.has_complaint && (
                              <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700">有投诉</span>
                            )}
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    i < record.satisfaction ? 'bg-[#2BA88C]' : 'bg-[#E5E7EB]'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-[#374151]">{record.content}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {installmentPlan && (
          <div className="bg-white rounded-xl border border-[#E5E7EB]/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <HandCoins className="w-4 h-4 text-[#2BA88C]" />
              <span className="text-sm font-semibold text-[#1A1A1A]">分期计划</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#2BA88C]/10 text-[#2BA88C] text-xs">
                {installmentPlan.total_periods}期
              </span>
            </div>
            <div className="space-y-2">
              {installmentPlan.items.map((item) => (
                <div key={item.id} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${
                  item.actual_amount !== null && item.actual_amount !== item.planned_amount
                    ? 'bg-red-50'
                    : 'bg-[#FAFAF8]'
                }`}>
                  <span className="text-xs text-[#9CA3AF] w-16">第{item.period}期</span>
                  <span className="font-mono text-[#1A1A1A] w-24">计划 ¥{item.planned_amount.toLocaleString()}</span>
                  <span className="font-mono w-24">
                    {item.actual_amount !== null ? `实付 ¥${item.actual_amount.toLocaleString()}` : '未支付'}
                  </span>
                  {item.actual_amount !== null && item.actual_amount !== item.planned_amount && (
                    <span className="text-xs text-red-600 font-medium">
                      差 ¥{(item.actual_amount - item.planned_amount).toLocaleString()}
                    </span>
                  )}
                  <span className={`ml-auto px-1.5 py-0.5 rounded text-xs ${
                    item.status === 'paid' ? 'bg-green-100 text-green-700' :
                    item.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {item.status === 'paid' ? '已付' : item.status === 'partial' ? '部分' : '待付'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ExceptionDrawer
        isOpen={drawerOpen}
        exception={selectedException}
        onClose={() => { setDrawerOpen(false); setSelectedException(null) }}
        onResolved={handleExceptionResolved}
      />
    </div>
  )
}
