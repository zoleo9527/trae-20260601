import { X } from 'lucide-react'
import { useState } from 'react'

interface SupplementModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (content: string) => void
}

export function SupplementModal({ isOpen, onClose, onSubmit }: SupplementModalProps) {
  const [content, setContent] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!content.trim()) return
    onSubmit(content.trim())
    setContent('')
  }

  const handleClose = () => {
    setContent('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">补录内容</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请输入补录内容..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            确认补录
          </button>
        </div>
      </div>
    </div>
  )
}
