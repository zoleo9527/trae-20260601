import { useState } from 'react'
import { X } from 'lucide-react'
import { useReturnStore } from '@/store/returnStore'

interface CreateReturnDrawerProps {
  open: boolean
  onClose: () => void
}

export default function CreateReturnDrawer({ open, onClose }: CreateReturnDrawerProps) {
  const [trackingNo, setTrackingNo] = useState('')
  const [reason, setReason] = useState('')
  const [remark, setRemark] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const createReturn = useReturnStore((s) => s.createReturn)

  const handleSubmit = async () => {
    if (!trackingNo.trim() || !reason.trim()) {
      setError('运单号和退回原因不能为空')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createReturn({
        trackingNo: trackingNo.trim(),
        reason: reason.trim(),
        remark: remark.trim() || undefined,
      })
      setTrackingNo('')
      setReason('')
      setRemark('')
      onClose()
    } catch (e: any) {
      setError(e.message || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">登记退回件</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">运单号</label>
            <input
              type="text"
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              placeholder="请输入运单号"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">退回原因</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请输入退回原因"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">备注</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="选填备注信息"
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '提交中...' : '提交登记'}
          </button>
        </div>
      </div>
    </>
  )
}
