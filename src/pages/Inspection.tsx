import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle,
  AlertTriangle,
  Trash2
} from 'lucide-react'
import { orderApi, inspectionApi } from '../api'
import { useAppStore } from '../store'
import type { Order, CreateInspectionRequest } from '../types'

const conditionOptions = ['正常', '轻微磨损', '有划痕', '破损', '严重损坏']

interface PhotoData {
  preview: string
  base64: string
  description: string
}

export default function Inspection() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<CreateInspectionRequest>({
    technician_id: '',
    technician_name: '',
    appearance_condition: '正常',
    screen_condition: '正常',
    battery_condition: '正常',
    accessories: '',
    description: ''
  })
  const [photos, setPhotos] = useState<PhotoData[]>([])
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
    if (currentUser.role === 'technician') {
      setFormData(prev => ({
        ...prev,
        technician_id: currentUser.id,
        technician_name: currentUser.name
      }))
    }
  }, [id, currentUser])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result as string
          setPhotos(prev => [...prev, {
            preview: result,
            base64: result,
            description: ''
          }])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const updatePhotoDescription = (index: number, description: string) => {
    setPhotos(photos.map((photo, i) => 
      i === index ? { ...photo, description } : photo
    ))
  }

  const handleSubmit = () => {
    if (!id) return
    setSubmitting(true)
    
    const photosData = photos.map(photo => ({
      base64: photo.base64,
      description: photo.description
    }))
    
    inspectionApi.create(id, { ...formData, photos: photosData }).then(() => {
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">取机质检报告</h2>
          <p className="text-blue-100 text-sm mt-1">工单: {order.id} | 客户: {order.customer_name}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">质检人</label>
              <input
                type="text"
                value={formData.technician_name}
                onChange={(e) => setFormData({ ...formData, technician_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入质检人姓名"
              />
            </div>
          </div>

          <div className="border border-gray-100 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              质检照片上传
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="space-y-2">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
                    <img src={photo.preview} alt={`质检照片 ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={photo.description}
                    onChange={(e) => updatePhotoDescription(index, e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="照片说明"
                  />
                </div>
              ))}
              <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-blue-400 transition-colors">
                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">点击上传</span>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-2">支持 JPG、PNG 格式，可多选，每张图片不超过 5MB</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">外观状态</label>
              <select
                value={formData.appearance_condition}
                onChange={(e) => setFormData({ ...formData, appearance_condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {conditionOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">屏幕状态</label>
              <select
                value={formData.screen_condition}
                onChange={(e) => setFormData({ ...formData, screen_condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {conditionOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">电池状态</label>
              <select
                value={formData.battery_condition}
                onChange={(e) => setFormData({ ...formData, battery_condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {conditionOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">配件情况</label>
            <input
              type="text"
              value={formData.accessories}
              onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：原装充电器、数据线、耳机等"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">检测说明</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="请详细描述检测结果、问题分析及维修建议..."
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">注意事项</p>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• 请如实填写检测结果，确保照片清晰可辨</li>
                  <li>• 配件情况请详细记录，避免后续纠纷</li>
                  <li>• 提交后将自动流转至店长确认售后保修</li>
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
              disabled={submitting || !formData.technician_name || !formData.description}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              {submitting ? '提交中...' : '提交质检报告'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}