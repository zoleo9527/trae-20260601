import { useState } from 'react'
import { useStore } from '@/store'
import { MessageSquare, Paperclip, Send } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface RemarkPanelProps {
  sourceType: 'inventory' | 'screening' | 'exception'
  sourceId: string
}

export function RemarkPanel({ sourceType, sourceId }: RemarkPanelProps) {
  const [newRemark, setNewRemark] = useState('')
  const { getRemarksBySource, addRemark } = useStore()
  const remarks = getRemarksBySource(sourceType, sourceId)

  const handleSubmit = () => {
    if (!newRemark.trim()) return
    addRemark({ sourceType, sourceId, content: newRemark.trim() })
    setNewRemark('')
  }

  const roleLabels = {
    frontline: '一线员工',
    manager: '经理',
    admin: '管理员',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900">备注记录</h3>
        <span className="text-sm text-gray-500">({remarks.length}条)</span>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {remarks.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">暂无备注</p>
        ) : (
          remarks.map((remark) => (
            <div key={remark.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">{remark.authorName}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                    {roleLabels[remark.authorRole]}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {format(new Date(remark.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                </span>
              </div>
              <p className="text-sm text-gray-700">{remark.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newRemark}
          onChange={(e) => setNewRemark(e.target.value)}
          placeholder="添加备注（将同步关联到相关场次对账）"
          className="input flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button onClick={handleSubmit} className="btn-primary flex items-center gap-2">
          <Send className="w-4 h-4" />
          发送
        </button>
      </div>
    </div>
  )
}

interface AttachmentPanelProps {
  sourceType: 'inventory' | 'screening' | 'exception'
  sourceId: string
}

export function AttachmentPanel({ sourceType, sourceId }: AttachmentPanelProps) {
  const { addAttachment } = useStore()
  const [sourceData] = useStore((state) => {
    if (sourceType === 'inventory') return [state.inventoryItems.find((i) => i.id === sourceId)]
    if (sourceType === 'screening') return [state.screenings.find((s) => s.id === sourceId)]
    return [state.exceptions.find((e) => e.id === sourceId)]
  })

  const attachments = sourceData?.attachments || []

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      addAttachment({
        sourceType,
        sourceId,
        file: { name: file.name, type: file.type, size: file.size },
      })
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Paperclip className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900">附件</h3>
        <span className="text-sm text-gray-500">({attachments.length}个)</span>
      </div>

      <div className="space-y-2">
        {attachments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">暂无附件</p>
        ) : (
          attachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{att.name}</span>
                <span className="text-xs text-gray-400">({formatSize(att.size)})</span>
              </div>
              <span className="text-xs text-gray-400">{att.uploadedBy}</span>
            </div>
          ))
        )}
      </div>

      <label className="block">
        <span className="btn-secondary w-full text-center cursor-pointer flex items-center justify-center gap-2">
          <Paperclip className="w-4 h-4" />
          上传附件
        </span>
        <input type="file" className="hidden" onChange={handleFileUpload} />
      </label>
    </div>
  )
}
