import Card from '@/components/Card'
import RiskBadge from '@/components/RiskBadge'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'
import { customerService } from '@/services/customerService'
import { noteService } from '@/services/noteService'
import type { Customer, Handover, Note, RiskLevel } from '@/types/types'
import { CustomerStatusLabels } from '@/types/types'
import { formatDate, formatDateTime, getExpiryLabel } from '@/utils/formatDate'
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [handovers, setHandovers] = useState<Handover[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      setLoading(true)
      try {
        const customerResponse = await customerService.getCustomer(id)
        if (customerResponse.success && customerResponse.data) {
          setCustomer(customerResponse.data)
        }

        const handoversResponse = await customerService.getCustomerHandovers(id)
        if (handoversResponse.success && handoversResponse.data) {
          setHandovers(handoversResponse.data)
        }

        const notesResponse = await noteService.getCustomerTimeline(id)
        if (notesResponse.success && notesResponse.data) {
          setNotes(notesResponse.data)
        }
      } catch (error) {
        console.error('Failed to fetch customer data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">客户不存在</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          返回列表
        </button>
      </div>
    )
  }

  const timelineItems = [
    ...handovers.map((h) => ({
      id: h.id,
      date: formatDateTime(h.createdAt),
      title: `交接记录 - ${h.fromUser?.name} → ${h.toUser?.name}`,
      content: `状态：${h.status === 'approved' ? '已通过' : h.status === 'pending' ? '待审核' : '已驳回'}`,
      type: h.status === 'approved' ? 'success' : h.status === 'rejected' ? 'error' : 'info',
    })),
    ...notes.map((n) => ({
      id: n.id,
      date: formatDateTime(n.createdAt),
      title: n.title,
      content: n.content,
      type: 'default',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
        <div className="flex items-center gap-2">
          <StatusBadge status={customer.status} label={CustomerStatusLabels[customer.status]} />
          <RiskBadge level={customer.riskLevel as RiskLevel} reasons={customer.riskReasons} showReasons />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="基本信息" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">联系人</p>
                <p className="font-medium">{customer.contactPerson || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">联系电话</p>
                <p className="font-medium">{customer.phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">邮箱</p>
                <p className="font-medium">{customer.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">地址</p>
                <p className="font-medium">{customer.address || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">合同开始日期</p>
                <p className="font-medium">{formatDate(customer.contractStartDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">合同到期日期</p>
                <p className="font-medium">{formatDate(customer.contractEndDate)}</p>
                <p className="text-xs text-gray-500">{getExpiryLabel(customer.contractEndDate)}</p>
              </div>
            </div>
          </div>
          {customer.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-1">备注</p>
              <p className="text-gray-700">{customer.notes}</p>
            </div>
          )}
        </Card>

        <Card title="负责人员">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">负责会计</p>
              <p className="font-medium">{customer.accountant?.name || '未分配'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">客户经理</p>
              <p className="font-medium">{customer.manager?.name || '未分配'}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <button
              onClick={() => navigate(`/handovers/new?customerId=${customer.id}`)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FileText size={18} />
              创建交接清单
            </button>
            <button
              onClick={() => navigate(`/notes/new?customerId=${customer.id}`)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <MessageSquare size={18} />
              添加备注
            </button>
          </div>
        </Card>
      </div>

      <Card title="历史记录">
        {timelineItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无历史记录</p>
        ) : (
          <Timeline items={timelineItems} />
        )}
      </Card>
    </div>
  )
}