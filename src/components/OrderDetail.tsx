import React, { useState } from 'react'
import dayjs from 'dayjs'
import { useAppStore } from '../store/useAppStore'
import { 
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, 
  URGENCY_LABELS, URGENCY_COLORS,
  PROOF_STATUS_LABELS, PROOF_STATUS_COLORS,
  OrderStatus
} from '../types'

export const OrderDetail: React.FC = () => {
  const { 
    selectedOrder, selectedOrderProofs, currentUser,
    updateOrderStatus, createProof, reviewProof, selectProofFile,
    updateOrder, setSelectedOrder, quoteResult, clearQuoteResult
  } = useAppStore()
  
  const [statusNote, setStatusNote] = useState('')
  const [reviewFeedback, setReviewFeedback] = useState('')

  if (!selectedOrder) {
    return (
      <div className="h-full flex items-center justify-center text-factory-muted">
        <div className="text-center">
          <div className="text-4xl mb-4">📋</div>
          <div className="text-sm">选择左侧订单查看详情</div>
        </div>
      </div>
    )
  }

  const handleStatusChange = async (newStatus: OrderStatus) => {
    const note = statusNote.trim() || undefined
    const success = await updateOrderStatus(selectedOrder.id, newStatus, note)
    if (success) {
      setStatusNote('')
    }
  }

  const handleUploadProof = async () => {
    const result = await selectProofFile()
    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      const fileName = filePath.split('/').pop()
      await createProof(selectedOrder.id, filePath, fileName)
    }
  }

  const handleReviewProof = async (proofId: number, status: 'approved' | 'rejected') => {
    const feedback = reviewFeedback.trim() || undefined
    await reviewProof(proofId, status, feedback)
    setReviewFeedback('')
  }

  const nextStatuses: OrderStatus[] = []
  if (selectedOrder.status === 'pending_quote') nextStatuses.push('quoted')
  if (selectedOrder.status === 'quoted') nextStatuses.push('customer_approved')
  if (selectedOrder.status === 'customer_approved') nextStatuses.push('pending_proof')
  if (selectedOrder.status === 'pending_proof') nextStatuses.push('proof_uploaded')
  if (selectedOrder.status === 'proof_uploaded') nextStatuses.push('proof_approved', 'proof_rejected')
  if (selectedOrder.status === 'proof_rejected') nextStatuses.push('proof_uploaded')
  if (selectedOrder.status === 'proof_approved') nextStatuses.push('pending_schedule')
  if (selectedOrder.status === 'pending_schedule') nextStatuses.push('scheduled')
  if (selectedOrder.status === 'scheduled') nextStatuses.push('in_production')
  if (selectedOrder.status === 'in_production') nextStatuses.push('completed')

  return (
    <div className="h-full flex flex-col bg-factory-bg">
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
        <button 
          onClick={() => setSelectedOrder(null)}
          className="factory-btn text-xs"
        >
          关闭
        </button>
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

        {selectedOrder.quote_amount && selectedOrder.quote_amount > 0 && (
          <div className="factory-card border-factory-accent/50">
            <div className="text-xs text-factory-muted mb-2">💰 报价信息</div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-factory-accent font-mono">
                  ¥{selectedOrder.quote_amount.toLocaleString()}
                </div>
                <div className="text-xs text-factory-muted mt-1">
                  单价: ¥{(selectedOrder.quote_amount / selectedOrder.quantity).toFixed(3)}
                </div>
              </div>
              {selectedOrder.quote_note && (
                <div className="text-xs text-factory-muted max-w-[200px] text-right">
                  {selectedOrder.quote_note}
                </div>
              )}
            </div>
          </div>
        )}

        {quoteResult && (
          <div className="factory-card border-blue-500/30 bg-blue-500/5">
            <div className="text-xs text-blue-400 mb-3 font-medium">🧮 报价明细</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-factory-muted">开机费：</span>
                <span className="text-factory-text font-mono">¥{quoteResult.base_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-factory-muted">纸张费用：</span>
                <span className="text-factory-text font-mono">¥{quoteResult.paper_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-factory-muted">印刷费用：</span>
                <span className="text-factory-text font-mono">¥{quoteResult.printing_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-factory-muted">后加工：</span>
                <span className="text-factory-text font-mono">¥{quoteResult.finish_cost.toFixed(2)}</span>
              </div>
              {quoteResult.urgency_surcharge > 0 && (
                <div className="flex justify-between text-orange-400">
                  <span>加急费：</span>
                  <span className="font-mono">¥{quoteResult.urgency_surcharge.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-factory-border pt-2 mt-2">
                <div className="flex justify-between text-base font-bold">
                  <span className="text-factory-text">总计：</span>
                  <span className="text-factory-accent font-mono">¥{quoteResult.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-factory-muted mt-1">
                  <span>单价：</span>
                  <span className="font-mono">¥{quoteResult.unit_price.toFixed(3)}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-factory-border flex justify-end gap-2">
              <button onClick={clearQuoteResult} className="factory-btn text-xs">
                关闭
              </button>
              <button 
                onClick={async () => {
                  await updateOrder(selectedOrder.id, {
                    quote_amount: quoteResult.total,
                    quote_note: '系统自动计算'
                  })
                  clearQuoteResult()
                }}
                className="factory-btn-primary text-xs"
              >
                应用此报价
              </button>
            </div>
          </div>
        )}

        {selectedOrder.notes && (
          <div className="factory-card">
            <div className="text-xs text-factory-muted mb-2">📝 备注</div>
            <div className="text-sm text-factory-text whitespace-pre-wrap">
              {selectedOrder.notes}
            </div>
          </div>
        )}

        {selectedOrderProofs.length > 0 && (
          <div className="factory-card">
            <div className="text-xs text-factory-muted mb-3 flex items-center justify-between">
              <span>🎨 打样版本 ({selectedOrderProofs.length})</span>
              {currentUser?.role === 'designer' && (
                <button onClick={handleUploadProof} className="factory-btn text-xs">
                  + 上传新版本
                </button>
              )}
            </div>
            <div className="space-y-3">
              {selectedOrderProofs.map(proof => (
                <div 
                  key={proof.id} 
                  className={`p-3 rounded-lg border ${
                    proof.is_current ? 'border-factory-accent/50 bg-factory-accent/5' : 'border-factory-border bg-factory-bg'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-factory-accent font-mono">
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
                      {dayjs(proof.uploaded_at).format('MM-DD HH:mm')}
                    </span>
                  </div>
                  {proof.file_name && (
                    <div className="text-sm text-factory-text mb-2">
                      📄 {proof.file_name}
                    </div>
                  )}
                  {proof.feedback && (
                    <div className="text-xs text-factory-text bg-factory-bg p-2 rounded border border-factory-border">
                      💬 {proof.feedback}
                    </div>
                  )}
                  {proof.status === 'uploaded' && currentUser?.role === 'sales' && (
                    <div className="mt-3 pt-3 border-t border-factory-border">
                      <textarea
                        value={reviewFeedback}
                        onChange={e => setReviewFeedback(e.target.value)}
                        placeholder="审核意见（可选）"
                        className="factory-input text-xs mb-2"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleReviewProof(proof.id, 'rejected')}
                          className="factory-btn-danger text-xs"
                        >
                          ❌ 退回
                        </button>
                        <button
                          onClick={() => handleReviewProof(proof.id, 'approved')}
                          className="factory-btn-success text-xs"
                        >
                          ✅ 确认
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedOrderProofs.length === 0 && currentUser?.role === 'designer' && 
          selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
          <div className="factory-card border-dashed border-factory-border text-center py-6">
            <div className="text-3xl mb-2">📁</div>
            <div className="text-sm text-factory-muted mb-3">还没有打样文件</div>
            <button onClick={handleUploadProof} className="factory-btn-primary text-xs">
              上传第一版打样
            </button>
          </div>
        )}

        {nextStatuses.length > 0 && (
          <div className="factory-card border-green-500/30">
            <div className="text-xs text-green-400 mb-3">🔄 状态流转</div>
            <textarea
              value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
              placeholder="状态变更备注（可选）"
              className="factory-input text-xs mb-3"
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`factory-btn text-xs ${ORDER_STATUS_COLORS[status]} hover:opacity-80`}
                >
                  → {ORDER_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="factory-card">
          <div className="text-xs text-factory-muted mb-2">系统信息</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-factory-muted">
            <div>创建时间：{dayjs(selectedOrder.created_at).format('YYYY-MM-DD HH:mm')}</div>
            <div>更新时间：{dayjs(selectedOrder.updated_at).format('YYYY-MM-DD HH:mm')}</div>
            {selectedOrder.quoted_at && (
              <div>报价时间：{dayjs(selectedOrder.quoted_at).format('YYYY-MM-DD HH:mm')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
