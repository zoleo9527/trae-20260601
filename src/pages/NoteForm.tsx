import Card from '@/components/Card'
import { customerService } from '@/services/customerService'
import { noteService } from '@/services/noteService'
import type { Customer, NoteType } from '@/types/types'
import { cn } from '@/utils/helpers'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'

interface NoteForm {
  customerId: string
  type: NoteType
  title: string
  content: string
}

export default function NoteForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const customerIdFromQuery = searchParams.get('customerId')
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NoteForm>()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const customersResponse = await customerService.getCustomers({ page: 1, pageSize: 100 })
        if (customersResponse.success && customersResponse.data) {
          setCustomers(customersResponse.data.items)
        }

        if (customerIdFromQuery) {
          setValue('customerId', customerIdFromQuery)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [customerIdFromQuery, setValue])

  const selectedCustomerId = watch('customerId')
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

  const onSubmit = async (data: NoteForm) => {
    setSubmitting(true)
    try {
      const response = await noteService.createNote({
        customerId: data.customerId,
        type: data.type,
        title: data.title,
        content: data.content,
      })
      if (response.success && response.data) {
        navigate(`/customers/${data.customerId}`)
      }
    } catch (error) {
      console.error('Failed to create note:', error)
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
          onClick={() => navigate('/notes')}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">添加备注</h1>
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
              {selectedCustomer && (
                <p className="text-sm text-gray-500 mt-1">
                  联系人：{selectedCustomer.contactPerson || '-'} | 
                  合同到期：{selectedCustomer.contractEndDate || '-'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                备注类型 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('type', { required: '请选择备注类型' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.type ? 'border-red-500' : 'border-gray-300'
                )}
              >
                <option value="">请选择类型</option>
                <option value="general">一般备注</option>
                <option value="handover">交接备注</option>
                <option value="renewal">续约备注</option>
                <option value="issue">问题备注</option>
              </select>
              {errors.type && (
                <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>
              )}
            </div>
          </div>
        </Card>

        <Card title="备注内容">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('title', { required: '请填写标题' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.title ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="请输入备注标题..."
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('content', { required: '请填写备注内容' })}
                rows={6}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.content ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="请详细描述备注内容..."
              />
              {errors.content && (
                <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
              )}
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/notes')}
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
            {submitting ? '提交中...' : '提交备注'}
          </button>
        </div>
      </form>
    </div>
  )
}
