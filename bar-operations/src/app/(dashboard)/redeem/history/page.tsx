'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Search, Filter, ScanLine, User, Calendar, Download, Eye } from 'lucide-react'

interface RedeemRecord {
  id: string
  depositCode: string
  customerName: string
  itemName: string
  quantity: number
  operator: string
  time: string
  notes?: string
}

const mockRecords: RedeemRecord[] = [
  {
    id: '1',
    depositCode: 'DEP-20240615-A3F2',
    customerName: '王先生',
    itemName: '尊尼获加',
    quantity: 2,
    operator: '小李',
    time: '2024-06-16 22:00',
  },
  {
    id: '2',
    depositCode: 'DEP-20240615-A3F2',
    customerName: '王先生',
    itemName: '尊尼获加',
    quantity: 1,
    operator: '小王',
    time: '2024-06-17 21:30',
    notes: '客户要求开一瓶年份老的',
  },
  {
    id: '3',
    depositCode: 'DEP-20240614-E5F6',
    customerName: '李女士',
    itemName: '拉菲',
    quantity: 1,
    operator: '小李',
    time: '2024-06-17 20:15',
  },
  {
    id: '4',
    depositCode: 'DEP-20240613-G7H8',
    customerName: '张先生',
    itemName: '啤酒',
    quantity: 6,
    operator: '小张',
    time: '2024-06-17 19:00',
  },
]

export default function RedeemHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState('today')

  const filteredRecords = mockRecords.filter((record) => {
    return (
      record.depositCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customerName.includes(searchTerm) ||
      record.itemName.includes(searchTerm)
    )
  })

  return (
    <div className="min-h-screen">
      <Header title="核销历史" subtitle="查看所有核销记录" />

      <div className="p-8 space-y-6">
        {/* 搜索和筛选栏 */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0AEC0]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索寄存编号、客户姓名或酒水名称..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#1A1F2E] border border-[#2D3748] rounded-lg text-white placeholder-[#A0AEC0] focus:outline-none focus:border-[#00D9FF] transition-all"
            />
          </div>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 bg-[#1A1F2E] border border-[#2D3748] rounded-lg text-white focus:outline-none focus:border-[#00D9FF] transition-all"
          >
            <option value="today">今天</option>
            <option value="yesterday">昨天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="all">全部时间</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1F2E] border border-[#2D3748] text-[#A0AEC0] rounded-lg hover:bg-[#252B3B] transition-colors">
            <Download className="w-5 h-5" />
            导出
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#1A1F2E] rounded-lg border border-[#2D3748]">
            <p className="text-sm text-[#A0AEC0] mb-1">今日核销次数</p>
            <p className="text-2xl font-bold text-[#00D9FF]">12</p>
          </div>
          <div className="p-4 bg-[#1A1F2E] rounded-lg border border-[#2D3748]">
            <p className="text-sm text-[#A0AEC0] mb-1">今日核销件数</p>
            <p className="text-2xl font-bold text-[#F5A623]">28</p>
          </div>
          <div className="p-4 bg-[#1A1F2E] rounded-lg border border-[#2D3748]">
            <p className="text-sm text-[#A0AEC0] mb-1">涉及寄存单</p>
            <p className="text-2xl font-bold text-[#4ECDC4]">8</p>
          </div>
        </div>

        {/* 核销记录列表 */}
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
                    核销物品
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase tracking-wider">
                    数量
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase tracking-wider">
                    操作人
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase tracking-wider">
                    时间
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3748]">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-[#252B3B] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <ScanLine className="w-4 h-4 text-[#00D9FF]" />
                        <span className="font-mono text-sm text-white">{record.depositCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#A0AEC0]" />
                        <span className="text-sm text-white">{record.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#A0AEC0]">
                      {record.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F5A623]/20 text-[#F5A623]">
                        ×{record.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#A0AEC0]">
                      {record.operator}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#A0AEC0]" />
                        <span className="text-sm text-[#A0AEC0]">{record.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/redeem/${record.id}`}
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

          {filteredRecords.length === 0 && (
            <div className="p-12 text-center">
              <ScanLine className="w-12 h-12 text-[#A0AEC0] mx-auto mb-4" />
              <p className="text-[#A0AEC0]">暂无核销记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
