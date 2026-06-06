import { useState } from 'react'
import { X, FileUp, Package, Clock, User, Upload, FileText, AlertCircle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { formatDateTime, cn } from '../../utils'
import { StatusBadge } from '../StatusBadge'

export function ResubmitDrawer() {
  const { 
    selectedPurchaseId, 
    purchaseOrders, 
    setActiveDrawer, 
    resubmitAcceptance, 
    currentUser,
    loading
  } = useStore()
  
  const [remark, setRemark] = useState('')
  const purchase = purchaseOrders.find(p => p.id === selectedPurchaseId)

  if (!purchase) return null

  const handleSubmit = () => {
    resubmitAcceptance(purchase.id, remark)
  }

  const handleClose = () => {
    setActiveDrawer(null)
    setRemark('')
  }

  const lastSupplementRequest = purchase.exceptions.find(e => e.type === 'supplement')

  return (
    <>
      <div className="drawer-overlay" onClick={handleClose} />
      <div className="drawer-panel">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <FileUp className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">补录材料并重新提交</h3>
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
            {purchase.resubmitCount > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span>第 {purchase.resubmitCount + 1} 次提交验收</span>
              </div>
            )}
          </div>

          <div className="card p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              采购明细
            </h4>
            <div className="space-y-2">
              {purchase.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.specification} · 批次 {item.batchNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{item.quantity}{item.unit}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {lastSupplementRequest && (
            <div className="card p-4 border-orange-200 bg-orange-50">
              <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                需要补充的材料
              </h4>
              <p className="text-orange-800 text-sm">{lastSupplementRequest.description}</p>
              <p className="text-orange-600 text-xs mt-2">
                要求人：{lastSupplementRequest.initiatorName} · {formatDateTime(lastSupplementRequest.createdAt)}
              </p>
            </div>
          )}

          {purchase.acceptanceRecords.length > 0 && (
            <div className="card p-4">
              <h4 className="font-medium text-gray-900 mb-3">验收历史</h4>
              <div className="space-y-3">
                {purchase.acceptanceRecords.map((record) => (
                  <div key={record.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      record.action === 'accept' ? 'bg-green-100' :
                      record.action === 'reject' ? 'bg-red-100' : 'bg-orange-100'
                    )}>
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{record.operatorName}</span>
                        <span className="text-xs text-gray-500">{formatDateTime(record.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {record.action === 'accept' ? '验收通过' :
                         record.action === 'reject' ? '验收驳回' : '要求补充材料'}
                      </p>
                      {record.remark && (
                        <p className="text-sm text-gray-500 mt-1">{record.remark}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4 space-y-4">
            <h4 className="font-medium text-gray-900">补充材料</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="w-4 h-4 inline mr-1.5" />
                上传补充文件
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <button className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-cyan-400 hover:text-cyan-600 transition-colors">
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">上传图片/文件</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                补充说明 *
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="请说明补充了哪些材料，或需要说明的情况..."
                className="textarea h-28"
              />
            </div>
          </div>

          <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <FileUp className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <p className="font-medium text-cyan-900">提交后将重新进入验收流程</p>
                <p className="text-sm text-cyan-700 mt-1">
                  提交人：{currentUser.name}（采购员）→ 处理人：张管理（食堂管理员）
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              操作人：{currentUser.name}（采购员）
            </p>
            <div className="flex items-center gap-3">
              <button onClick={handleClose} className="btn-secondary">
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !remark.trim()}
                className="btn-primary"
              >
                <FileUp className="w-4 h-4 mr-1.5" />
                {loading ? '提交中...' : '提交重新验收'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
