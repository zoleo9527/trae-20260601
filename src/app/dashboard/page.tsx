'use client'

import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { FileText, ShoppingCart, ClipboardCheck, AlertTriangle, ChevronRight, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  status: string
  supplier: { name: string }
  part: { name: string }
  quantity: number
  expectedDeliveryDate: string
}

interface Exception {
  id: string
  exceptionNumber: string
  title: string
  status: string
  purchaseOrder: { orderNumber: string }
  createdAt: string
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [exceptions, setExceptions] = useState<Exception[]>([])
  const [stats, setStats] = useState({
    orders: 0,
    exceptions: 0,
    drawings: 0,
    inspections: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [ordersRes, exceptionsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/exceptions'),
      ])

      const ordersData = await ordersRes.json()
      const exceptionsData = await exceptionsRes.json()

      setOrders(ordersData.slice(0, 5))
      setExceptions(exceptionsData.slice(0, 5))
      setStats({
        orders: ordersData.length,
        exceptions: exceptionsData.filter((e: Exception) => e.status !== 'CLOSED').length,
        drawings: 4,
        inspections: 2,
      })
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  const statCards = [
    { label: '外协订单', value: stats.orders, icon: ShoppingCart, href: '/orders', color: 'bg-blue-500' },
    { label: '待处理异常', value: stats.exceptions, icon: AlertTriangle, href: '/exceptions', color: 'bg-red-500' },
    { label: '图纸版本', value: stats.drawings, icon: FileText, href: '/drawings', color: 'bg-purple-500' },
    { label: '检验记录', value: stats.inspections, icon: ClipboardCheck, href: '/inspections', color: 'bg-green-500' },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="text-gray-500 mt-1">欢迎回来，{user?.name}</p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <Icon size={24} className="text-white" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">最近订单</h2>
              <Link href="/orders" className="text-primary-600 text-sm flex items-center gap-1">
                查看全部 <ChevronRight size={16} />
              </Link>
            </div>
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{order.part.name} · {order.quantity}件</p>
                  </div>
                  <StatusBadge type="order" status={order.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">异常单</h2>
              <Link href="/exceptions" className="text-primary-600 text-sm flex items-center gap-1">
                查看全部 <ChevronRight size={16} />
              </Link>
            </div>
            <div className="space-y-3">
              {exceptions.map((exception) => (
                <Link
                  key={exception.id}
                  href={`/exceptions/${exception.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{exception.exceptionNumber}</p>
                        <StatusBadge type="exception" status={exception.status} />
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{exception.title}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(exception.createdAt)}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-yellow-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">需要关注</h2>
              <p className="text-sm text-gray-500">当前系统中的关键事项</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="font-medium text-yellow-800">图纸变更待确认</p>
              <p className="text-2xl font-bold text-yellow-900 mt-2">1</p>
              <p className="text-sm text-yellow-600 mt-1">订单 PO-2026-06-001</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="font-medium text-red-800">尺寸超差待处理</p>
              <p className="text-2xl font-bold text-red-900 mt-2">1</p>
              <p className="text-sm text-red-600 mt-1">订单 PO-2026-06-002</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="font-medium text-blue-800">让步接收复检中</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">1</p>
              <p className="text-sm text-blue-600 mt-1">订单 PO-2026-06-003</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
