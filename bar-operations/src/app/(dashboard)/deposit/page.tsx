'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Plus, Search, Filter, Package, User, Clock, Eye } from 'lucide-react'

interface Deposit {
  id: string
  depositCode: string
  customerName: string
  customerPhone: string
  status: 'active' | 'partially' | 'completed' | 'expired'
  items: Array<{ itemName: string; quantity: number; remaining: number }>
  expiredAt: string
  createdAt: string
  bookingId?: string
}

const mockDeposits: Deposit[] = [
  {
    id: '1',
    depositCode: 'DEP-20240616-C4D5',
    customerName: '李女士',
    customerPhone: '138****5678',
    status: 'active',
    items: [
      { itemName: '威士忌', quantity: 2, remaining: 2 },
      { itemName: '啤酒', quantity: 6, remaining: 6 },
    ],
    expiredAt: '2024-07-16',
    createdAt: '2024-06-16 20:30',
    bookingId: 'C205',
  },
  {
    id: '2',
    depositCode: 'DEP-20240615-A3F2',
    customerName: '王先生',
    customerPhone: '139****1234',
    status: 'partially',
    items: [
      { itemName: '威士忌', quantity: 3, remaining: 1 },
      { itemName: '红酒', quantity: 2, remaining: 2 },
    ],
    expiredAt: '2024-07-15',
    createdAt: '2024-06-15 21:00',
    bookingId: 'A123',
  },
  {
    id: '3',
    depositCode: 'DEP-20240601-X1Y2',
    customerName: '张先生',
    customerPhone: '137****9876',
    status: 'expired',
    items: [{ itemName: '白酒', quantity: 3, remaining: 3 }],
    expiredAt: '2024-07-01',
    createdAt: '2024-06-01 22:00',
  },
]

const statusColors = {
  active: 'bg-[#4ECDC4]/20 text-[#4ECDC4] border-[#4ECDC4]',
  partially: 'bg-[#F5A623]/20 text-[#F5A623] border-[#F5A623]',
  completed: 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]',
  expired: 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]',
}

const statusText = {
  active: '进行中',
  partially: '部分取完',
  completed: '已完成',
  expired: '已过期',
}

export default function DepositListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredDeposits = mockDeposits.filter((deposit) => {
    const matchesSearch =
      deposit.depositCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.customerName.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || deposit.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen">
      <Header title="酒水寄存" subtitle="管理所有寄存记录" />

      <div className="p-8 space-y-6">
        {/* 搜索和筛选栏 */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0AEC0]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索寄存编号或客户姓名..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#1A1F2E] border border-[#2D3748] rounded-lg text-white placeholder-[#A0AEC0] focus:outline-none focus:border-[#00D9FF] transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#1A1F2E] border border-[#2D3748] rounded-lg text-white focus:outline-none focus:border-[#00D9FF] transition-all"
          >
            <option value="all">全部状态</option>
            <option value="active">进行中</option>
            <option value="partially">部分取完</option>
            <option value="completed">已完成</option>
            <option value="expired">已过期</option>
          </select>

          <Link
            href="/deposit/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00D9FF] to-[#00B8D9] text-white font-medium rounded-lg hover:from-[#00B8D9] hover:to-[#0099CC] transition-all shadow-lg hover:shadow-xl hover:shadow-[#00D9FF]/20"
          >
            <Plus className="w-5 h-5" />
            新建寄存
          </Link>
        </div>

        {/* 寄存列表 */}
        <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0D1117] border-b border-[#2D3748]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase tracking-wider">
                    寄存编号
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase tracking-wider">
                    客户信息
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase tracking-wider">
                    寄存物品
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase tracking-wider">
                    有效期至
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3748]">
                {filteredDeposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-[#252B3B] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#00D9FF]" />
                        <span className="font-mono text-sm text-white">{deposit.depositCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#A0AEC0]" />
                        <div>
                          <p className="text-sm font-medium text-white">{deposit.customerName}</p>
                          <p className="text-xs text-[#A0AEC0]">{deposit.customerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {deposit.items.map((item, idx) => (
                          <p key={idx} className="text-sm text-[#A0AEC0]">
                            {item.itemName} × {item.remaining}/{item.quantity}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[deposit.status]}`}
                      >
                        {statusText[deposit.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#A0AEC0]" />
                        <span className="text-sm text-[#A0AEC0]">{deposit.expiredAt}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#A0AEC0]">
                      {deposit.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/deposit/${deposit.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#00D9FF] hover:bg-[#00D9FF]/10 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDeposits.length === 0 && (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-[#A0AEC0] mx-auto mb-4" />
              <p className="text-[#A0AEC0]">暂无寄存记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
