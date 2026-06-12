import Card from '@/components/Card'
import { customerService } from '@/services/customerService'
import { handoverService } from '@/services/handoverService'
import { userService } from '@/services/userService'
import type { CommunicationPreference, CreateHandoverRequest, Customer, SafeUser } from '@/types/types'
import { cn } from '@/utils/helpers'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'

interface HandoverForm {
  customerId: string
  toUserId: string
  fromUserRole: 'accountant' | 'manager'
  pendingInvoices: string
  pendingDeclarations: string
  pendingAccounts: string
  otherItems: string
  communicationPreference: CommunicationPreference
  bestContactTime: string
  specialRequirements: string
  attentionPoints: string
  invoiceType: string
  invoiceFrequency: string
  invoiceSpecialRequirements: string
  historicalIssues: string
  taxType: string
  deadline: string
  declarationNotes: string
}

export default function HandoverForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const customerId = searchParams.get('customerId')
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [users, setUsers] = useState<SafeUser[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HandoverForm>()

  const selectedRole = watch('fromUserRole')

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true)
      try {
        const customersResponse = await customerService.getCustomers({ page: 1, pageSize: 100 })
        if (customersResponse.success && customersResponse.data) {
          setCustomers(customersResponse.data.items)
          if (customerId) {
            setValue('customerId', customerId)
          }
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [customerId, setValue])

  useEffect(() => {
    const fetchUsers = async () => {
      if (!selectedRole) {
        setUsers([])
        return
      }

      try {
        const usersResponse = await userService.getHandoverableUsers(selectedRole)
        if (usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data)
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }

    fetchUsers()
  }, [selectedRole])

  const onSubmit = async (data: HandoverForm) => {
    setSubmitting(true)
    try {
      const request: CreateHandoverRequest = {
        customerId: data.customerId,
        toUserId: data.toUserId,
        fromUserRole: data.fromUserRole,
        pendingItems: {
          pendingInvoices: data.pendingInvoices,
          pendingDeclarations: data.pendingDeclarations,
          pendingAccounts: data.pendingAccounts,
          otherItems: data.otherItems,
        },
        customerHabits: {
          communicationPreference: data.communicationPreference,
          bestContactTime: data.bestContactTime,
          specialRequirements: data.specialRequirements,
          attentionPoints: data.attentionPoints,
        },
        invoiceDetails: {
          invoiceType: data.invoiceType,
          invoiceFrequency: data.invoiceFrequency,
          specialRequirements: data.invoiceSpecialRequirements,
          historicalIssues: data.historicalIssues,
        },
        nextDeclaration: {
          taxType: data.taxType,
          deadline: data.deadline,
          notes: data.declarationNotes,
          attachments: [],
        },
      }

      const response = await handoverService.createHandover(request)
      if (response.success && response.data) {
        navigate(`/handovers/${response.data.id}`)
      }
    } catch (error) {
      console.error('Failed to create handover:', error)
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
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/handovers')}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">创建交接清单</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card title="基本信息">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                客户 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('customerId', { required: '请选择客户' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.customerId ? 'border-red-500' : 'border-gray-300'
                )}
              >
                <option value="">请选择客户</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="text-sm text-red-500 mt-1">{errors.customerId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                接收人 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('toUserId', { required: '请选择接收人' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.toUserId ? 'border-red-500' : 'border-gray-300'
                )}
              >
                <option value="">请选择接收人</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'accountant' ? '会计' : u.role === 'manager' ? '客户经理' : u.role})
                  </option>
                ))}
              </select>
              {errors.toUserId && (
                <p className="text-sm text-red-500 mt-1">{errors.toUserId.message}</p>
              )}
              {!selectedRole && (
                <p className="text-xs text-gray-500 mt-1">请先选择交接角色以加载可接收人</p>
              )}
              {selectedRole && users.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">暂无在职{selectedRole === 'accountant' ? '会计' : '客户经理'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                交接角色 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('fromUserRole', { required: '请选择交接角色' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.fromUserRole ? 'border-red-500' : 'border-gray-300'
                )}
              >
                <option value="">请选择角色</option>
                <option value="accountant">会计</option>
                <option value="manager">客户经理</option>
              </select>
              {errors.fromUserRole && (
                <p className="text-sm text-red-500 mt-1">{errors.fromUserRole.message}</p>
              )}
            </div>
          </div>
        </Card>

        <Card title="未完事项">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                待处理发票 <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('pendingInvoices', { required: '请填写待处理发票' })}
                rows={2}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.pendingInvoices ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="请描述待处理的发票事项..."
              />
              {errors.pendingInvoices && (
                <p className="text-sm text-red-500 mt-1">{errors.pendingInvoices.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                待申报税种 <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('pendingDeclarations', { required: '请填写待申报税种' })}
                rows={2}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.pendingDeclarations ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="请描述待申报的税种..."
              />
              {errors.pendingDeclarations && (
                <p className="text-sm text-red-500 mt-1">{errors.pendingDeclarations.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                待核对账目 <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('pendingAccounts', { required: '请填写待核对账目' })}
                rows={2}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.pendingAccounts ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="请描述待核对的账目..."
              />
              {errors.pendingAccounts && (
                <p className="text-sm text-red-500 mt-1">{errors.pendingAccounts.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                其他待办事项
              </label>
              <textarea
                {...register('otherItems')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请描述其他待办事项..."
              />
            </div>
          </div>
        </Card>

        <Card title="客户习惯">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                沟通偏好 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('communicationPreference', { required: '请选择沟通偏好' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.communicationPreference ? 'border-red-500' : 'border-gray-300'
                )}
              >
                <option value="">请选择</option>
                <option value="phone">电话</option>
                <option value="wechat">微信</option>
                <option value="email">邮件</option>
              </select>
              {errors.communicationPreference && (
                <p className="text-sm text-red-500 mt-1">{errors.communicationPreference.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最佳联系时间 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('bestContactTime', { required: '请填写最佳联系时间' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.bestContactTime ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="例如：下午2-4点"
              />
              {errors.bestContactTime && (
                <p className="text-sm text-red-500 mt-1">{errors.bestContactTime.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                特殊要求
              </label>
              <textarea
                {...register('specialRequirements')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请描述客户的特殊要求..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                注意事项
              </label>
              <textarea
                {...register('attentionPoints')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请描述需要注意的事项..."
              />
            </div>
          </div>
        </Card>

        <Card title="发票口径">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                发票类型 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('invoiceType', { required: '请填写发票类型' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.invoiceType ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="例如：增值税专用发票"
              />
              {errors.invoiceType && (
                <p className="text-sm text-red-500 mt-1">{errors.invoiceType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开票频率 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('invoiceFrequency', { required: '请填写开票频率' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.invoiceFrequency ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="例如：每月一次"
              />
              {errors.invoiceFrequency && (
                <p className="text-sm text-red-500 mt-1">{errors.invoiceFrequency.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                特殊开票要求
              </label>
              <textarea
                {...register('invoiceSpecialRequirements')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请描述特殊开票要求..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                历史问题记录
              </label>
              <textarea
                {...register('historicalIssues')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请描述历史问题..."
              />
            </div>
          </div>
        </Card>

        <Card title="下次申报提醒">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                申报税种 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('taxType', { required: '请填写申报税种' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.taxType ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="例如：增值税"
              />
              {errors.taxType && (
                <p className="text-sm text-red-500 mt-1">{errors.taxType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                申报截止日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('deadline', { required: '请选择申报截止日期' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.deadline ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.deadline && (
                <p className="text-sm text-red-500 mt-1">{errors.deadline.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              申报注意事项
            </label>
            <textarea
              {...register('declarationNotes')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请描述申报注意事项..."
            />
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/handovers')}
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
            {submitting ? '提交中...' : '提交交接清单'}
          </button>
        </div>
      </form>
    </div>
  )
}