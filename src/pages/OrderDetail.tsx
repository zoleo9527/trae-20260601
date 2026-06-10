import { advanceOrder, fetchOrderDetail, reviewOrder } from '@/api/client'
import CheckInPanel from '@/components/CheckInPanel'
import NoteSection from '@/components/NoteSection'
import Timeline from '@/components/Timeline'
import { useStore } from '@/store'
import type { OrderDetail as OrderDetailType, Role } from '@/types'
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Loader2,
    MapPin,
    User,
    Wrench,
    XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: '待签到', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  checked_in: { label: '已签到', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  reviewing: { label: '审核中', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  completed: { label: '已完成', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: '已退回', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
}

const typeLabels: Record<string, string> = {
  routine: '日常维保',
  quarterly: '季度维保',
  annual: '年度维保',
}

const roleLabels: Record<Role, string> = {
  technician: '维保技师',
  service: '客服',
  supervisor: '项目主管',
}

const roleColors: Record<Role, string> = {
  technician: 'text-blue-600',
  service: 'text-emerald-600',
  supervisor: 'text-orange-600',
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentRole = useStore((s) => s.currentRole)

  const [order, setOrder] = useState<OrderDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadOrder = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await fetchOrderDetail(id)
      setOrder(data)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  const handleAdvance = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      await advanceOrder(id)
      await loadOrder()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReview = async (approved: boolean) => {
    if (!id) return
    setActionLoading(true)
    try {
      await reviewOrder(id, approved)
      await loadOrder()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const getStuckPoint = (order: OrderDetailType) => {
    if (order.status === 'pending') return '未到场签到'
    if (order.status === 'checked_in') return order.checkinAnomaly ? '异常待客服跟进' : '待客服跟进确认'
    if (order.status === 'reviewing') return '待项目主管审核'
    if (order.status === 'rejected') return '审核退回，待客服重新跟进'
    return '已完成'
  }

  const getBlockReason = (order: OrderDetailType) => {
    if (order.status === 'pending') return '技师未到场，维保未开始'
    if (order.status === 'checked_in') {
      if (order.checkinAnomaly) {
        return `发现异常：${order.checkinAnomalyDesc || '需跟进处理'}`
      }
      return '客服需确认维保完成后提交审核'
    }
    if (order.status === 'reviewing') return '主管未审核，流程未闭环'
    if (order.status === 'rejected') return '主管审核退回，需重新跟进'
    return '维保已完成，流程闭环'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-rose-500 text-sm">{error}</p>
        <button
          onClick={() => navigate('/orders')}
          className="text-amber-600 text-sm font-medium hover:underline"
        >
          返回列表
        </button>
      </div>
    )
  }

  if (!order) return null

  const sc = statusConfig[order.status] || statusConfig.pending

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* 返回 + 标题 */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/orders')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="text-sm text-slate-500">工单详情</div>
          <h2 className="text-lg font-bold text-slate-900">
            {order.elevatorNo} · {typeLabels[order.maintenanceType]}
          </h2>
        </div>
        <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${sc.bg} ${sc.text}`}>
          {sc.label}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* 三问定位卡 */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-1 text-xs font-medium text-blue-700">① 谁在处理？</div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${sc.dot}`} />
            <span className={`text-lg font-bold ${
              order.status === 'completed' ? 'text-emerald-600' :
              order.status === 'rejected' ? 'text-rose-600' :
              roleColors[order.currentHandler as Role]
            }`}>
              {order.status === 'completed' ? '流程已闭环' :
               order.status === 'rejected' ? '退回重跟进' :
               roleLabels[order.currentHandler as Role]}
            </span>
          </div>
          <div className="mt-1 text-xs text-blue-600">
            执行技师：{order.assignedTechnician}
          </div>
          {order.currentHandler === currentRole && order.status !== 'completed' && order.status !== 'rejected' && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-blue-700">
              <CheckCircle2 className="h-3 w-3" />
              当前登录角色负责
            </div>
          )}
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-1 text-xs font-medium text-amber-700">② 卡在哪里？</div>
          <div className="text-lg font-bold text-amber-800">
            {getStuckPoint(order)}
          </div>
          <div className="mt-1 text-xs text-amber-600">
            当前状态：{sc.label}
          </div>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <div className="mb-1 text-xs font-medium text-rose-700">③ 为什么没完成？</div>
          <div className="text-sm font-medium text-rose-800">
            {getBlockReason(order)}
          </div>
          {order.checkinAnomaly && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-rose-600">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{order.checkinAnomalyDesc}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* 左侧：基本信息 + 操作 */}
        <div className="col-span-2 space-y-4">
          {/* 基本信息 */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">基本信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-400 text-xs mb-1">工单编号</div>
                <div className="font-medium text-slate-700">{order.id}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-1">维保类型</div>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{typeLabels[order.maintenanceType]}</span>
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-slate-400 text-xs mb-1">电梯地址</div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-slate-700">{order.elevatorAddress}</span>
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-1">计划日期</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{order.plannedDate}</span>
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-1">执行技师</div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{order.assignedTechnician}</span>
                </div>
              </div>
              {order.checkinTime && (
                <div>
                  <div className="text-slate-400 text-xs mb-1">签到时间</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">{order.checkinTime}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 签到面板（技师待签到时显示） */}
          {currentRole === 'technician' && order.status === 'pending' && (
            <CheckInPanel orderId={order.id} onCheckin={loadOrder} />
          )}

          {/* 客服推进按钮 */}
          {currentRole === 'service' && order.status === 'checked_in' && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
              <div className="mb-3 text-sm font-semibold text-blue-800">
                客服跟进
              </div>
              <p className="mb-3 text-sm text-blue-600">
                {order.checkinAnomaly
                  ? '该工单签到时发现异常，请跟进处理完毕后提交审核。'
                  : '确认维保已完成，提交主管审核。'}
              </p>
              <button
                onClick={handleAdvance}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? '提交中…' : '提交审核'}
              </button>
            </div>
          )}

          {/* 主管审核按钮 */}
          {currentRole === 'supervisor' && order.status === 'reviewing' && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-5">
              <div className="mb-3 text-sm font-semibold text-purple-800">
                主管审核
              </div>
              <p className="mb-3 text-sm text-purple-600">
                请审核维保记录，确认无误后通过，有问题退回客服跟进。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleReview(true)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  审核通过
                </button>
                <button
                  onClick={() => handleReview(false)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  审核退回
                </button>
              </div>
            </div>
          )}

          {/* 已完成/已退回提示 */}
          {(order.status === 'completed' || order.status === 'rejected') && (
            <div className={`rounded-lg border p-5 ${
              order.status === 'completed'
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-rose-200 bg-rose-50'
            }`}>
              <div className="flex items-center gap-2">
                {order.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-500" />
                )}
                <span className={`text-sm font-semibold ${
                  order.status === 'completed' ? 'text-emerald-800' : 'text-rose-800'
                }`}>
                  {order.status === 'completed' ? '维保已完成，流程已闭环' : '审核已退回，需重新跟进'}
                </span>
              </div>
            </div>
          )}

          {/* 操作记录 */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">状态流转历史</h3>
            <Timeline events={order.timeline} />
          </div>
        </div>

        {/* 右侧：备注 */}
        <div className="col-span-1">
          <NoteSection
            notes={order.notes}
            orderId={order.id}
            currentRole={currentRole}
            onNoteAdded={loadOrder}
          />
        </div>
      </div>
    </div>
  )
}
