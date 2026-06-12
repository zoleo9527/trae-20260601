import Card from '@/components/Card'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'
import { usePermissions } from '@/hooks/useAuth'
import { handoverService } from '@/services/handoverService'
import type { Handover } from '@/types/types'
import { CommunicationPreferenceLabels, HandoverStatusLabels } from '@/types/types'
import { formatDate, formatDateTime } from '@/utils/formatDate'
import { cn } from '@/utils/helpers'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  User,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function HandoverDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canApproveHandover } = usePermissions()
  const [handover, setHandover] = useState<Handover | null>(null)
  const [loading, setLoading] = useState(true)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [reviewComment, setReviewComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      setLoading(true)
      try {
        const response = await handoverService.getHandover(id)
        if (response.success && response.data) {
          setHandover(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch handover:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleApprove = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      const response = await handoverService.approveHandover(id, reviewComment)
      if (response.success && response.data) {
        setHandover(response.data)
        setShowApproveModal(false)
        setReviewComment('')
      }
    } catch (error) {
      console.error('Failed to approve handover:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      const response = await handoverService.rejectHandover(id, reviewComment)
      if (response.success && response.data) {
        setHandover(response.data)
        setShowRejectModal(false)
        setReviewComment('')
      }
    } catch (error) {
      console.error('Failed to reject handover:', error)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!handover) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">交接清单不存在</p>
        <button
          onClick={() => navigate('/handovers')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          返回列表
        </button>
      </div>
    )
  }

  const canTakeAction = canApproveHandover && handover.status === 'pending'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/handovers')}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          交接清单 - {handover.customer?.name}
        </h1>
        <StatusBadge
          status={handover.status}
          label={HandoverStatusLabels[handover.status]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="基本信息" className="lg:col-span-1">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">交接人</p>
                <p className="font-medium">{handover.fromUser?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">接收人</p>
                <p className="font-medium">{handover.toUser?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">创建时间</p>
                <p className="font-medium">{formatDateTime(handover.createdAt)}</p>
              </div>
            </div>
            {handover.completedAt && (
              <div className="flex items-center gap-3">
                <CheckCircle size={18} className="text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">完成时间</p>
                  <p className="font-medium">{formatDateTime(handover.completedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card title="未完事项">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">待处理发票</p>
                <p className="text-gray-700">{handover.pendingItems.pendingInvoices || '无'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">待申报税种</p>
                <p className="text-gray-700">{handover.pendingItems.pendingDeclarations || '无'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">待核对账目</p>
                <p className="text-gray-700">{handover.pendingItems.pendingAccounts || '无'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">其他待办事项</p>
                <p className="text-gray-700">{handover.pendingItems.otherItems || '无'}</p>
              </div>
            </div>
          </Card>

          <Card title="客户习惯">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">沟通偏好</p>
                <p className="text-gray-700">
                  {CommunicationPreferenceLabels[handover.customerHabits.communicationPreference]}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">最佳联系时间</p>
                <p className="text-gray-700">{handover.customerHabits.bestContactTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">特殊要求</p>
                <p className="text-gray-700">{handover.customerHabits.specialRequirements || '无'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">注意事项</p>
                <p className="text-gray-700">{handover.customerHabits.attentionPoints || '无'}</p>
              </div>
            </div>
          </Card>

          <Card title="发票口径">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">发票类型</p>
                <p className="text-gray-700">{handover.invoiceDetails.invoiceType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">开票频率</p>
                <p className="text-gray-700">{handover.invoiceDetails.invoiceFrequency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">特殊开票要求</p>
                <p className="text-gray-700">{handover.invoiceDetails.specialRequirements || '无'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">历史问题记录</p>
                <p className="text-gray-700">{handover.invoiceDetails.historicalIssues || '无'}</p>
              </div>
            </div>
          </Card>

          <Card title="下次申报提醒">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">申报税种</p>
                <p className="text-gray-700">{handover.nextDeclaration.taxType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">申报截止日期</p>
                <p className="text-gray-700">{formatDate(handover.nextDeclaration.deadline)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">申报注意事项</p>
                <p className="text-gray-700">{handover.nextDeclaration.notes || '无'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {handover.reviewComment && (
        <Card title="审核意见">
          <p className="text-gray-700">{handover.reviewComment}</p>
          {handover.reviewer && (
            <p className="text-sm text-gray-500 mt-2">
              审核人：{handover.reviewer.name}
            </p>
          )}
        </Card>
      )}

      {canTakeAction && (
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >
            <XCircle size={18} />
            驳回
          </button>
          <button
            onClick={() => setShowApproveModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <CheckCircle size={18} />
            通过
          </button>
        </div>
      )}

      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="审核通过"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              审核意见（可选）
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入审核意见..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowApproveModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className={cn(
                'px-4 py-2 bg-green-600 text-white rounded-lg',
                actionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
              )}
            >
              {actionLoading ? '处理中...' : '确认通过'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="审核驳回"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              驳回原因
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入驳回原因..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowRejectModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className={cn(
                'px-4 py-2 bg-red-600 text-white rounded-lg',
                actionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
              )}
            >
              {actionLoading ? '处理中...' : '确认驳回'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}