'use client'

import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    ClipboardCheck,
    FileText
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface InspectionDetail {
  id: string
  status: string
  quantityReceived: number
  quantityInspected: number
  inspectionDate: string | null
  reportUrl: string | null
  notes: string | null
  createdAt: string
  purchaseOrder: {
    id: string
    orderNumber: string
    status: string
    supplier: { name: string }
    part: { name: string; partNumber: string }
    drawing: { id: string; version: string; revision: string } | null
  }
  inspector: { name: string }
  inspectionItems: Array<{
    id: string
    itemName: string
    specification: string
    actualValue: string | null
    isConforming: boolean
    remark: string | null
  }>
  exceptions: Array<{
    id: string
    exceptionNumber: string
    title: string
    status: string
    type: string
  }>
}

export default function InspectionDetailPage() {
  const params = useParams()
  const [inspection, setInspection] = useState<InspectionDetail | null>(null)

  useEffect(() => {
    fetchInspection()
  }, [params.id])

  const fetchInspection = async () => {
    try {
      const response = await fetch(`/api/inspections/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setInspection(data)
      }
    } catch (error) {
      console.error('Failed to fetch inspection:', error)
    }
  }

  if (!inspection) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">加载中...</p>
        </div>
      </Layout>
    )
  }

  const failedItems = inspection.inspectionItems.filter((i) => !i.isConforming)
  const hasFailures = failedItems.length > 0

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <Link href="/inspections" className="text-primary-600 text-sm flex items-center gap-1 mb-4">
            <ArrowLeft size={16} /> 返回检验列表
          </Link>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                hasFailures ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <ClipboardCheck size={28} className={hasFailures ? 'text-red-600' : 'text-green-600'} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-bold text-gray-900">来料检验</h1>
                  <StatusBadge type="inspection" status={inspection.status} />
                </div>
                <p className="text-gray-600">
                  {inspection.purchaseOrder.orderNumber} · {inspection.purchaseOrder.part.name}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">关联订单</p>
              <Link href={`/orders/${inspection.purchaseOrder.id}`} className="font-medium text-primary-600 hover:underline">
                {inspection.purchaseOrder.orderNumber}
              </Link>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">供应商</p>
              <p className="font-medium text-gray-900">{inspection.purchaseOrder.supplier.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">零件</p>
              <p className="font-medium text-gray-900">{inspection.purchaseOrder.part.name}</p>
              <p className="text-sm text-gray-500">{inspection.purchaseOrder.part.partNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">收货数量</p>
              <p className="font-medium text-gray-900">{inspection.quantityReceived} 件</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">抽检数量</p>
              <p className="font-medium text-gray-900">{inspection.quantityInspected} 件</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">检验员</p>
              <p className="font-medium text-gray-900">{inspection.inspector.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">检验日期</p>
              <p className="font-medium text-gray-900">{formatDate(inspection.inspectionDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">记录时间</p>
              <p className="font-medium text-gray-900">{formatDateTime(inspection.createdAt)}</p>
            </div>
            {inspection.purchaseOrder.drawing && (
              <div>
                <p className="text-sm text-gray-500 mb-1">关联图纸</p>
                <Link href={`/drawings/${inspection.purchaseOrder.drawing.id}`} className="font-medium text-primary-600 hover:underline">
                  v{inspection.purchaseOrder.drawing.version}.{inspection.purchaseOrder.drawing.revision}
                </Link>
              </div>
            )}
          </div>

          {inspection.notes && (
            <div className="p-4 bg-gray-50 rounded-xl mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">检验备注</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{inspection.notes}</p>
            </div>
          )}

          {hasFailures && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle size={18} />
                <span className="font-medium">发现 {failedItems.length} 项不合格</span>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">检验项目明细</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">检验项目</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">规格要求</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">实测值</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">判定</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inspection.inspectionItems.map((item) => (
                  <tr key={item.id} className={!item.isConforming ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3 text-gray-900">{item.itemName}</td>
                    <td className="px-4 py-3 text-gray-600">{item.specification}</td>
                    <td className="px-4 py-3 font-mono text-gray-900">{item.actualValue || '-'}</td>
                    <td className="px-4 py-3">
                      {item.isConforming ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={16} /> 合格
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                          <AlertTriangle size={16} /> 不合格
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.remark || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {inspection.exceptions.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">关联异常单</h2>
            </div>
            <div className="space-y-3">
              {inspection.exceptions.map((exc) => (
                <Link
                  key={exc.id}
                  href={`/exceptions/${exc.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{exc.exceptionNumber}</span>
                        <StatusBadge type="exception" status={exc.status} />
                      </div>
                      <p className="text-sm text-gray-600">{exc.title}</p>
                    </div>
                    <span className="text-primary-600 text-sm">查看详情</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
