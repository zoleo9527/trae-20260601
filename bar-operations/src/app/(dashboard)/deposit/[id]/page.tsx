'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import {
  Package,
  User,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  ScanLine,
  AlertTriangle,
  ArrowLeft,
  Printer,
} from 'lucide-react'

interface TimelineEvent {
  id: string
  type: 'CREATED' | 'CONFIRMED' | 'REDEEM' | 'EXTENDED' | 'WARNING' | 'EXPIRED'
  title: string
  description: string
  time: string
  operator?: string
}

interface DepositItem {
  id: string
  itemName: string
  category: string
  quantity: number
  remaining: number
}

interface Deposit {
  id: string
  depositCode: string
  customerName: string
  customerPhone: string | null
  status: 'ACTIVE' | 'PARTIALLY' | 'COMPLETED' | 'EXPIRED'
  bookingId: string | null
  createdAt: string
  expiredAt: string
  operator: string
  items: DepositItem[]
  events: TimelineEvent[]
}

const typeConfig: Record<string, { icon: typeof Package; color: string; bgColor: string }> = {
  CREATED: { icon: Package, color: 'text-[#00D9FF]', bgColor: 'bg-[#00D9FF]/20' },
  CONFIRMED: { icon: CheckCircle, color: 'text-[#4ECDC4]', bgColor: 'bg-[#4ECDC4]/20' },
  REDEEM: { icon: ScanLine, color: 'text-[#F5A623]', bgColor: 'bg-[#F5A623]/20' },
  EXTENDED: { icon: Clock, color: 'text-[#4ECDC4]', bgColor: 'bg-[#4ECDC4]/20' },
  WARNING: { icon: AlertTriangle, color: 'text-[#F5A623]', bgColor: 'bg-[#F5A623]/20' },
  EXPIRED: { icon: AlertTriangle, color: 'text-[#FF6B6B]', bgColor: 'bg-[#FF6B6B]/20' },
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-[#4ECDC4]/20 text-[#4ECDC4] border-[#4ECDC4]',
  PARTIALLY: 'bg-[#F5A623]/20 text-[#F5A623] border-[#F5A623]',
  COMPLETED: 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]',
  EXPIRED: 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]',
}

const statusText: Record<string, string> = {
  ACTIVE: '进行中',
  PARTIALLY: '部分取完',
  COMPLETED: '已完成',
  EXPIRED: '已过期',
}

export default function DepositDetailPage({ params }: { params: { id: string } }) {
  const [deposit, setDeposit] = useState<Deposit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDeposit = async () => {
      const response = await fetch(`/api/deposit/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setDeposit(result.data)
      }
      setLoading(false)
    }

    fetchDeposit()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00D9FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!deposit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-[#FF6B6B] mx-auto mb-4" />
          <p className="text-[#A0AEC0]">寄存记录不存在</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="寄存详情" subtitle={`寄存编号：${deposit.depositCode}`} />

      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* 操作栏 */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/deposit"
              className="flex items-center gap-2 px-4 py-2 text-[#A0AEC0] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回列表
            </Link>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1F2E] border border-[#2D3748] text-[#A0AEC0] rounded-lg hover:bg-[#252B3B] transition-colors">
                <Printer className="w-4 h-4" />
                打印凭证
              </button>
              <Link
                href={`/redeem?deposit=${deposit.depositCode}`}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00D9FF] to-[#00B8D9] text-white rounded-lg hover:from-[#00B8D9] hover:to-[#0099CC] transition-all shadow-lg hover:shadow-xl hover:shadow-[#00D9FF]/20"
              >
                <ScanLine className="w-4 h-4" />
                核销取酒
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧信息卡 */}
            <div className="lg:col-span-1 space-y-6">
              {/* 基本信息 */}
              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
                <h3 className="text-lg font-bold text-white mb-4">基本信息</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-[#00D9FF]" />
                    <div>
                      <p className="text-xs text-[#A0AEC0]">寄存编号</p>
                      <p className="text-sm font-mono text-white">{deposit.depositCode}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#00D9FF]" />
                    <div>
                      <p className="text-xs text-[#A0AEC0]">客户姓名</p>
                      <p className="text-sm text-white">{deposit.customerName}</p>
                    </div>
                  </div>

                  {deposit.customerPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-[#00D9FF]" />
                      <div>
                        <p className="text-xs text-[#A0AEC0]">联系电话</p>
                        <p className="text-sm text-white">{deposit.customerPhone}</p>
                      </div>
                    </div>
                  )}

                  {deposit.bookingId && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-[#00D9FF]" />
                      <div>
                        <p className="text-xs text-[#A0AEC0]">关联订台</p>
                        <p className="text-sm text-white">#{deposit.bookingId}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#00D9FF]" />
                    <div>
                      <p className="text-xs text-[#A0AEC0]">有效期至</p>
                      <p className="text-sm text-white">{deposit.expiredAt}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[#2D3748]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#A0AEC0]">状态</span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[deposit.status]}`}
                    >
                      {statusText[deposit.status]}
                    </span>
                  </div>
                </div>
              </div>

              {/* 寄存物品 */}
              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
                <h3 className="text-lg font-bold text-white mb-4">寄存物品</h3>
                <div className="space-y-3">
                  {deposit.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#0D1117] rounded-lg border border-[#2D3748]"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{item.itemName}</p>
                          <p className="text-xs text-[#A0AEC0]">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-[#00D9FF]">
                            {item.remaining}/{item.quantity}
                          </p>
                          <p className="text-xs text-[#A0AEC0]">剩余/总数</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-[#2D3748] rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-[#00D9FF] to-[#4ECDC4] h-1.5 rounded-full transition-all"
                            style={{
                              width: `${(item.remaining / item.quantity) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 右侧时间线 */}
            <div className="lg:col-span-2">
              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
                <h3 className="text-lg font-bold text-white mb-6">操作时间线</h3>

                <div className="relative">
                  {/* 时间线 */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#2D3748]"></div>

                  <div className="space-y-6">
                    {deposit.events.map((event, index) => {
                      const config = typeConfig[event.type]
                      const Icon = config.icon
                      const isLast = index === deposit.events.length - 1

                      return (
                        <div key={event.id} className="relative flex gap-4">
                          {/* 时间线节点 */}
                          <div
                            className={`relative z-10 w-12 h-12 rounded-full ${config.bgColor} border-2 border-[#2D3748] flex items-center justify-center ${config.color}`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          {/* 内容 */}
                          <div className={`flex-1 ${isLast ? '' : 'pb-8'}`}>
                            <div className="p-4 bg-[#0D1117] rounded-lg border border-[#2D3748]">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-sm font-medium text-white">{event.title}</h4>
                                <span className="text-xs text-[#A0AEC0] font-mono">{event.time}</span>
                              </div>
                              <p className="text-xs text-[#A0AEC0]">{event.description}</p>
                              {event.operator && (
                                <p className="text-xs text-[#A0AEC0] mt-2">
                                  操作人：{event.operator}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}