import React, { useMemo, useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { useAppStore } from '../store/useAppStore'
import { OrderCard } from '../components/OrderCard'
import { OrderDetail } from '../components/OrderDetail'
import {
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  PROOF_STATUS_LABELS, PROOF_STATUS_COLORS,
  URGENCY_LABELS, URGENCY_COLORS,
  WORKSPACE_VIEWS
} from '../types'

export const DesignerView: React.FC = () => {
  const {
    orders, workspace, selectedOrder, setSelectedOrder,
    createProof, selectProofFile, loadOrderProofs, selectedOrderProofs,
    saveWorkspace
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')

  useEffect(() => {
    if (workspace?.current_view === WORKSPACE_VIEWS.DESIGNER_ALL_PROOFS) {
      setActiveTab('all')
    } else {
      setActiveTab('pending')
    }
  }, [workspace?.current_view])

  const [feedbackMap, setFeedbackMap] = useState<Record<number, string>>({})

  const pendingOrders = useMemo(() => {
    return orders.filter(o => 
      o.status === 'pending_proof' || 
      o.status === 'proof_uploaded' || 
      o.status === 'proof_rejected'
    )
  }, [orders])

  const allOrders = useMemo(() => {
    return orders.filter(o => 
      ['pending_proof', 'proof_uploaded', 'proof_rejected', 'proof_approved'].includes(o.status)
    )
  }, [orders])

  const displayOrders = activeTab === 'pending' ? pendingOrders : allOrders

  const handleUploadProof = async (orderId: number) => {
    const result = await selectProofFile()
    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      const fileName = filePath.split('/').pop()
      await createProof(orderId, filePath, fileName)
    }
  }

  const stats = useMemo(() => ({
    pending: orders.filter(o => o.status === 'pending_proof').length,
    uploaded: orders.filter(o => o.status === 'proof_uploaded').length,
    rejected: orders.filter(o => o.status === 'proof_rejected').length,
    approved: orders.filter(o => o.status === 'proof_approved').length
  }), [orders])

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-factory-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-factory-text">🎨 打样管理</h2>
            <div className="flex gap-1">
              <button
                onClick={() => { setActiveTab('pending'); saveWorkspace({ current_view: WORKSPACE_VIEWS.DESIGNER_DASHBOARD }) }}
                className={`px-3 py-1 text-xs rounded ${
                  activeTab === 'pending'
                    ? 'bg-factory-accent text-white'
                    : 'bg-factory-border text-factory-muted hover:text-white'
                }`}
              >
                待处理 ({pendingOrders.length})
              </button>
              <button
                onClick={() => { setActiveTab('all'); saveWorkspace({ current_view: WORKSPACE_VIEWS.DESIGNER_ALL_PROOFS }) }}
                className={`px-3 py-1 text-xs rounded ${
                  activeTab === 'all'
                    ? 'bg-factory-accent text-white'
                    : 'bg-factory-border text-factory-muted hover:text-white'
                }`}
              >
                全部打样 ({allOrders.length})
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="factory-card bg-yellow-500/5 border-yellow-500/30">
            <div className="text-xs text-yellow-400">待上传打样</div>
            <div className="text-xl font-bold text-yellow-400 font-mono">{stats.pending}</div>
          </div>
          <div className="factory-card bg-blue-500/5 border-blue-500/30">
            <div className="text-xs text-blue-400">待客户确认</div>
            <div className="text-xl font-bold text-blue-400 font-mono">{stats.uploaded}</div>
          </div>
          <div className="factory-card bg-red-500/5 border-red-500/30">
            <div className="text-xs text-red-400">被退回修改</div>
            <div className="text-xl font-bold text-red-400 font-mono">{stats.rejected}</div>
          </div>
          <div className="factory-card bg-green-500/5 border-green-500/30">
            <div className="text-xs text-green-400">已确认通过</div>
            <div className="text-xl font-bold text-green-400 font-mono">{stats.approved}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[420px] border-r border-factory-border overflow-y-auto p-3 space-y-3">
          {displayOrders.map(order => (
            <div key={order.id} className="relative">
              <OrderCard
                order={order}
                selected={selectedOrder?.id === order.id}
                onClick={() => setSelectedOrder(order)}
              />
              {(order.status === 'pending_proof' || order.status === 'proof_rejected') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUploadProof(order.id)
                  }}
                  className="absolute top-2 right-2 factory-btn-primary text-xs py-0.5"
                >
                  📤 上传打样
                </button>
              )}
            </div>
          ))}
          {displayOrders.length === 0 && (
            <div className="p-8 text-center text-factory-muted">
              {activeTab === 'pending' ? '🎉 没有待处理的打样任务' : '暂无打样记录'}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {selectedOrder ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-factory-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-mono text-lg font-bold text-factory-text">
                      {selectedOrder.order_no}
                    </div>
                    <div className="text-xs text-factory-muted">
                      {selectedOrder.customer_name}
                    </div>
                  </div>
                  <span className={`status-badge ${ORDER_STATUS_COLORS[selectedOrder.status]}`}>
                    {ORDER_STATUS_LABELS[selectedOrder.status]}
                  </span>
                  <span className={`urgency-badge ${URGENCY_COLORS[selectedOrder.urgency]}`}>
                    {URGENCY_LABELS[selectedOrder.urgency]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(selectedOrder.status === 'pending_proof' || selectedOrder.status === 'proof_rejected') && (
                    <button 
                      onClick={() => handleUploadProof(selectedOrder.id)}
                      className="factory-btn-primary text-xs"
                    >
                      📤 上传打样文件
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="factory-btn text-xs"
                  >
                    关闭
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="factory-card">
                  <div className="text-xs text-factory-muted mb-2">产品信息</div>
                  <div className="text-base font-semibold text-factory-text mb-3">
                    {selectedOrder.product_name}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-factory-muted">数量：</span>
                      <span className="text-factory-text font-mono">{selectedOrder.quantity.toLocaleString()} 份</span>
                    </div>
                    <div>
                      <span className="text-factory-muted">尺寸：</span>
                      <span className="text-factory-text font-mono">{selectedOrder.size} mm</span>
                    </div>
                    <div>
                      <span className="text-factory-muted">纸张：</span>
                      <span className="text-factory-text">{selectedOrder.paper_type} {selectedOrder.paper_gsm}g</span>
                    </div>
                    <div>
                      <span className="text-factory-muted">颜色：</span>
                      <span className="text-factory-text">{selectedOrder.color}</span>
                    </div>
                    <div>
                      <span className="text-factory-muted">后加工：</span>
                      <span className="text-factory-text">{selectedOrder.finish || '无'}</span>
                    </div>
                    <div>
                      <span className="text-factory-muted">交货期：</span>
                      <span className="text-factory-text font-mono">
                        {dayjs(selectedOrder.deadline).format('YYYY-MM-DD')}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="factory-card">
                    <div className="text-xs text-factory-muted mb-2">📝 备注</div>
                    <div className="text-sm text-factory-text whitespace-pre-wrap">
                      {selectedOrder.notes}
                    </div>
                  </div>
                )}

                <div className="factory-card">
                  <div className="text-xs text-factory-muted mb-3 flex items-center justify-between">
                    <span>🎨 打样版本记录 ({selectedOrderProofs.length})</span>
                    {(selectedOrder.status === 'pending_proof' || selectedOrder.status === 'proof_rejected') && (
                      <button 
                        onClick={() => handleUploadProof(selectedOrder.id)}
                        className="factory-btn-primary text-xs"
                      >
                        + 上传新版本
                      </button>
                    )}
                  </div>
                  
                  {selectedOrderProofs.length === 0 ? (
                    <div className="text-center py-8 text-factory-muted">
                      <div className="text-3xl mb-2">📁</div>
                      <div className="text-sm">还没有打样文件</div>
                      {(selectedOrder.status === 'pending_proof' || selectedOrder.status === 'proof_rejected') && (
                        <button 
                          onClick={() => handleUploadProof(selectedOrder.id)}
                          className="factory-btn-primary text-xs mt-3"
                        >
                          上传第一版打样
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedOrderProofs.map(proof => (
                        <div 
                          key={proof.id}
                          className={`p-4 rounded-lg border ${
                            proof.is_current 
                              ? 'border-factory-accent/50 bg-factory-accent/5' 
                              : 'border-factory-border bg-factory-bg'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-factory-accent font-mono">
                                V{proof.version}
                              </span>
                              {proof.is_current && (
                                <span className="text-xs px-1.5 py-0.5 bg-factory-accent/20 text-factory-accent rounded">
                                  当前版本
                                </span>
                              )}
                              <span className={`status-badge ${PROOF_STATUS_COLORS[proof.status]}`}>
                                {PROOF_STATUS_LABELS[proof.status]}
                              </span>
                            </div>
                            <span className="text-xs text-factory-muted font-mono">
                              {dayjs(proof.uploaded_at).format('YYYY-MM-DD HH:mm')}
                            </span>
                          </div>

                          {proof.file_name && (
                            <div className="flex items-center gap-2 text-sm text-factory-text mb-3 bg-factory-bg p-2 rounded">
                              <span>📄</span>
                              <span className="font-mono">{proof.file_name}</span>
                              {proof.file_path && (
                                <span className="text-xs text-factory-muted ml-auto truncate max-w-[200px]">
                                  {proof.file_path}
                                </span>
                              )}
                            </div>
                          )}

                          {proof.feedback && (
                            <div className={`text-sm p-3 rounded ${
                              proof.status === 'rejected' 
                                ? 'bg-red-500/10 border border-red-500/30 text-red-300' 
                                : 'bg-green-500/10 border border-green-500/30 text-green-300'
                            }`}>
                              <div className="text-xs opacity-70 mb-1">
                                {proof.status === 'rejected' ? '❌ 退回意见' : '✅ 确认意见'}
                              </div>
                              {proof.feedback}
                              {proof.reviewed_at && (
                                <div className="text-xs opacity-50 mt-2 font-mono">
                                  {dayjs(proof.reviewed_at).format('YYYY-MM-DD HH:mm')}
                                </div>
                              )}
                            </div>
                          )}

                          {proof.status === 'rejected' && proof.is_current && (
                            <div className="mt-3 pt-3 border-t border-factory-border">
                              <button
                                onClick={() => handleUploadProof(selectedOrder.id)}
                                className="factory-btn-primary text-xs w-full"
                              >
                                📤 上传修正版本 (V{proof.version + 1})
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-factory-muted">
              <div className="text-center">
                <div className="text-4xl mb-4">🎨</div>
                <div className="text-sm">选择左侧订单查看打样详情</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
