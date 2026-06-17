'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Search, Filter, ScanLine, User, Calendar, Download, Eye, RefreshCw } from 'lucide-react'

interface RedeemRecord {
  id: string
  depositCode: string
  depositId: string
  customerName: string
  itemName: string
  quantity: number
  operator: string
  time: string
  notes?: string
}

export default function RedeemHistoryPage() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [records, setRecords] = useState<RedeemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchRecords = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (searchTerm) params.append('search', searchTerm)

    const response = await fetch(`/api/redeem/history?${params}`)
    const result = await response.json()

    if (result.success) {
      setRecords(result.data)
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    const urlSearch = searchParams.get('search')
    if (urlSearch) {
      setSearchTerm(urlSearch)
    }
  }, [searchParams])

  useEffect(() => {
    fetchRecords()
  }, [searchTerm])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchRecords()
  }

  const todayCount = records.filter((r) => r.time.startsWith(new Date().toISOString().slice(0, 10))).length
  const todayTotal = records.filter((r) => r.time.startsWith(new Date().toISOString().slice(0, 10))).reduce((sum, r) => sum + r.quantity, 0)
  const uniqueDeposits = new Set(records.map((r) => r.depositCode)).size

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

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1F2E] border border-[#2D3748] text-[#A0AEC0] rounded-lg hover:bg-[#252B3B] transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1F2E] border border-[#2D3748] text-[#A0AEC0] rounded-lg hover:bg-[#252B3B] transition-colors">
            <Download className="w-5 h-5" />
            导出
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#1A1F2E] rounded-lg border border-[#2D3748]">
            <p className="text-sm text-[#A0AEC0] mb-1">今日核销次数</p>
            <p className="text-2xl font-bold text-[#00D9FF]">{todayCount}</p>
          </div>
          <div className="p-4 bg-[#1A1F2E] rounded-lg border border-[#2D3748]">
            <p className="text-sm text-[#A0AEC0] mb-1">今日核销件数</p>
            <p className="text-2xl font-bold text-[#F5A623]">{todayTotal}</p>
          </div>
          <div className="p-4 bg-[#1A1F2E] rounded-lg border border-[#2D3748]">
            <p className="text-sm text-[#A0AEC0] mb-1">涉及寄存单</p>
            <p className="text-2xl font-bold text-[#4ECDC4]">{uniqueDeposits}</p>
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
                    备注
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#A0AEC0] uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3748]">
                {records.map((record) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#A0AEC0] max-w-[200px] truncate">
                      {record.notes || '-'}
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

          {loading && (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-[#00D9FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#A0AEC0]">加载中...</p>
            </div>
          )}

          {!loading && records.length === 0 && (
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