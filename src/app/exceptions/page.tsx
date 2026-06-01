'use client'

import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'
import { AlertTriangle, User, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Exception {
  id: string
  exceptionNumber: string
  title: string
  status: string
  type: string
  purchaseOrder: {
    orderNumber: string
    supplier: { name: string }
    part: { name: string }
  }
  reportedBy: { name: string }
  createdAt: string
}

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<Exception[]>([])

  useEffect(() => {
    fetchExceptions()
  }, [])

  const fetchExceptions = async () => {
    try {
      const response = await fetch('/api/exceptions')
      const data = await response.json()
      setExceptions(data)
    } catch (error) {
      console.error('Failed to fetch exceptions:', error)
    }
  }

  const typeLabels: Record<string, string> = {
    DRAWING_VERSION_MISMATCH: '图纸版本不匹配',
    DIMENSION_OUT_OF_TOLERANCE: '尺寸超差',
    SURFACE_QUALITY_ISSUE: '表面质量问题',
    MATERIAL_DEFECT: '材料缺陷',
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">异常处置</h1>
            <p className="text-gray-500 mt-1">管理来料检验异常和质量问题</p>
          </div>
        </div>

        <div className="space-y-4">
          {exceptions.map((exception) => (
            <Link
              key={exception.id}
              href={`/exceptions/${exception.id}`}
              className="card p-6 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    exception.status === 'REPORTED' ? 'bg-red-100' : 
                    exception.status === 'CLOSED' ? 'bg-gray-100' : 'bg-yellow-100'
                  }`}>
                    <AlertTriangle size={24} className={
                      exception.status === 'REPORTED' ? 'text-red-600' : 
                      exception.status === 'CLOSED' ? 'text-gray-600' : 'text-yellow-600'
                    } />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {exception.exceptionNumber}
                      </h3>
                      <StatusBadge type="exception" status={exception.status} />
                    </div>
                    <p className="text-gray-600 mb-3">{exception.title}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span>{exception.purchaseOrder.orderNumber}</span>
                      <span>{exception.purchaseOrder.part.name}</span>
                      <span>{exception.purchaseOrder.supplier.name}</span>
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {exception.reportedBy.name}
                      </span>
                      <span>{formatDate(exception.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  )
}
