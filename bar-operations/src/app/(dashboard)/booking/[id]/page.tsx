'use client'

import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import {
  CalendarDays,
  User,
  Phone,
  Package,
  ScanLine,
  ArrowLeft,
  Edit,
} from 'lucide-react'

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const booking = {
    id: params.id,
    bookingId: 'A123',
    tableNumber: '03',
    area: 'A区',
    customerName: '王先生',
    customerPhone: '139****1234',
    bookingTime: '2024-06-17 20:00',
    status: 'active',
    createdAt: '2024-06-15 14:30',
    deposits: [
      {
        id: '1',
        depositCode: 'DEP-20240615-A3F2',
        items: ['尊尼获加 × 3', '拉菲 × 2'],
        status: 'partially',
      },
    ],
  }

  return (
    <div className="min-h-screen">
      <Header title="订台详情" subtitle={`订台编号：#${booking.bookingId}`} />

      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* 返回和操作栏 */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/booking"
              className="flex items-center gap-2 text-[#A0AEC0] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回列表
            </Link>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1F2E] border border-[#2D3748] text-[#A0AEC0] rounded-lg hover:bg-[#252B3B] transition-colors">
                <Edit className="w-4 h-4" />
                编辑
              </button>
              <Link
                href={`/deposit/new?booking=${booking.bookingId}`}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00D9FF] to-[#00B8D9] text-white rounded-lg hover:from-[#00B8D9] hover:to-[#0099CC] transition-all shadow-lg hover:shadow-xl hover:shadow-[#00D9FF]/20"
              >
                <Package className="w-4 h-4" />
                创建寄存
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 订台信息 */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
                <h3 className="text-lg font-bold text-white mb-6">订台信息</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-[#A0AEC0] mb-1">订台编号</p>
                    <p className="text-sm font-mono text-[#00D9FF]">#{booking.bookingId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0AEC0] mb-1">台位信息</p>
                    <p className="text-sm text-white">
                      {booking.area} {booking.tableNumber} 号台
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0AEC0] mb-1">客户姓名</p>
                    <p className="text-sm text-white">{booking.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0AEC0] mb-1">联系电话</p>
                    <p className="text-sm text-white">{booking.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0AEC0] mb-1">预订时间</p>
                    <p className="text-sm text-white">{booking.bookingTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0AEC0] mb-1">创建时间</p>
                    <p className="text-sm text-white">{booking.createdAt}</p>
                  </div>
                </div>
              </div>

              {/* 关联寄存 */}
              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">关联寄存</h3>
                  <span className="px-3 py-1 bg-[#F5A623]/20 text-[#F5A623] text-xs font-medium rounded-full">
                    {booking.deposits.length} 个寄存
                  </span>
                </div>

                <div className="space-y-4">
                  {booking.deposits.map((deposit) => (
                    <div
                      key={deposit.id}
                      className="p-4 bg-[#0D1117] rounded-lg border border-[#2D3748]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#00D9FF]" />
                          <span className="font-mono text-sm text-[#00D9FF]">
                            {deposit.depositCode}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            deposit.status === 'active'
                              ? 'bg-[#4ECDC4]/20 text-[#4ECDC4] border-[#4ECDC4]'
                              : 'bg-[#F5A623]/20 text-[#F5A623] border-[#F5A623]'
                          }`}
                        >
                          {deposit.status === 'active' ? '进行中' : '部分取完'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {deposit.items.map((item, idx) => (
                          <p key={idx} className="text-sm text-[#A0AEC0]">
                            {item}
                          </p>
                        ))}
                      </div>
                      <Link
                        href={`/deposit/${deposit.id}`}
                        className="inline-flex items-center gap-1 mt-3 text-sm text-[#00D9FF] hover:bg-[#00D9FF]/10 px-2 py-1 rounded transition-colors"
                      >
                        查看详情
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 侧边栏 */}
            <div className="space-y-6">
              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
                <h3 className="text-lg font-bold text-white mb-4">快捷操作</h3>
                <div className="space-y-3">
                  <Link
                    href={`/deposit/new?booking=${booking.bookingId}`}
                    className="flex items-center gap-2 p-3 bg-[#0D1117] rounded-lg border border-[#2D3748] text-[#A0AEC0] hover:bg-[#252B3B] hover:text-white transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    新建寄存
                  </Link>
                  <button className="w-full flex items-center gap-2 p-3 bg-[#0D1117] rounded-lg border border-[#2D3748] text-[#A0AEC0] hover:bg-[#252B3B] hover:text-white transition-colors">
                    <Phone className="w-4 h-4" />
                    联系客户
                  </button>
                </div>
              </div>

              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
                <h3 className="text-lg font-bold text-white mb-4">消费统计</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#A0AEC0]">寄存物品</span>
                    <span className="text-sm font-medium text-white">5 件</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#A0AEC0]">已核销</span>
                    <span className="text-sm font-medium text-[#F5A623]">2 件</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#A0AEC0]">剩余</span>
                    <span className="text-sm font-medium text-[#4ECDC4]">3 件</span>
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
