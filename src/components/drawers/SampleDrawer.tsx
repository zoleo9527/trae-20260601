import { useState } from 'react'
import { 
  X, Thermometer, MapPin, Package, Clock, User, FileText, 
  Check, Image, Eye, GraduationCap, ChefHat, Loader2 
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { formatDateTime, cn, roleConfig } from '../../utils'
import { StatusBadge } from '../StatusBadge'
import { SampleStatus } from '../../types'

export function SampleDrawer() {
  const { 
    selectedPurchaseId, 
    purchaseOrders, 
    setActiveDrawer, 
    submitSample, 
    confirmSample,
    currentUser,
    loading
  } = useStore()
  
  const purchase = purchaseOrders.find(p => p.id === selectedPurchaseId)
  
  const [formData, setFormData] = useState({
    sampleTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
    sampleQuantity: '',
    storageLocation: '',
    temperature: '4°C',
    remark: '',
    status: 'completed' as SampleStatus
  })
  const [confirmRemark, setConfirmRemark] = useState('')
  const sampleRecord = purchase?.sampleRecord
  const needsTeacherConfirm = purchase?.status === 'sample_completed' && currentUser.role === 'teacher'

  if (!purchase) return null

  const handleSubmit = () => {
    if (!formData.sampleQuantity || !formData.storageLocation) return
    submitSample(purchase.id, formData)
  }

  const handleConfirm = () => {
    confirmSample(purchase.id, confirmRemark)
  }

  const handleClose = () => {
    setActiveDrawer(null)
  }

  return (
    <>
      <div className="drawer-overlay" onClick={handleClose} />
      <div className="drawer-panel">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {needsTeacherConfirm ? '班主任确认留样' : sampleRecord ? '留样登记回看' : '留样登记'}
              </h3>
              <p className="text-sm text-gray-500">{purchase.orderNo}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">{purchase.supplierName}</span>
              <StatusBadge status={purchase.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>配送: {formatDateTime(purchase.deliveryTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>采购员: {purchase.purchaserName}</span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              留样物品
            </h4>
            <div className="space-y-2">
              {purchase.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      批次 {item.batchNumber} · 生产日期 {item.productionDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{item.quantity}{item.unit}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {sampleRecord ? (
            <div className="card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  留样记录
                </h4>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', roleConfig['admin'].color)}>
                  <ChefHat className="w-3 h-3 inline mr-1" />
                  食堂管理员登记
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">留样时间</div>
                  <div className="font-medium text-gray-900">{formatDateTime(sampleRecord.sampleTime)}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">留样量</div>
                  <div className="font-medium text-gray-900">{sampleRecord.sampleQuantity}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">存放位置</div>
                  <div className="font-medium text-gray-900">{sampleRecord.storageLocation}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">存储温度</div>
                  <div className="font-medium text-gray-900">{sampleRecord.temperature || '-'}</div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">留样人</div>
                <div className="font-medium text-gray-900">{sampleRecord.operatorName}</div>
              </div>

              {sampleRecord.remark && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">备注</div>
                  <div className="text-gray-900">{sampleRecord.remark}</div>
                </div>
              )}

              {sampleRecord.confirmedAt && (
                <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                  <div className="flex items-center gap-2 text-teal-700 font-medium mb-1">
                    <GraduationCap className="w-4 h-4" />
                    班主任已确认
                  </div>
                  <div className="text-sm text-teal-600">
                    {sampleRecord.confirmedByName} · {formatDateTime(sampleRecord.confirmedAt)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-4 space-y-4">
              <h4 className="font-medium text-gray-900">填写留样信息</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Clock className="w-4 h-4 inline mr-1.5" />
                    留样时间
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.sampleTime.replace(' ', 'T')}
                    onChange={(e) => setFormData({ ...formData, sampleTime: e.target.value.replace('T', ' ') })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Package className="w-4 h-4 inline mr-1.5" />
                    留样量 *
                  </label>
                  <input
                    type="text"
                    value={formData.sampleQuantity}
                    onChange={(e) => setFormData({ ...formData, sampleQuantity: e.target.value })}
                    placeholder="如：各200g"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <MapPin className="w-4 h-4 inline mr-1.5" />
                    存放位置 *
                  </label>
                  <select
                    value={formData.storageLocation}
                    onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                    className="input"
                  >
                    <option value="">请选择</option>
                    <option value="食堂冷藏留样柜A区">食堂冷藏留样柜A区</option>
                    <option value="食堂冷藏留样柜B区">食堂冷藏留样柜B区</option>
                    <option value="食堂冷藏留样柜C区">食堂冷藏留样柜C区</option>
                    <option value="专用冷冻留样柜">专用冷冻留样柜</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Thermometer className="w-4 h-4 inline mr-1.5" />
                    存储温度
                  </label>
                  <select
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    className="input"
                  >
                    <option value="0°C">0°C</option>
                    <option value="2°C">2°C</option>
                    <option value="4°C">4°C（推荐）</option>
                    <option value="6°C">6°C</option>
                    <option value="8°C">8°C</option>
                    <option value="-18°C">-18°C（冷冻）</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="如有特殊情况请备注..."
                  className="textarea h-20"
                />
              </div>
            </div>
          )}

          {needsTeacherConfirm && (
            <div className="card p-4 space-y-4 border-purple-200 bg-purple-50">
              <h4 className="font-medium text-purple-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                班主任确认
              </h4>
              <p className="text-sm text-purple-700">
                请确认以上留样信息是否完整、规范。确认后该单流程结束。
              </p>
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-1.5">
                  确认意见（可选）
                </label>
                <textarea
                  value={confirmRemark}
                  onChange={(e) => setConfirmRemark(e.target.value)}
                  placeholder="输入确认意见或备注..."
                  className="textarea h-20 bg-white"
                />
              </div>
            </div>
          )}

          {needsTeacherConfirm && (
            <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-teal-900">确认后流程结束</p>
                  <p className="text-sm text-teal-700 mt-1">
                    操作人：{currentUser.name}（班主任）
                  </p>
                </div>
              </div>
            </div>
          )}

          {!sampleRecord && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-emerald-900">留样登记完成后，将通知班主任确认</p>
                  <p className="text-sm text-emerald-700 mt-1">
                    操作人：{currentUser.name}（食堂管理员）
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              操作人：{currentUser.name}
              <span className={cn('ml-1.5 px-1.5 py-0.5 rounded text-xs', roleConfig[currentUser.role].color)}>
                {roleConfig[currentUser.role].label}
              </span>
            </p>
            <div className="flex items-center gap-3">
              <button onClick={handleClose} className="btn-secondary">
                关闭
              </button>
              {!sampleRecord && currentUser.role === 'admin' && (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.sampleQuantity || !formData.storageLocation}
                  className="btn-success"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />处理中...</>
                  ) : '确认留样'}
                </button>
              )}
              {needsTeacherConfirm && (
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />处理中...</>
                  ) : (
                    <><Check className="w-4 h-4 mr-1.5" />确认留样</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
