import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { api } from '@/api/client'
import type { Appointment, Exception } from '@/types'
import { STATUS_LABELS, EXCEPTION_TYPE_LABELS, SEVERITY_COLORS, ROLE_LABELS } from '@/types'
import type { UserRole } from '@/types'
import dayjs from 'dayjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  AlertTriangle,
  Calendar,
  ChevronRight,
  MessageSquareWarning,
  Receipt,
  HandCoins,
} from 'lucide-react'

const EXCEPTION_ICONS: Record<string, React.ReactNode> = {
  wording_mismatch: <MessageSquareWarning className="w-4 h-4" />,
  post_surgery_complaint: <Receipt className="w-4 h-4" />,
  installment_mismatch: <HandCoins className="w-4 h-4" />,
}

const SEVERITY_BORDER: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-yellow-400',
}

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [exceptions, setExceptions] = useState<Exception[]>([])
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [apts, excs] = await Promise.all([
        api.appointments.list(),
        api.exceptions.list(),
      ])
      setAppointments(apts)
      setExceptions(excs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const todayAppointments = appointments.filter((a) =>
    dayjs(a.appointment_time).isSame(dayjs(), 'day')
  )

  const pendingTasks = appointments.filter((a) => {
    if (!user) return false
    if (user.role === 'consultant') return a.status === 'pending' || a.status === 'in_consultation'
    if (user.role === 'assistant') return a.status === 'plan_submitted'
    if (user.role === 'service') return a.status === 'in_service' || a.status === 'plan_confirmed'
    return false
  })

  const getStatusDot = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-300',
      in_consultation: 'bg-blue-400',
      plan_submitted: 'bg-[#2BA88C]',
      plan_confirmed: 'bg-emerald-500',
      in_service: 'bg-purple-400',
      completed: 'bg-gray-400',
    }
    return colors[status] || 'bg-gray-300'
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-[#9CA3AF]">加载中...</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">工作台</h1>
            <p className="text-sm text-[#9CA3AF] mt-0.5">
              {dayjs().format('YYYY年M月D日 dddd')} · {ROLE_LABELS[user?.role || 'consultant']}视角
            </p>
          </div>
        </div>

        {exceptions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-[#1A1A1A]">异常预警</h2>
              <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                {exceptions.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatePresence>
                {exceptions.map((exc, i) => (
                  <motion.div
                    key={exc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/appointment/${exc.appointment_id}`)}
                    className={`border-l-4 ${SEVERITY_BORDER[exc.severity]} bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-all`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[exc.severity]}`} />
                        <span className="text-xs text-[#6B7280]">{EXCEPTION_TYPE_LABELS[exc.type]}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#9CA3AF]">
                        {EXCEPTION_ICONS[exc.type]}
                      </div>
                    </div>
                    <div className="mt-2 text-sm font-medium text-[#1A1A1A] line-clamp-1">{exc.title}</div>
                    <div className="mt-1 text-xs text-[#6B7280] line-clamp-1">{exc.description}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#9CA3AF]">
                      <span>{exc.patient_name || '关联患者'}</span>
                      <span>·</span>
                      <span>{dayjs(exc.created_at).format('HH:mm')}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#2BA88C]" />
            <h2 className="text-sm font-semibold text-[#1A1A1A]">今日预约</h2>
            <span className="px-1.5 py-0.5 rounded-full bg-[#2BA88C]/10 text-[#2BA88C] text-xs font-medium">
              {todayAppointments.length}
            </span>
          </div>
          <div className="space-y-0">
            <AnimatePresence>
              {todayAppointments.map((apt, i) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/appointment/${apt.id}`)}
                  className="flex items-center gap-4 p-3 bg-white rounded-lg mb-2 cursor-pointer hover:shadow-sm transition-all group"
                >
                  <div className="text-sm font-mono text-[#6B7280] w-16 flex-shrink-0">
                    {dayjs(apt.appointment_time).format('HH:mm')}
                  </div>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusDot(apt.status) === 'bg-gray-300' ? '#D1D5DB' : apt.status === 'in_consultation' ? '#60A5FA' : apt.status === 'plan_submitted' ? '#2BA88C' : apt.status === 'plan_confirmed' ? '#10B981' : apt.status === 'in_service' ? '#A78BFA' : '#9CA3AF' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1A1A1A]">{apt.patient_name}</span>
                      <span className="px-1.5 py-0.5 rounded text-xs bg-[#F3F4F6] text-[#6B7280]">
                        {STATUS_LABELS[apt.status]}
                      </span>
                    </div>
                    <div className="text-xs text-[#9CA3AF] mt-0.5">
                      {apt.tags && apt.tags.length > 0 && apt.tags.map((tag: string) => (
                        <span key={tag} className="inline-block mr-1.5 px-1.5 py-0 rounded bg-[#2BA88C]/10 text-[#2BA88C]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#2BA88C] transition-colors" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-[#1A1A1A]">待处理任务</h2>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
              {pendingTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {pendingTasks.map((apt, i) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/appointment/${apt.id}`)}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:shadow-sm transition-all group"
                >
                  <div className="w-1.5 h-8 rounded-full bg-amber-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#1A1A1A]">{apt.patient_name}</div>
                    <div className="text-xs text-[#6B7280]">{STATUS_LABELS[apt.status]} · {dayjs(apt.appointment_time).format('HH:mm')}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#2BA88C] transition-colors" />
                </motion.div>
              ))}
            </AnimatePresence>
            {pendingTasks.length === 0 && (
              <div className="text-center py-8 text-sm text-[#9CA3AF]">暂无待处理任务</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
