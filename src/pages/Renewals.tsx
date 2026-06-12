import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Plus } from 'lucide-react'
import { renewalService } from '@/services/renewalService'
import Card from '@/components/Card'
import RiskBadge from '@/components/RiskBadge'
import StatusBadge from '@/components/StatusBadge'
import Modal from '@/components/Modal'
import type { Customer, RiskLevel, ContactMethod } from '@/types/types'
import { getExpiryLabel, getDaysUntilExpiry } from '@/utils/formatDate'
import { CustomerStatusLabels } from '@/types/types'
import { useForm } from 'react-hook-form'
import { cn } from '@/utils/helpers'

interface FollowUpForm {
  contactDate: string
  contactMethod: ContactMethod
  content: string
  result: string
  nextFollowUpDate: string
}

export default function Renewals() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<Customer[]>([])
  const [riskCustomers, setRiskCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FollowUpForm>()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const alertsResponse = await renewalService.getAlerts()
        if (alertsResponse.success && alertsResponse.data) {
          setAlerts(alertsResponse.data)
        }

        const riskResponse = await renewalService.getRiskCustomers()
        if (riskResponse.success && riskResponse.data) {
          setRiskCustomers(riskResponse.data)
        }
      } catch (error) {
        console.error('Failed to fetch renewal data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleOpenFollowUp = (customer: Customer) => {
    setSelectedCustomer(customer)
    reset({
      contactDate: new Date().toISOString().split('T')[0],
      contactMethod: 'phone',
      content: '',
      result: '',
      nextFollowUpDate: '',
    })
    setShowFollowUpModal(true)
  }

  const onSubmitFollowUp = async (data: FollowUpForm) => {
    if (!selectedCustomer) return
    setSubmitting(true)
    try {
      const response = await renewalService.addFollowUp(selectedCustomer.id, {
        customerId: selectedCustomer.id,
        contactDate: data.contactDate,
        contactMethod: data.contactMethod,
        content: data.content,
        result: data.result,
        nextFollowUpDate: data.nextFollowUpDate,
      })
      if (response.success) {
        setShowFollowUpModal(false)
        setSelectedCustomer(null)
        const alertsResponse = await renewalService.getAlerts()
        if (alertsResponse.success && alertsResponse.data) {
          setAlerts(alertsResponse.data)
        }
      }
    } catch (error) {
      console.error('Failed to add follow up:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">续约跟进</h1>

      <Card
        title="到期预警"
        subtitle={`${alerts.length} 个客户即将到期`}
        actions={
          <button
            onClick={() => navigate('/customers?status=expiring')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            查看全部
          </button>
        }
      >
        {alerts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无即将到期客户</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((customer) => {
              const days = getDaysUntilExpiry(customer.contractEndDate)
              const urgencyColor = days && days <= 30 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
              
              return (
                <div
                  key={customer.id}
                  className={cn('p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow', urgencyColor)}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{customer.name}</h3>
                    <RiskBadge level={customer.riskLevel as RiskLevel} size="sm" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {getExpiryLabel(customer.contractEndDate)}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {customer.manager?.name || '未分配'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenFollowUp(customer)
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Plus size={14} />
                      跟进
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card
        title="风险客户"
        subtitle={`${riskCustomers.length} 个高风险客户`}
        actions={
          <button
            onClick={() => navigate('/customers?riskLevel=high')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            查看全部
          </button>
        }
      >
        {riskCustomers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无高风险客户</p>
        ) : (
          <div className="space-y-3">
            {riskCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => navigate(`/customers/${customer.id}`)}
              >
                <div className="flex items-center gap-4">
                  <AlertTriangle size={20} className="text-red-500" />
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={customer.status} label={CustomerStatusLabels[customer.status]} size="sm" />
                      <RiskBadge level={customer.riskLevel as RiskLevel} size="sm" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {customer.riskReasons.map((reason, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        title={`添加跟进记录 - ${selectedCustomer?.name}`}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmitFollowUp)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('contactDate', { required: '请选择联系日期' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.contactDate ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.contactDate && (
                <p className="text-sm text-red-500 mt-1">{errors.contactDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系方式 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('contactMethod', { required: '请选择联系方式' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.contactMethod ? 'border-red-500' : 'border-gray-300'
                )}
              >
                <option value="phone">电话</option>
                <option value="wechat">微信</option>
                <option value="email">邮件</option>
                <option value="visit">上门</option>
              </select>
              {errors.contactMethod && (
                <p className="text-sm text-red-500 mt-1">{errors.contactMethod.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              沟通内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('content', { required: '请填写沟通内容' })}
              rows={3}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.content ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder="请描述沟通内容..."
            />
            {errors.content && (
              <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              沟通结果
            </label>
            <textarea
              {...register('result')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请描述沟通结果..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              下次跟进日期
            </label>
            <input
              type="date"
              {...register('nextFollowUpDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowFollowUpModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'px-4 py-2 bg-blue-600 text-white rounded-lg',
                submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              )}
            >
              {submitting ? '提交中...' : '提交'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}