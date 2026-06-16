import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Ticket,
  Users,
  Package,
  TrendingUp,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { dashboardApi } from '@/services/api'
import type { DashboardTodo, DashboardRisk, DashboardRecent } from '@/types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [todos, setTodos] = useState<DashboardTodo[]>([])
  const [risks, setRisks] = useState<DashboardRisk[]>([])
  const [recent, setRecent] = useState<DashboardRecent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [todosRes, risksRes, recentRes] = await Promise.all([
        dashboardApi.todos(),
        dashboardApi.risks(),
        dashboardApi.recent(),
      ])

      if (todosRes.success) setTodos(todosRes.data)
      if (risksRes.success) setRisks(risksRes.data)
      if (recentRes.success) setRecent(recentRes.data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const roleLabels = {
    clerk: '店员',
    manager: '店长',
    buyer: '采购',
  }

  const roleDescriptions = {
    clerk: '这里展示您今天的待办工作',
    manager: '这里展示门店整体运营状况',
    buyer: '这里展示最新的政策变更记录',
  }

  const actionLabels: Record<string, string> = {
    created: '创建',
    submitted_for_review: '提交复核',
    approved: '审核通过',
    rejected: '审核拒绝',
    verified: '核销',
    updated: '更新',
  }

  const getRoleBasedOrder = () => {
    switch (user?.role) {
      case 'clerk':
        return ['todos', 'recent', 'risks']
      case 'manager':
        return ['risks', 'todos', 'recent']
      case 'buyer':
        return ['recent', 'risks', 'todos']
      default:
        return ['todos', 'risks', 'recent']
    }
  }

  const getSectionTitle = (type: string) => {
    switch (type) {
      case 'todos':
        return '待办任务'
      case 'risks':
        return '风险项'
      case 'recent':
        return '最近变更'
      default:
        return type
    }
  }

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'todos':
        return <Clock size={24} className="mr-2 text-primary" />
      case 'risks':
        return <AlertTriangle size={24} className="mr-2 text-red-500" />
      case 'recent':
        return <TrendingUp size={24} className="mr-2 text-accent" />
      default:
        return null
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <AlertTriangle size={20} className="text-red-500" />
      case 'medium':
        return <Clock size={20} className="text-yellow-500" />
      default:
        return <CheckCircle size={20} className="text-green-500" />
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gray-200 rounded-lg w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  const sectionOrder = getRoleBasedOrder()
  const primarySection = sectionOrder[0]
  const secondarySections = sectionOrder.slice(1)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          欢迎回来，{user?.name}
        </h1>
        <p className="text-gray-500 mt-1">
          {roleLabels[user?.role || 'clerk']}工作台 · {roleDescriptions[user?.role || 'clerk']}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={primarySection === 'todos' ? 'lg:col-span-2' : 'lg:col-span-2'}>
          {primarySection === 'todos' && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  {getSectionIcon('todos')}
                  待办任务
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    {user?.role === 'clerk' ? '我的工作' : user?.role === 'manager' ? '门店待办' : '查看记录'}
                  </span>
                </h2>
                <Link
                  to="/coupons"
                  className="text-sm text-primary hover:text-primary-600"
                >
                  查看全部 →
                </Link>
              </div>

              {todos.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle size={48} className="mx-auto mb-2" />
                  <p>暂无待办任务</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todos.map((todo, index) => (
                    <div
                      key={index}
                      className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">
                          {todo.type === 'review_pending' ? '待复核' : '草稿'}
                        </span>
                        <span className="px-3 py-1 bg-primary-100 text-primary rounded-full text-sm font-medium">
                          {todo.count} 项
                        </span>
                      </div>
                      {todo.items && todo.items.length > 0 && (
                        <div className="space-y-2">
                          {todo.items.slice(0, 3).map((item, idx) => (
                            <Link
                              key={idx}
                              to={`/coupons/${item.coupon_id}`}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-mono text-gray-600">
                                    {item.coupon_code}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {item.member_name}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  发放人：{item.operator_name || '-'}
                                </div>
                              </div>
                              <span className="text-xs text-gray-400 ml-2">
                                {item.waiting_time || item.issue_date}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                      {todo.responsible_role && (
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>负责人：{todo.responsible_role}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {primarySection === 'risks' && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  {getSectionIcon('risks')}
                  风险项
                  <span className="ml-2 text-xs text-gray-400 font-normal">需要关注</span>
                </h2>
              </div>

              {risks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle size={48} className="mx-auto mb-2" />
                  <p>暂无风险项</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {risks.map((risk, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        risk.level === 'high'
                          ? 'bg-red-50 border-red-200'
                          : risk.level === 'medium'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {getRiskIcon(risk.level)}
                          <span className="ml-2 font-medium text-gray-800">
                            {risk.type === 'expired_unverified'
                              ? '过期未核销'
                              : risk.type === 'batch_expiring'
                              ? '批号临近过期'
                              : risk.type === 'review_overdue'
                              ? '复核超期'
                              : risk.type}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            risk.level === 'high'
                              ? 'bg-red-100 text-red-700'
                              : risk.level === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {risk.count}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{risk.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {primarySection === 'recent' && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  {getSectionIcon('recent')}
                  最近变更
                  <span className="ml-2 text-xs text-gray-400 font-normal">最新动态</span>
                </h2>
                <Link
                  to="/coupons"
                  className="text-sm text-primary hover:text-primary-600"
                >
                  查看全部 →
                </Link>
              </div>

              {recent.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock size={48} className="mx-auto mb-2" />
                  <p>暂无最近变更</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recent.slice(0, 10).map((item, index) => (
                    <Link
                      key={index}
                      to={`/coupons/${item.coupon_id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <Ticket size={16} className="text-primary" />
                        </div>
                        <div>
                          <span className="text-sm font-mono text-gray-700">
                            {item.coupon_code}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            {actionLabels[item.action] || item.action}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">{item.operator}</span>
                        <p className="text-xs text-gray-400">
                          {format(new Date(item.timestamp), 'MM/dd HH:mm', {
                            locale: zhCN,
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {secondarySections.includes('risks') && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  {getSectionIcon('risks')}
                  风险项
                </h2>
              </div>

              {risks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle size={48} className="mx-auto mb-2" />
                  <p>暂无风险项</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {risks.map((risk, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        risk.level === 'high'
                          ? 'bg-red-50 border-red-200'
                          : risk.level === 'medium'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {getRiskIcon(risk.level)}
                          <span className="ml-2 font-medium text-gray-800">
                            {risk.type === 'expired_unverified'
                              ? '过期未核销'
                              : risk.type === 'batch_expiring'
                              ? '批号临近过期'
                              : risk.type === 'review_overdue'
                              ? '复核超期'
                              : risk.type}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            risk.level === 'high'
                              ? 'bg-red-100 text-red-700'
                              : risk.level === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {risk.count}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{risk.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {secondarySections.includes('todos') && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  {getSectionIcon('todos')}
                  待办任务
                </h2>
              </div>

              {todos.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle size={48} className="mx-auto mb-2" />
                  <p>暂无待办任务</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todos.map((todo, index) => (
                    <div
                      key={index}
                      className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">
                          {todo.type === 'review_pending' ? '待复核' : '草稿'}
                        </span>
                        <span className="px-3 py-1 bg-primary-100 text-primary rounded-full text-sm font-medium">
                          {todo.count} 项
                        </span>
                      </div>
                      {todo.items && todo.items.length > 0 && (
                        <div className="space-y-2">
                          {todo.items.slice(0, 3).map((item, idx) => (
                            <Link
                              key={idx}
                              to={`/coupons/${item.coupon_id}`}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                            >
                              <div>
                                <span className="text-sm font-mono text-gray-600">
                                  {item.coupon_code}
                                </span>
                                <span className="text-sm text-gray-500 ml-2">
                                  {item.member_name}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400">
                                {item.waiting_time || item.issue_date}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {secondarySections.includes('recent') && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  {getSectionIcon('recent')}
                  最近变更
                </h2>
              </div>

              {recent.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock size={48} className="mx-auto mb-2" />
                  <p>暂无最近变更</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recent.slice(0, 5).map((item, index) => (
                    <Link
                      key={index}
                      to={`/coupons/${item.coupon_id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <Ticket size={16} className="text-primary" />
                        </div>
                        <div>
                          <span className="text-sm font-mono text-gray-700">
                            {item.coupon_code}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            {actionLabels[item.action] || item.action}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">{item.operator}</span>
                        <p className="text-xs text-gray-400">
                          {format(new Date(item.timestamp), 'MM/dd HH:mm', {
                            locale: zhCN,
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Package size={24} className="mr-2 text-primary" />
              快捷入口
            </h2>
            <div className="space-y-2">
              {user?.role !== 'buyer' && (
                <Link
                  to="/coupons/issue"
                  className="flex items-center p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  <Ticket size={20} className="text-primary mr-3" />
                  <span className="text-gray-700">新建发放</span>
                </Link>
              )}
              <Link
                to="/coupons"
                className="flex items-center p-3 bg-accent-50 hover:bg-accent-100 rounded-lg transition-colors"
              >
                <Users size={20} className="text-accent mr-3" />
                <span className="text-gray-700">促销券列表</span>
              </Link>
              {user?.role !== 'buyer' && (
                <Link
                  to="/members"
                  className="flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <Users size={20} className="text-green-600 mr-3" />
                  <span className="text-gray-700">会员档案</span>
                </Link>
              )}
              <Link
                to="/batches"
                className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <Package size={20} className="text-purple-600 mr-3" />
                <span className="text-gray-700">批号管理</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
