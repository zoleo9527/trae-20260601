
import { useState } from 'react'
import { X } from 'lucide-react'
import { useTicketStore } from '../store/ticketStore'
import { TicketPriority } from '../types'

interface CreateTicketModalProps {
  isOpen: boolean
  onClose: () => void
}

const priorityOptions: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: '低优先级' },
  { value: 'medium', label: '中优先级' },
  { value: 'high', label: '高优先级' },
]

export function CreateTicketModal({ isOpen, onClose }: CreateTicketModalProps) {
  const { createTicket } = useTicketStore()
  const [formData, setFormData] = useState({
    deviceId: '',
    deviceName: '',
    description: '',
    priority: 'medium' as TicketPriority,
    remarks: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.deviceId.trim()) newErrors.deviceId = '请输入设备编号'
    if (!formData.deviceName.trim()) newErrors.deviceName = '请输入设备名称'
    if (!formData.description.trim()) newErrors.description = '请输入故障描述'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    createTicket(formData)
    setFormData({
      deviceId: '',
      deviceName: '',
      description: '',
      priority: 'medium',
      remarks: '',
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">提交故障单</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设备编号 *</label>
            <input
              type="text"
              value={formData.deviceId}
              onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
              placeholder="例如：D001"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.deviceId ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.deviceId && <p className="text-xs text-red-500 mt-1">{errors.deviceId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设备名称 *</label>
            <input
              type="text"
              value={formData.deviceName}
              onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
              placeholder="例如：彩票终端机A"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.deviceName ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.deviceName && <p className="text-xs text-red-500 mt-1">{errors.deviceName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">故障描述 *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请详细描述故障现象..."
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24 ${
                errors.description ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <div className="flex gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: option.value })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.priority === option.value
                      ? option.value === 'high'
                        ? 'bg-red-100 text-red-700 border-2 border-red-500'
                        : option.value === 'medium'
                        ? 'bg-amber-100 text-amber-700 border-2 border-amber-500'
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-500'
                      : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="其他需要说明的信息..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-16"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            提交
          </button>
        </div>
      </div>
    </div>
  )
}
