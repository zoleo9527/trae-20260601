'use client'

import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    ClipboardCheck,
    FileText,
    ShoppingCart
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface InspectionRef {
  id: string
  status: string
  quantityReceived: number
  quantityInspected: number
  inspectionDate: string | null
  inspector: { name: string }
  inspectionItems: Array<{
    itemName: string
    specification: string
    actualValue: string | null
    isConforming: boolean
    remark: string | null
  }>
}

interface ExceptionRef {
  id: string
  exceptionNumber: string
  title: string
  status: string
  type: string
}

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  quantity: number
  unitPrice: number | null
  totalPrice: number | null
  expectedDeliveryDate: string | null
  actualDeliveryDate: string | null
  drawingConfirmed: boolean
  drawingConfirmedAt: string | null
  notes: string | null
  createdAt: string
  supplier: { id: string; name: string; contactName: string; email: string; phone: string | null }
  part: { id: string; partNumber: string; name: string }
  drawing: { id: string; version: string; revision: string; title: string; status: string } | null
  createdBy: { id: string; name: string }
  inspections: InspectionRef[]
  exceptions: ExceptionRef[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const [order, setOrder] = useState<OrderDetail | null>(null)

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`)
      const data = await response.json()
      setOrder(data)
    } catch (error) {
      console.error('Failed to fetch order:', error)
    }
  }

  if (!order) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">加载中...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <Link href="/orders" className="text-primary-600 text-sm flex items-center gap-1 mb-4">
            <ArrowLeft size={16} /> 返回订单列表
          </Link>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <ShoppingCart size={28} className="text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-bold text-gray-900">{order.orderNumber}</h1>
                  <StatusBadge type="order" status={order.status} />
                </div>
                <p className="text-gray-600">{order.part.name} ({order.part.partNumber})</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">供应商</p>
              <p className="font-medium text-gray-900">{order.supplier.name}</p>
              <p className="text-sm text-gray-500">{order.supplier.contactName} · {order.supplier.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">数量 / 单价</p>
              <p className="font-medium text-gray-900">{order.quantity} 件</p>
              {order.unitPrice && <p className="text-sm text-gray-500">¥{Number(order.unitPrice)} / 件</p>}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">创建人</p>
              <p className="font-medium text-gray-900">{order.createdBy.name}</p>
              <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">预计交货</p>
              <p className="font-medium text-gray-900">{formatDate(order.expectedDeliveryDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">实际到货</p>
              <p className="font-medium text-gray-900">{formatDate(order.actualDeliveryDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">总金额</p>
              <p className="font-medium text-gray-900">
                {order.totalPrice ? `¥${Number(order.totalPrice).toLocaleString()}` : '-'}
              </p>
            </div>
          </div>

          {order.drawing && (
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">
                      关联图纸：v{order.drawing.version}.{order.drawing.revision} - {order.drawing.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge type="drawing" status={order.drawing.status} />
                      {order.drawingConfirmed ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle size={12} /> 已确认
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle size={12} /> 版本未确认
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Link href={`/drawings/${order.drawing.id}`} className="text-primary-600 text-sm hover:underline">
                  查看图纸详情
                </Link>
              </div>
            </div>
          )}

          {order.notes && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">备注</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ClipboardCheck size={20} className="text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">检验记录</h2>
          </div>
          {order.inspections.length > 0 ? (
            <div className="space-y-4">
              {order.inspections.map((insp) => {
                const failedCount = insp.inspectionItems.filter((i) => !i.isConforming).length
                return (
                  <div key={insp.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <StatusBadge type="inspection" status={insp.status} />
                        <span className="text-sm text-gray-500">
                          检验员：{insp.inspector.name} · {formatDate(insp.inspectionDate)}
                        </span>
                      </div>
                      <Link href={`/inspections/${insp.id}`} className="text-primary-600 text-sm hover:underline">
                        查看详情
                      </Link>
                    </div>
                    <div className="flex items-center gap-6 text-sm mb-3">
                      <span>收货：{insp.quantityReceived} 件</span>
                      <span>抽检：{insp.quantityInspected} 件</span>
                      {failedCount > 0 && (
                        <span className="text-red-600 font-medium">{failedCount} 项不合格</span>
                      )}
                    </div>
                    {insp.inspectionItems.length > 0 && (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="py-2 text-left text-gray-500">检验项</th>
                            <th className="py-2 text-left text-gray-500">规格</th>
                            <th className="py-2 text-left text-gray-500">实测</th>
                            <th className="py-2 text-left text-gray-500">结果</th>
                          </tr>
                        </thead>
                        <tbody>
                          {insp.inspectionItems.map((item, idx) => (
                            <tr key={idx} className={!item.isConforming ? 'bg-red-50' : ''}>
                              <td className="py-1.5 text-gray-900">{item.itemName}</td>
                              <td className="py-1.5 text-gray-600">{item.specification}</td>
                              <td className="py-1.5 font-mono text-gray-900">{item.actualValue || '-'}</td>
                              <td className="py-1.5">
                                {item.isConforming ? (
                                  <span className="text-green-600">合格</span>
                                ) : (
                                  <span className="text-red-600 font-medium">不合格</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">暂无检验记录</p>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">异常单</h2>
          </div>
          {order.exceptions.length > 0 ? (
            <div className="space-y-3">
              {order.exceptions.map((exc) => (
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
                    <span className="text-primary-600 text-sm">查看</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">暂无异常单</p>
          )}
        </div>
      </div>
    </Layout>
  )
}
