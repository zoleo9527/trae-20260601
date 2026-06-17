'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { StatCard } from '@/components/dashboard/StatCard'
import { TodoList } from '@/components/dashboard/TodoList'
import { RiskAlerts } from '@/components/dashboard/RiskAlerts'
import { RecentChanges } from '@/components/dashboard/RecentChanges'
import { ArrowRight } from 'lucide-react'

interface TodoItem {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  dueTime?: string
  depositId: string
  depositCode: string
}

interface RiskItem {
  id: string
  type: 'expiry' | 'anomaly' | 'inventory'
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  count: number
}

interface RecentItem {
  id: string
  type: 'deposit' | 'redeem' | 'booking' | 'expiry'
  title: string
  description: string
  time: string
  status: 'pending' | 'success' | 'danger'
  depositId?: string
  redeemId?: string
}

interface DashboardData {
  stats: {
    todayDeposits: number
    todayRedeems: number
    riskCount: number
    monthlyRevenue: number
  }
  todoItems: TodoItem[]
  riskItems: RiskItem[]
  recentItems: RecentItem[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/dashboard/data')
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00D9FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen">
        <Header title="首页仪表盘" subtitle="酒吧运营管理系统" />
        <div className="p-8 text-center">
          <p className="text-[#A0AEC0]">加载数据失败，请刷新页面</p>
        </div>
      </div>
    )
  }

  const { stats, todoItems, riskItems, recentItems } = data

  return (
    <div className="min-h-screen">
      <Header title="首页仪表盘" subtitle="酒吧运营管理系统" />

      <div className="p-8 space-y-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="今日新增寄存"
            value={stats.todayDeposits}
            change="+0%"
            changeType="increase"
            icon="deposit"
            color="cyan"
          />
          <StatCard
            title="今日核销"
            value={stats.todayRedeems}
            change="+0%"
            changeType="increase"
            icon="redeem"
            color="gold"
          />
          <StatCard
            title="风险项"
            value={stats.riskCount}
            change="+0"
            changeType="decrease"
            icon="risk"
            color="red"
          />
          <StatCard
            title="本月营收"
            value={`¥${(stats.monthlyRevenue / 100).toFixed(1)}万`}
            change="+0%"
            changeType="increase"
            icon="trend"
            color="green"
          />
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 待办事项 - 占用 2 列 */}
          <div className="lg:col-span-2">
            <div className="bg-[#1A1F2E] rounded-xl border border-[#2D3748] overflow-hidden">
              <div className="p-4 border-b border-[#2D3748] flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">待办事项</h3>
                <Link href="/deposit" className="flex items-center gap-1 text-sm text-[#00D9FF] hover:underline">
                  查看全部 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="p-4 space-y-3">
                {todoItems.length > 0 ? (
                  todoItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/deposit/${item.depositId}`}
                      className="block p-4 bg-[#0D1117] rounded-lg border border-[#2D3748] hover:border-[#00D9FF]/50 transition-all group cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                item.priority === 'high'
                                  ? 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]'
                                  : item.priority === 'medium'
                                  ? 'bg-[#F5A623]/20 text-[#F5A623] border-[#F5A623]'
                                  : 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]'
                              }`}
                            >
                              {item.priority === 'high' ? '紧急' : item.priority === 'medium' ? '中等' : '一般'}
                            </span>
                            {item.dueTime && (
                              <span className="text-xs text-[#A0AEC0]">{item.dueTime}</span>
                            )}
                          </div>
                          <h4 className="text-sm font-medium text-white mb-1 group-hover:text-[#00D9FF] transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs text-[#A0AEC0]">{item.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#A0AEC0] group-hover:text-[#00D9FF] group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-[#A0AEC0]">暂无待办事项</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 风险预警 */}
          <div>
            <div className="bg-[#1A1F2E] rounded-xl border border-[#2D3748] overflow-hidden">
              <div className="p-4 border-b border-[#2D3748] flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">风险预警</h3>
                <Link href="/batch" className="flex items-center gap-1 text-sm text-[#FF6B6B] hover:underline">
                  批量处理 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="p-4 space-y-3">
                {riskItems.length > 0 ? (
                  riskItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.type === 'expiry' ? '/batch' : '/deposit'}
                      className={`block p-4 bg-[#0D1117] rounded-lg border-l-4 ${
                        item.severity === 'high'
                          ? 'border-l-[#FF6B6B]'
                          : item.severity === 'medium'
                          ? 'border-l-[#F5A623]'
                          : 'border-l-[#00D9FF]'
                      } hover:border-[#00D9FF]/50 transition-all group cursor-pointer`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                          item.type === 'expiry'
                            ? 'bg-[#FF6B6B]/20 text-[#FF6B6B]'
                            : item.type === 'anomaly'
                            ? 'bg-[#F5A623]/20 text-[#F5A623]'
                            : 'bg-[#00D9FF]/20 text-[#00D9FF]'
                        } rounded-lg`}>
                          {item.type === 'expiry' && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {item.type === 'anomaly' && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          )}
                          {item.type === 'inventory' && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-white truncate group-hover:text-[#00D9FF] transition-colors">
                              {item.title}
                            </h4>
                            <span className={`text-xs font-bold ${
                              item.type === 'expiry'
                                ? 'text-[#FF6B6B]'
                                : item.type === 'anomaly'
                                ? 'text-[#F5A623]'
                                : 'text-[#00D9FF]'
                            }`}>
                              {item.count}
                            </span>
                          </div>
                          <p className="text-xs text-[#A0AEC0] line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-[#A0AEC0]">暂无风险预警</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 最近变更 */}
        <div className="grid grid-cols-1">
          <div className="bg-[#1A1F2E] rounded-xl border border-[#2D3748] overflow-hidden">
            <div className="p-4 border-b border-[#2D3748] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">最近变更</h3>
              <Link href="/redeem/history" className="flex items-center gap-1 text-sm text-[#00D9FF] hover:underline">
                查看更多 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentItems.length > 0 ? (
                  recentItems.map((item) => {
                    const typeConfig = {
                      deposit: {
                        bgColor: 'bg-[#00D9FF]/20',
                        textColor: 'text-[#00D9FF]',
                        icon: (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        ),
                      },
                      redeem: {
                        bgColor: 'bg-[#4ECDC4]/20',
                        textColor: 'text-[#4ECDC4]',
                        icon: (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ),
                      },
                      expiry: {
                        bgColor: 'bg-[#FF6B6B]/20',
                        textColor: 'text-[#FF6B6B]',
                        icon: (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        ),
                      },
                    }

                    const statusConfig = {
                      pending: { bgColor: 'bg-[#F5A623]/20', textColor: 'text-[#F5A623]', text: '待处理' },
                      success: { bgColor: 'bg-[#4ECDC4]/20', textColor: 'text-[#4ECDC4]', text: '已完成' },
                      danger: { bgColor: 'bg-[#FF6B6B]/20', textColor: 'text-[#FF6B6B]', text: '已过期' },
                    }

                    const type = typeConfig[item.type]
                    const status = statusConfig[item.status]

                    let linkUrl = ''
                    if (item.type === 'deposit' && item.depositId) {
                      linkUrl = `/deposit/${item.depositId}`
                    } else if (item.type === 'redeem' && item.redeemId) {
                      linkUrl = `/redeem/${item.redeemId}`
                    } else if (item.type === 'expiry' && item.depositId) {
                      linkUrl = `/deposit/${item.depositId}`
                    }

                    return (
                      <Link
                        key={item.id}
                        href={linkUrl || '#'}
                        className="block p-4 bg-[#0D1117] rounded-lg border border-[#2D3748] hover:border-[#00D9FF]/50 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 ${type.bgColor} rounded-lg flex items-center justify-center`}>
                            <span className={type.textColor}>{type.icon}</span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                            {status.text}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-white mb-1 group-hover:text-[#00D9FF] transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-[#A0AEC0] mb-2">{item.description}</p>
                        <div className="flex items-center gap-1 text-xs text-[#A0AEC0]">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {item.time}
                        </div>
                      </Link>
                    )
                  })
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-[#A0AEC0]">暂无变更记录</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}