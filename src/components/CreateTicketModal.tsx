import { useState } from 'react'
import { X, RefreshCcw, Gift, AlertTriangle } from 'lucide-react'
import { useTicketStore } from '../store/ticketStore'
import { TicketPriority, HandoverType, ShiftCloseInfo, PrizeClaimInfo } from '../types'

interface CreateTicketModalProps {
  isOpen: boolean
  onClose: () => void
}

const priorityOptions: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: '低优先级' },
  { value: 'medium', label: '中优先级' },
  { value: 'high', label: '高优先级' },
]

const handoverOptions: { value: HandoverType; label: string; icon: typeof AlertTriangle; description: string }[] = [
  { value: 'normal_fault', label: '设备故障', icon: AlertTriangle, description: '日常使用中发现的设备故障' },
  { value: 'shift_close', label: '销售班结', icon: RefreshCcw, description: '班结时发现的设备故障' },
  { value: 'prize_claim', label: '兑奖登记', icon: Gift, description: '兑奖时发现的设备故障' },
]

const shiftPeriodOptions: { value: ShiftCloseInfo['shiftPeriod']; label: string }[] = [
  { value: 'morning', label: '早班' },
  { value: 'afternoon', label: '中班' },
  { value: 'evening', label: '晚班' },
  { value: 'night', label: '夜班' },
]

export function CreateTicketModal({ isOpen, onClose }: CreateTicketModalProps) {
  const { createTicket } = useTicketStore()
  const [formData, setFormData] = useState({
    deviceId: '',
    deviceName: '',
    description: '',
    priority: 'medium' as TicketPriority,
    remarks: '',
    handoverType: 'normal_fault' as HandoverType,
    shiftId: '',
    shiftDate: '',
    shiftPeriod: 'morning' as ShiftCloseInfo['shiftPeriod'],
    salesAmount: '',
    ticketCount: '',
    shiftRemark: '',
    claimId: '',
    claimDate: '',
    prizeLevel: '',
    prizeAmount: '',
    ticketId: '',
    deviceUsed: false,
    prizeRemark: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.deviceId.trim()) newErrors.deviceId = '请输入设备编号'
    if (!formData.deviceName.trim()) newErrors.deviceName = '请输入设备名称'
    if (!formData.description.trim()) newErrors.description = '请输入故障描述'
    
    if (formData.handoverType === 'shift_close') {
      if (!formData.shiftId.trim()) newErrors.shiftId = '请输入班结单号'
      if (!formData.shiftDate.trim()) newErrors.shiftDate = '请输入班结日期'
      if (!formData.salesAmount.trim()) newErrors.salesAmount = '请输入销售额'
    }
    
    if (formData.handoverType === 'prize_claim') {
      if (!formData.claimId.trim()) newErrors.claimId = '请输入兑奖单号'
      if (!formData.claimDate.trim()) newErrors.claimDate = '请输入兑奖日期'
      if (!formData.prizeLevel.trim()) newErrors.prizeLevel = '请输入中奖等级'
      if (!formData.prizeAmount.trim()) newErrors.prizeAmount = '请输入中奖金额'
      if (!formData.ticketId.trim()) newErrors.ticketId = '请输入彩票编号'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    
    let shiftCloseInfo: ShiftCloseInfo | undefined
    let prizeClaimInfo: PrizeClaimInfo | undefined
    
    if (formData.handoverType === 'shift_close') {
      shiftCloseInfo = {
        shiftId: formData.shiftId,
        shiftDate: formData.shiftDate,
        shiftPeriod: formData.shiftPeriod,
        salesAmount: parseFloat(formData.salesAmount) || 0,
        ticketCount: parseInt(formData.ticketCount) || 0,
        remark: formData.shiftRemark,
      }
    }
    
    if (formData.handoverType === 'prize_claim') {
      prizeClaimInfo = {
        claimId: formData.claimId,
        claimDate: formData.claimDate,
        prizeLevel: formData.prizeLevel,
        prizeAmount: parseFloat(formData.prizeAmount) || 0,
        ticketId: formData.ticketId,
        deviceUsed: formData.deviceUsed,
        remark: formData.prizeRemark,
      }
    }
    
    createTicket({
      deviceId: formData.deviceId,
      deviceName: formData.deviceName,
      description: formData.description,
      priority: formData.priority,
      remarks: formData.remarks,
      handoverType: formData.handoverType,
      shiftCloseInfo,
      prizeClaimInfo,
    })
    
    setFormData({
      deviceId: '',
      deviceName: '',
      description: '',
      priority: 'medium',
      remarks: '',
      handoverType: 'normal_fault',
      shiftId: '',
      shiftDate: '',
      shiftPeriod: 'morning',
      salesAmount: '',
      ticketCount: '',
      shiftRemark: '',
      claimId: '',
      claimDate: '',
      prizeLevel: '',
      prizeAmount: '',
      ticketId: '',
      deviceUsed: false,
      prizeRemark: '',
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
            <label className="block text-sm font-medium text-gray-700 mb-2">交接来源 *</label>
            <div className="grid grid-cols-3 gap-2">
              {handoverOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, handoverType: option.value })}
                    className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      formData.handoverType === option.value
                        ? option.value === 'shift_close'
                          ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                          : option.value === 'prize_claim'
                          ? 'bg-amber-100 text-amber-700 border-2 border-amber-500'
                          : 'bg-gray-100 text-gray-700 border-2 border-gray-500'
                        : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {handoverOptions.find(o => o.value === formData.handoverType)?.description}
            </p>
          </div>

          {formData.handoverType === 'shift_close' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                <RefreshCcw className="w-4 h-4" />
                销售班结信息
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">班结单号 *</label>
                  <input
                    type="text"
                    value={formData.shiftId}
                    onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                    placeholder="例如：BJ20240101"
                    className={`w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.shiftId ? 'border-red-500' : 'border-purple-200'
                    }`}
                  />
                  {errors.shiftId && <p className="text-xs text-red-500 mt-0.5">{errors.shiftId}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">班结日期 *</label>
                  <input
                    type="date"
                    value={formData.shiftDate}
                    onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
                    className={`w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.shiftDate ? 'border-red-500' : 'border-purple-200'
                    }`}
                  />
                  {errors.shiftDate && <p className="text-xs text-red-500 mt-0.5">{errors.shiftDate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">班次 *</label>
                  <select
                    value={formData.shiftPeriod}
                    onChange={(e) => setFormData({ ...formData, shiftPeriod: e.target.value as ShiftCloseInfo['shiftPeriod'] })}
                    className="w-full border border-purple-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {shiftPeriodOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">销售额 *</label>
                  <input
                    type="number"
                    value={formData.salesAmount}
                    onChange={(e) => setFormData({ ...formData, salesAmount: e.target.value })}
                    placeholder="例如：5000"
                    className={`w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.salesAmount ? 'border-red-500' : 'border-purple-200'
                    }`}
                  />
                  {errors.salesAmount && <p className="text-xs text-red-500 mt-0.5">{errors.salesAmount}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">彩票数量</label>
                  <input
                    type="number"
                    value={formData.ticketCount}
                    onChange={(e) => setFormData({ ...formData, ticketCount: e.target.value })}
                    placeholder="例如：100"
                    className="w-full border border-purple-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">班结异常说明</label>
                <textarea
                  value={formData.shiftRemark}
                  onChange={(e) => setFormData({ ...formData, shiftRemark: e.target.value })}
                  placeholder="班结过程中发现的异常情况..."
                  className="w-full border border-purple-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-16"
                />
              </div>
            </div>
          )}

          {formData.handoverType === 'prize_claim' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                兑奖登记信息
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">兑奖单号 *</label>
                  <input
                    type="text"
                    value={formData.claimId}
                    onChange={(e) => setFormData({ ...formData, claimId: e.target.value })}
                    placeholder="例如：DJ20240101"
                    className={`w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      errors.claimId ? 'border-red-500' : 'border-amber-200'
                    }`}
                  />
                  {errors.claimId && <p className="text-xs text-red-500 mt-0.5">{errors.claimId}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">兑奖日期 *</label>
                  <input
                    type="date"
                    value={formData.claimDate}
                    onChange={(e) => setFormData({ ...formData, claimDate: e.target.value })}
                    className={`w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      errors.claimDate ? 'border-red-500' : 'border-amber-200'
                    }`}
                  />
                  {errors.claimDate && <p className="text-xs text-red-500 mt-0.5">{errors.claimDate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">中奖等级 *</label>
                  <input
                    type="text"
                    value={formData.prizeLevel}
                    onChange={(e) => setFormData({ ...formData, prizeLevel: e.target.value })}
                    placeholder="例如：一等奖"
                    className={`w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      errors.prizeLevel ? 'border-red-500' : 'border-amber-200'
                    }`}
                  />
                  {errors.prizeLevel && <p className="text-xs text-red-500 mt-0.5">{errors.prizeLevel}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">中奖金额 *</label>
                  <input
                    type="number"
                    value={formData.prizeAmount}
                    onChange={(e) => setFormData({ ...formData, prizeAmount: e.target.value })}
                    placeholder="例如：10000"
                    className={`w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      errors.prizeAmount ? 'border-red-500' : 'border-amber-200'
                    }`}
                  />
                  {errors.prizeAmount && <p className="text-xs text-red-500 mt-0.5">{errors.prizeAmount}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">彩票编号 *</label>
                  <input
                    type="text"
                    value={formData.ticketId}
                    onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                    placeholder="例如：CP20240101001"
                    className={`w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      errors.ticketId ? 'border-red-500' : 'border-amber-200'
                    }`}
                  />
                  {errors.ticketId && <p className="text-xs text-red-500 mt-0.5">{errors.ticketId}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.deviceUsed}
                    onChange={(e) => setFormData({ ...formData, deviceUsed: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <label className="text-xs font-medium text-amber-700">使用设备兑奖</label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-700 mb-1">兑奖异常说明</label>
                <textarea
                  value={formData.prizeRemark}
                  onChange={(e) => setFormData({ ...formData, prizeRemark: e.target.value })}
                  placeholder="兑奖过程中发现的异常情况..."
                  className="w-full border border-amber-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none h-16"
                />
              </div>
            </div>
          )}

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