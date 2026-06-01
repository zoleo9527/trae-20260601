'use client'

import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'
import { ShoppingCart, FileText, AlertTriangle, Eye } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  supplier: { name: string }
  part: { name: string; partNumber: string }
  drawing: { version: string; revision: string } | null
  quantity: number
  status: string
  expectedDeliveryDate: string
  drawingConfirmed: boolean
  exceptions: Array<{ id: string }>
  createdAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">外协订单</h1>
            <p className="text-gray-500 mt-1">管理所有外协加工订单</p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">订单号</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">零件</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">供应商</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">数量</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">图纸版本</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">交货日期</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">状态</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{order.orderNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.part.name}</p>
                      <p className="text-sm text-gray-500">{order.part.partNumber}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{order.supplier.name}</td>
                  <td className="px-6 py-4 text-gray-700">{order.quantity} 件</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {order.drawing ? (
                        <>
                          <FileText size={16} className="text-gray-400" />
                          <span className="text-gray-700">
                            {order.drawing.version}.{order.drawing.revision}
                          </span>
                          {!order.drawingConfirmed && (
                            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              <AlertTriangle size={12} />
                              未确认
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {formatDate(order.expectedDeliveryDate)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge type="order" status={order.status} />
                  </td>
                  <td className="px-6 py-4">
                    <Link 
                      href={`/orders/${order.id}`}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
