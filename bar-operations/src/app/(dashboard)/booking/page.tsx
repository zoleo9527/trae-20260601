'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Plus, Search, CalendarDays, User, Phone, Package, Eye } from 'lucide-react'

interface Booking {
  id: string
  bookingId: string
  tableNumber: string
  area: string
  customerName: string
  customerPhone: string
  bookingTime: string
  status: 'active' | 'completed' | 'cancelled'
  depositCount: number
}

const mockBookings: Booking[] = [
  {
    id: '1',
    bookingId: 'A123',
    tableNumber: '03',
    area: 'A区',
    customerName: '王先生',
    customerPhone: '139****1234',
    bookingTime: '2024-06-17 20:00',
    status: 'active',
    depositCount: 1,
  },
  {
    id: '2',
    bookingId: 'C205',
    tableNumber: '05',
    area: 'C区',
    customerName: '李女士',
    customerPhone: '138****5678',
    bookingTime: '2024-06-17 21:00',
    status: 'active',
    depositCount: 1,
  },
  {
    id: '3',
    bookingId: 'B102',
    tableNumber: '02',
    area: 'B区',
    customerName: '张先生',
    customerPhone: '137****9876',
    bookingTime: '2024-06-16 20:00',
    status: 'completed',
    depositCount: 2,
  },
]

const statusColors = {
  active: 'bg-[#4ECDC4]/20 text-[#4ECDC4] border-[#4ECDC4]',
  completed: 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]',
  cancelled: 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]',
}

const statusText = {
  active: '待消费',
  completed: '已完成',
  cancelled: '已取消',
}

export default function BookingListPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBookings = mockBookings.filter(
    (booking) =>
      booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerName.includes(searchTerm) ||
      booking.tableNumber.includes(searchTerm)
  )

  return (
    <div className="min-h-screen">
      <Header title="订台管理" subtitle="管理所有订台记录" />

      <div className="p-8 space-y-6">
        {/* 搜索和操作栏 */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0AEC0]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索订台编号、台位或客户姓名..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#1A1F2E] border border-[#2D3748] rounded-lg text-white placeholder-[#A0AEC0] focus:outline-none focus:border-[#00D9FF] transition-all"
            />
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00D9FF] to-[#00B8D9] text-white font-medium rounded-lg hover:from-[#00B8D9] hover:to-[#0099CC] transition-all shadow-lg hover:shadow-xl hover:shadow-[#00D9FF]/20">
            <Plus className="w-5 h-5" />
            新建订台
          </button>
        </div>

        {/* 订台卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6 hover:bg-[#252B3B] transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00D9FF] to-[#F5A623] rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{booking.tableNumber}</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0AEC0]">{booking.area}</p>
                    <p className="text-lg font-bold text-white">#{booking.bookingId}</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[booking.status]}`}
                >
                  {statusText[booking.status]}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#A0AEC0]" />
                  <span className="text-sm text-white">{booking.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#A0AEC0]" />
                  <span className="text-sm text-[#A0AEC0]">{booking.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#A0AEC0]" />
                  <span className="text-sm text-[#A0AEC0]">{booking.bookingTime}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2D3748] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#F5A623]" />
                  <span className="text-sm text-[#F5A623]">{booking.depositCount} 个寄存</span>
                </div>
                <Link
                  href={`/booking/${booking.id}`}
                  className="flex items-center gap-1 text-sm text-[#00D9FF] hover:bg-[#00D9FF]/10 px-2 py-1 rounded transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  详情
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-12 text-center">
            <CalendarDays className="w-12 h-12 text-[#A0AEC0] mx-auto mb-4" />
            <p className="text-[#A0AEC0]">暂无订台记录</p>
          </div>
        )}
      </div>
    </div>
  )
}
