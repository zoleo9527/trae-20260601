'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import {
  ScanLine,
  Package,
  User,
  Phone,
  Calendar,
  Camera,
  FileText,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react'

interface RedeemRecord {
  id: string
  depositCode: string
  depositId: string
  customerName: string
  customerPhone: string | null
  itemName: string
  category: string
  quantity: number
  operator: string
  time: string
  notes?: string
}

export default function RedeemDetailPage({ params }: { params: { id: string } }) {
  const [record, setRecord] = useState<RedeemRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecord = async () => {
      const response = await fetch(`/api/redeem/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setRecord(result.data)
      }
      setLoading(false)
    }

    fetchRecord()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00D9FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-[#FF6B6B] mx-auto mb-4" />
          <p className="text-[#A0AEC0]">核销记录不存在</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="核销详情" subtitle={`核销记录 #${record.id}`} />

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/redeem/history"
            className="inline-flex items-center gap-2 text-[#A0AEC0] hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            返回核销历史
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 主要信息 */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
                <div className="flex items-center gap-2 mb-6">
                  <ScanLine className="w-5 h-5 text-[#00D9FF]" />
                  <h3 className="text-lg font-bold text-white">核销信息</h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-[#A0AEC0] mb-1">寄存编号</p>
                    <p className="text-sm font-mono text-[#00D9FF]">{record.depositCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0AEC0] mb-1">核销时间</p>
                    <p className="text-sm text-white">{record.time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0AEC0] mb-1">客户姓名</p>
                    <p className="text-sm text-white">{record.customerName}</p>
                  </div>
                  {record.customerPhone && (
                    <div>
                      <p className="text-xs text-[#A0AEC0] mb-1">联系电话</p>
                      <p className="text-sm text-white">{record.customerPhone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[#A0AEC0] mb-1">核销物品</p>
                    <p className="text-sm text-white">{record.itemName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0AEC0] mb-1">物品分类</p>
                    <p className="text-sm text-white">{record.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0AEC0] mb-1">核销数量</p>
                    <p className="text-lg font-bold text-[#F5A623]">×{record.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0AEC0] mb-1">操作人</p>
                    <p className="text-sm text-white">{record.operator}</p>
                    <p className="text-xs text-[#A0AEC0]">吧台</p>
                  </div>
                </div>

                {record.notes && (
                  <div className="mt-6 pt-6 border-t border-[#2D3748]">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-[#A0AEC0]" />
                      <p className="text-sm text-[#A0AEC0]">备注信息</p>
                    </div>
                    <p className="text-sm text-white">{record.notes}</p>
                  </div>
                )}
              </div>

              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="w-5 h-5 text-[#00D9FF]" />
                  <h3 className="text-lg font-bold text-white">现场照片</h3>
                </div>
                <div className="aspect-video bg-[#0D1117] rounded-lg border border-[#2D3748] flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-[#A0AEC0] mx-auto mb-2" />
                    <p className="text-sm text-[#A0AEC0]">暂无照片</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 侧边栏 */}
            <div className="space-y-6">
              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
                <h3 className="text-lg font-bold text-white mb-4">相关操作</h3>
                <div className="space-y-3">
                  <Link
                    href={`/deposit/${record.depositId}`}
                    className="flex items-center gap-2 p-3 bg-[#0D1117] rounded-lg border border-[#2D3748] text-[#A0AEC0] hover:bg-[#252B3B] hover:text-white transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    查看寄存详情
                  </Link>
                  <button className="w-full flex items-center gap-2 p-3 bg-[#0D1117] rounded-lg border border-[#2D3748] text-[#A0AEC0] hover:bg-[#252B3B] hover:text-white transition-colors">
                    <FileText className="w-4 h-4" />
                    导出核销凭证
                  </button>
                </div>
              </div>

              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
                <h3 className="text-lg font-bold text-white mb-4">核销追溯</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#00D9FF] mt-1.5"></div>
                    <div>
                      <p className="text-sm text-white">核销创建</p>
                      <p className="text-xs text-[#A0AEC0]">{record.time}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#4ECDC4] mt-1.5"></div>
                    <div>
                      <p className="text-sm text-white">记录已保存</p>
                      <p className="text-xs text-[#A0AEC0]">系统自动归档</p>
                    </div>
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