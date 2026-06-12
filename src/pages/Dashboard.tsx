import Card from '@/components/Card'
import RiskBadge from '@/components/RiskBadge'
import StatusBadge from '@/components/StatusBadge'
import { useAuth } from '@/context/AuthContext'
import { customerService } from '@/services/customerService'
import { handoverService } from '@/services/handoverService'
import { statisticsService } from '@/services/statisticsService'
import type { Customer, DashboardStats, Handover, RiskLevel } from '@/types/types'
import { formatDate, getExpiryLabel } from '@/utils/formatDate'
import { cn } from '@/utils/helpers'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expiringCustomers, setExpiringCustomers] = useState<Customer[]>([])
  const [pendingHandovers, setPendingHandovers] = useState<Handover[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const statsResponse = await statisticsService.getDashboardStats()
        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data)
        }

        const customersResponse = await customerService.getCustomers({
          page: 1,
          pageSize: 5,
          status: 'expiring',
        })
        if (customersResponse.success && customersResponse.data) {
          setExpiringCustomers(customersResponse.data.items)
        }

        const handoversResponse = await handoverService.getHandovers({
          page: 1,
          pageSize: 5,
          status: 'pending',
        })
        if (handoversResponse.success && handoversResponse.data) {
          setPendingHandovers(handoversResponse.data.items)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: '客户总数',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => navigate('/customers'),
    },
    {
      title: '活跃客户',
      value: stats?.activeCustomers || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      onClick: () => navigate('/customers?status=active'),
    },
    {
      title: '即将到期',
      value: stats?.expiringCustomers || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      onClick: () => navigate('/renewals'),
    },
    {
      title: '高风险客户',
      value: stats?.highRiskCustomers || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      onClick: () => navigate('/customers?riskLevel=high'),
    },
    {
      title: '待审核交接',
      value: stats?.pendingHandovers || 0,
      icon: FileText,
      color: 'bg-orange-500',
      onClick: () => navigate('/handovers?status=pending'),
    },
    {
      title: '用户总数',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-purple-500',
      onClick: () => navigate('/users'),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-gray-500">欢迎，{user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className={cn('cursor-pointer hover:shadow-md transition-shadow')}
            onClick={card.onClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={cn('p-3 rounded-lg', card.color)}>
                <card.icon size={24} className="text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="即将到期客户"
          actions={
            <button
              onClick={() => navigate('/renewals')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              查看全部 <ArrowRight size={16} />
            </button>
          }
        >
          {expiringCustomers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无即将到期客户</p>
          ) : (
            <div className="space-y-3">
              {expiringCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">
                      {getExpiryLabel(customer.contractEndDate)}
                    </p>
                  </div>
                  <RiskBadge level={customer.riskLevel as RiskLevel} size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="待审核交接"
          actions={
            <button
              onClick={() => navigate('/handovers?status=pending')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              查看全部 <ArrowRight size={16} />
            </button>
          }
        >
          {pendingHandovers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无待审核交接</p>
          ) : (
            <div className="space-y-3">
              {pendingHandovers.map((handover) => (
                <div
                  key={handover.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => navigate(`/handovers/${handover.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {handover.customer?.name || '未知客户'}
                    </p>
                    <p className="text-sm text-gray-500">
                      创建于 {formatDate(handover.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={handover.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}