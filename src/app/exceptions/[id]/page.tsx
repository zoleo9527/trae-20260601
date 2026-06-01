'use client'

import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import {
  AlertTriangle,
  User,
  FileText,
  Paperclip,
  MessageSquare,
  Clock,
  CheckCircle,
  Send,
  Wrench,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface SupplierFeedback {
  id: string
  content: string
  rootCauseAnalysis: string
  correctiveAction: string
  preventiveAction: string
  supplier: { name: string }
  createdAt: string
}

interface ExceptionDetail {
  id: string
  exceptionNumber: string
  title: string
  description: string
  status: string
  type: string
  rootCause: string
  disposition: string
  concessionDecision: string
  reworkResponsible: string
  purchaseOrder: {
    id: string
    orderNumber: string
    supplier: { name: string }
    part: { name: string; partNumber: string }
    drawing: { version: string; revision: string } | null
  }
  reportedBy: { name: string }
  closedBy: { name: string } | null
  inspection: {
    id: string
    inspectionItems: Array<{
      itemName: string
      specification: string
      actualValue: string
      isConforming: boolean
      remark: string
    }>
  } | null
  supplierFeedbacks: SupplierFeedback[]
  attachments: Array<{
    id: string
    fileName: string
    fileUrl: string
    uploadedBy: { name: string }
  }>
  createdAt: string
}

const dispositionLabels: Record<string, string> = {
  REWORK: '返工',
  SCRAP: '报废',
  CONCESSION: '让步接收',
  RETURN: '退货',
}

const typeLabels: Record<string, string> = {
  DRAWING_VERSION_MISMATCH: '图纸版本不匹配',
  DIMENSION_OUT_OF_TOLERANCE: '尺寸超差',
  SURFACE_QUALITY_ISSUE: '表面质量问题',
  MATERIAL_DEFECT: '材料缺陷',
}

export default function ExceptionDetailPage() {
  const params = useParams()
  const { user } = useAuthStore()
  const [exception, setException] = useState<ExceptionDetail | null>(null)
  const [feedbackForm, setFeedbackForm] = useState({
    content: '',
    rootCauseAnalysis: '',
    correctiveAction: '',
    preventiveAction: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchException()
  }, [params.id])

  const fetchException = async () => {
    try {
      const response = await fetch(`/api/exceptions/${params.id}`)
      const data = await response.json()
      setException(data)
    } catch (error) {
      console.error('Failed to fetch exception:', error)
    }
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/exceptions/${params.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...feedbackForm,
          supplierId: user.id,
        }),
      })

      if (response.ok) {
        setFeedbackForm({
          content: '',
          rootCauseAnalysis: '',
          correctiveAction: '',
          preventiveAction: '',
        })
        fetchException()
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!exception) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">加载中...</p>
        </div>
      </Layout>
    )
  }

  const isSupplier = user?.role === 'SUPPLIER'
  const needsSupplierFeedback = exception.status === 'AWAITING_SUPPLIER_FEEDBACK'

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl">
        <div className="card p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={28} className="text-red-600" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    {exception.exceptionNumber}
                  </h1>
                  <StatusBadge type="exception" status={exception.status} />
                </div>
                <p className="text-lg text-gray-700">{exception.title}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">异常类型</p>
              <p className="font-medium text-gray-900">{typeLabels[exception.type] || exception.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">关联订单</p>
              <p className="font-medium text-gray-900">{exception.purchaseOrder.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">供应商</p>
              <p className="font-medium text-gray-900">{exception.purchaseOrder.supplier.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">零件</p>
              <p className="font-medium text-gray-900">{exception.purchaseOrder.part.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">上报人</p>
              <p className="font-medium text-gray-900">{exception.reportedBy.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">上报时间</p>
              <p className="font-medium text-gray-900">{formatDateTime(exception.createdAt)}</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">问题描述</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{exception.description}</p>
          </div>
        </div>

        {exception.inspection && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">检验数据</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">检验项目</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">规格要求</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">实测值</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">结果</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exception.inspection.inspectionItems.map((item, index) => (
                    <tr key={index} className={!item.isConforming ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3 text-gray-900">{item.itemName}</td>
                      <td className="px-4 py-3 text-gray-600">{item.specification}</td>
                      <td className="px-4 py-3 font-mono text-gray-900">{item.actualValue}</td>
                      <td className="px-4 py-3">
                        {item.isConforming ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle size={16} />
                            合格
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <AlertTriangle size={16} />
                            不合格
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
        )}

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Wrench size={20} className="text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">处置方案</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">根本原因</p>
              <p className="font-medium text-gray-900">{exception.rootCause || '待分析'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">处置方式</p>
              <p className="font-medium text-gray-900">
                {exception.disposition ? dispositionLabels[exception.disposition] : '待定'}
              </p>
            </div>
            {exception.concessionDecision && (
              <div>
                <p className="text-sm text-gray-500 mb-1">让步接收审批</p>
                <StatusBadge type="concession" status={exception.concessionDecision} />
              </div>
            )}
            {exception.reworkResponsible && (
              <div>
                <p className="text-sm text-gray-500 mb-1">返工责任方</p>
                <p className="font-medium text-gray-900">{exception.reworkResponsible}</p>
              </div>
            )}
          </div>
        </div>

        {exception.attachments.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Paperclip size={20} className="text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">附件</h2>
            </div>
            <div className="space-y-2">
              {exception.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{att.fileName}</p>
                      <p className="text-sm text-gray-500">上传人：{att.uploadedBy.name}</p>
                    </div>
                  </div>
                  <button className="text-primary-600 text-sm hover:underline">
                    下载
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare size={20} className="text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">供应商反馈</h2>
          </div>

          {exception.supplierFeedbacks.length > 0 ? (
            <div className="space-y-4">
              {exception.supplierFeedbacks.map((feedback) => (
                <div key={feedback.id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-green-600" />
                      <span className="font-medium text-green-800">{feedback.supplier.name}</span>
                    </div>
                    <span className="text-sm text-green-600">{formatDateTime(feedback.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 mb-4">{feedback.content}</p>
                  {feedback.rootCauseAnalysis && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">根本原因分析</p>
                      <p className="text-sm text-gray-600">{feedback.rootCauseAnalysis}</p>
                    </div>
                  )}
                  {feedback.correctiveAction && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">纠正措施</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{feedback.correctiveAction}</p>
                    </div>
                  )}
                  {feedback.preventiveAction && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">预防措施</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{feedback.preventiveAction}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">暂无供应商反馈</p>
          )}

          {isSupplier && needsSupplierFeedback && (
            <form onSubmit={handleSubmitFeedback} className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">提交反馈</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">反馈内容</label>
                  <textarea
                    value={feedbackForm.content}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="请描述问题处理情况..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">根本原因分析</label>
                  <textarea
                    value={feedbackForm.rootCauseAnalysis}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, rootCauseAnalysis: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="分析问题产生的根本原因..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">纠正措施</label>
                  <textarea
                    value={feedbackForm.correctiveAction}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, correctiveAction: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="针对本批次问题采取的纠正措施..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">预防措施</label>
                  <textarea
                    value={feedbackForm.preventiveAction}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, preventiveAction: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="防止类似问题再次发生的预防措施..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  {submitting ? '提交中...' : '提交反馈'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  )
}
