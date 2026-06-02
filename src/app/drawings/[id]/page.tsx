'use client'

import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    Clock,
    Download,
    FileText,
    ShoppingCart,
    User,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface DrawingVersion {
  id: string
  version: string
  revision: string
  title: string
  description: string
  status: string
  fileName: string
  fileUrl: string
  changeLog: string
  canUseOldVersion: boolean
  isObsolete: boolean
  createdAt: string
  createdBy: { id: string; name: string }
  approvedAt: string | null
}

interface OrderRef {
  id: string
  orderNumber: string
  status: string
  quantity: number
  supplier: { name: string }
  drawing: { id: string; version: string; revision: string; title: string } | null
  drawingConfirmed: boolean
  exceptions: Array<{ id: string; exceptionNumber: string; title: string; status: string; type: string }>
}

interface DrawingDetail {
  id: string
  version: string
  revision: string
  title: string
  description: string
  status: string
  fileName: string
  fileUrl: string
  changeLog: string
  canUseOldVersion: boolean
  isObsolete: boolean
  part: { id: string; partNumber: string; name: string }
  createdBy: { id: string; name: string }
  approvedAt: string | null
  createdAt: string
  versionHistory: DrawingVersion[]
  purchaseOrders: OrderRef[]
}

export default function DrawingDetailPage() {
  const params = useParams()
  const [drawing, setDrawing] = useState<DrawingDetail | null>(null)

  useEffect(() => {
    fetchDrawing()
  }, [params.id])

  const fetchDrawing = async () => {
    try {
      const response = await fetch(`/api/drawings/${params.id}`)
      const data = await response.json()
      setDrawing(data)
    } catch (error) {
      console.error('Failed to fetch drawing:', error)
    }
  }

  if (!drawing) {
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
          <Link href="/drawings" className="text-primary-600 text-sm flex items-center gap-1 mb-4">
            <ArrowLeft size={16} /> 返回图纸列表
          </Link>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText size={28} className="text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    {drawing.part.name}
                  </h1>
                  <span className="text-lg font-mono text-primary-600">
                    v{drawing.version}.{drawing.revision}
                  </span>
                  <StatusBadge type="drawing" status={drawing.status} />
                </div>
                <p className="text-gray-600">{drawing.title}</p>
                <p className="text-sm text-gray-500 mt-1">
                  零件号：{drawing.part.partNumber}
                </p>
              </div>
            </div>
            {drawing.fileName && (
              <button className="btn-secondary flex items-center gap-2">
                <Download size={16} />
                {drawing.fileName}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">创建人</p>
              <p className="font-medium text-gray-900">{drawing.createdBy.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">创建时间</p>
              <p className="font-medium text-gray-900">{formatDateTime(drawing.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">批准时间</p>
              <p className="font-medium text-gray-900">{drawing.approvedAt ? formatDate(drawing.approvedAt) : '-'}</p>
            </div>
          </div>

          {drawing.description && (
            <div className="p-4 bg-gray-50 rounded-xl mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">描述</h3>
              <p className="text-gray-600">{drawing.description}</p>
            </div>
          )}

          {drawing.changeLog && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">变更记录</h3>
              <p className="text-blue-700 whitespace-pre-wrap">{drawing.changeLog}</p>
            </div>
          )}

          {drawing.canUseOldVersion && (
            <div className="flex items-center gap-2 text-sm text-green-600 p-3 bg-green-50 rounded-lg">
              <AlertCircle size={16} />
              <span className="font-medium">允许使用旧版本生产</span>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">版本时间线</h2>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {drawing.versionHistory.map((v, index) => {
                const isCurrent = v.id === drawing.id
                return (
                  <div key={v.id} className="relative pl-14">
                    <div className={`absolute left-4 w-5 h-5 rounded-full border-4 ${
                      isCurrent ? 'bg-primary-500 border-primary-200' : 'bg-white border-gray-300'
                    }`} />
                    <div className={`p-4 rounded-xl border ${
                      isCurrent ? 'border-primary-200 bg-primary-50' : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            版本 {v.version}.{v.revision}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">当前</span>
                          )}
                          <StatusBadge type="drawing" status={v.status} />
                        </div>
                        {!isCurrent && (
                          <Link href={`/drawings/${v.id}`} className="text-primary-600 text-sm">
                            查看此版本
                          </Link>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{v.title}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User size={12} /> {v.createdBy.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {formatDateTime(v.createdAt)}
                        </span>
                        {v.approvedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={12} /> 已批准
                          </span>
                        )}
                      </div>
                      {v.changeLog && (
                        <p className="text-sm text-gray-500 mt-2 bg-white p-2 rounded border border-gray-100">
                          {v.changeLog}
                        </p>
                      )}
                      {v.canUseOldVersion && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <AlertCircle size={12} /> 允许使用旧版本
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart size={20} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">关联订单</h2>
          </div>
          {drawing.purchaseOrders.length > 0 ? (
            <div className="space-y-3">
              {drawing.purchaseOrders.map((order) => {
                const isCurrentVersion = order.drawing?.id === drawing.id
                const orderVersion = order.drawing 
                  ? `v${order.drawing.version}.${order.drawing.revision}`
                  : '未指定版本'
                return (
                  <div key={order.id} className={`p-4 rounded-lg border-2 ${
                    isCurrentVersion ? 'bg-gray-50 border-transparent' : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/orders/${order.id}`} className="font-medium text-primary-600 hover:underline">
                        {order.orderNumber}
                      </Link>
                      <div className="flex items-center gap-2 flex-wrap">
                        {!isCurrentVersion && (
                          <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={12} />
                            使用 {orderVersion}
                          </span>
                        )}
                        <StatusBadge type="order" status={order.status} />
                        {!order.drawingConfirmed && (
                          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={12} />
                            图纸版本未确认
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span>供应商：{order.supplier.name}</span>
                      <span>数量：{order.quantity}</span>
                    </div>
                    {order.exceptions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {order.exceptions.map((exc) => (
                          <Link
                            key={exc.id}
                            href={`/exceptions/${exc.id}`}
                            className="flex items-center gap-2 text-sm text-red-600 hover:underline"
                          >
                            <AlertTriangle size={14} />
                            <span>{exc.exceptionNumber} - {exc.title}</span>
                            <StatusBadge type="exception" status={exc.status} />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">暂无关联订单</p>
          )}
        </div>
      </div>
    </Layout>
  )
}
