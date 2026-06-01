'use client'

import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'
import { ClipboardCheck, Package, AlertCircle, Eye } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Inspection {
  id: string
  purchaseOrder: {
    orderNumber: string
    supplier: { name: string }
    part: { name: string }
  }
  inspector: { name: string }
  quantityReceived: number
  quantityInspected: number
  status: string
  inspectionDate: string
  inspectionItems: Array<{ isConforming: boolean }>
  createdAt: string
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])

  useEffect(() => {
    fetchInspections()
  }, [])

  const fetchInspections = async () => {
    try {
      const response = await fetch('/api/inspections')
      const data = await response.json()
      setInspections(data)
    } catch (error) {
      console.error('Failed to fetch inspections:', error)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">来料检验</h1>
            <p className="text-gray-500 mt-1">记录和管理来料检验结果</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {inspections.map((inspection) => {
            const failedItems = inspection.inspectionItems.filter(
              (item) => !item.isConforming
            ).length
            const hasFailures = failedItems > 0

            return (
              <div key={inspection.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      hasFailures ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <ClipboardCheck size={24} className={hasFailures ? 'text-red-600' : 'text-green-600'} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {inspection.purchaseOrder.orderNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {inspection.purchaseOrder.part.name}
                      </p>
                    </div>
                  </div>
                  <StatusBadge type="inspection" status={inspection.status} />
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package size={16} className="text-gray-400" />
                    <span>供应商：{inspection.purchaseOrder.supplier.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">收货数量</span>
                    <span className="font-medium text-gray-900">{inspection.quantityReceived} 件</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">抽检数量</span>
                    <span className="font-medium text-gray-900">{inspection.quantityInspected} 件</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">检验员</span>
                    <span className="font-medium text-gray-900">{inspection.inspector.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">检验日期</span>
                    <span className="font-medium text-gray-900">{formatDate(inspection.inspectionDate)}</span>
                  </div>
                </div>

                {hasFailures && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle size={16} />
                      <span className="font-medium">{failedItems} 项不合格</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {inspection.inspectionItems.length} 项检验
                  </span>
                  <Link 
                    href={`/inspections/${inspection.id}`}
                    className="text-primary-600 text-sm flex items-center gap-1"
                  >
                    查看详情 <Eye size={14} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
