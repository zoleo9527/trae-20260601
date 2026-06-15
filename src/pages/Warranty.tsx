import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  CheckCircle,
  AlertTriangle,
  Shield,
  FileText
} from 'lucide-react'
import { orderApi, warrantyApi } from '../api'
import { useAppStore } from '../store'
import type { Order, CreateWarrantyRequest } from '../types'

const warrantyTypes = ['厂家保修', '店铺保修', '付费维修', '客户自费']
const responsibilityOptions = ['厂家负责', '店铺负责', '客户自理', '协商解决']

export default function Warranty() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<CreateWarrantyRequest>({
    manager_id: '',
    manager_name: '',
    warranty_type: '厂家保修',
    warranty_period: 90,
    responsibility: '厂家负责'
  })
  const [submitting, setSubmitting] = useState(false)
  const currentUser = useAppStore(state => state.currentUser)
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      orderApi.getById(id).then(data => {
        setOrder(data)
        setLoading(false)
      })
    }
    if (currentUser.role === 'manager') {
      setFormData(prev => ({
        ...prev,
        manager_id: currentUser.id,
        manager_name: currentUser.name
      }))
    }
  }, [id, currentUser])

  const handleSubmit = () => {
    if (!id) return
    setSubmitting(true)
    warrantyApi.create(id, formData).then(() => {
      navigate(`/orders/${id}`)
    }).finally(() => {
      setSubmitting(false)
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>
  }

  if (!order) {
    return <div className="flex items-center justify-center h-64">工单不存在</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/orders/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回工单详情
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">售后保修确认</h2>
          <p className="text-orange-100 text-sm mt-1">工单: {order.id} | 客户: {order.customer_name}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="border border-gray-100 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              质检报告摘要
            </h4>
            {order.inspection ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">质检人</span>
                  <span className="text-gray-700">{order.inspection.technician_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">外观状态</span>
                  <span className="text-gray-700">{order.inspection.appearance_condition}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">屏幕状态</span>
                  <span className="text-gray-700">{order.inspection.screen_condition}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">电池状态</span>
                  <span className="text-gray-700">{order.inspection.battery_condition}</span>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-gray-500 text-sm mb-1">检测说明</p>
                  <p className="text-gray-700 text-sm">{order.inspection.description}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">暂无质检报告，请先完成质检</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认人</label>
              <input
                type="text"
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入确认人姓名"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">保修类型</label>
              <select
                value={formData.warranty_type}
                onChange={(e) => setFormData({ ...formData, warranty_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {warrantyTypes.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">保修期限（天）</label>
              <input
                type="number"
                value={formData.warranty_period}
                onChange={(e) => setFormData({ ...formData, warranty_period: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">责任划分</label>
            <select
              value={formData.responsibility}
              onChange={(e) => setFormData({ ...formData, responsibility: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {responsibilityOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">保修条款确认</p>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• 保修期限自维修完成之日起计算</li>
                  <li>• 保修期内非人为损坏可享受免费维修</li>
                  <li>• 责任划分将作为后续争议处理的依据</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">重要提示</p>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• 请仔细核对质检报告内容</li>
                  <li>• 责任划分需与客户沟通确认</li>
                  <li>• 确认后工单将进入维修阶段</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={() => navigate(`/orders/${id}`)}
              className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !formData.manager_name || !formData.warranty_period}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              {submitting ? '确认中...' : '确认售后保修'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}