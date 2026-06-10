import { useState } from 'react'
import { UserCheck, Play, XCircle } from 'lucide-react'
import type { User } from '../../shared/types'

interface BatchActionsProps {
  selectedIds: number[]
  users: User[]
  onBatchAction: (action: 'assign' | 'process' | 'close', assigneeId?: number) => void
  onClear: () => void
}

export default function BatchActions({ selectedIds, users, onBatchAction, onClear }: BatchActionsProps) {
  const [assigneeId, setAssigneeId] = useState<number | null>(null)

  if (selectedIds.length === 0) return null

  return (
    <div className="fixed bottom-0 left-60 right-0 bg-park-sidebar border-t border-park-border px-6 py-3 flex items-center gap-4 z-50">
      <span className="text-sm text-park-muted">
        已选择 <span className="text-park-amber font-medium">{selectedIds.length}</span> 项
      </span>
      <button
        onClick={onClear}
        className="text-sm text-park-muted hover:text-park-text transition-colors"
      >
        取消选择
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <select
          value={assigneeId ?? ''}
          onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : null)}
          className="bg-park-bg border border-park-border rounded px-2 py-1 text-sm text-park-text outline-none focus:border-park-amber"
        >
          <option value="">选择责任人</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <button
          onClick={() => {
            if (assigneeId) onBatchAction('assign', assigneeId)
          }}
          disabled={!assigneeId}
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        >
          <UserCheck className="w-4 h-4" />
          批量分配
        </button>
        <button
          onClick={() => onBatchAction('process')}
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors"
        >
          <Play className="w-4 h-4" />
          批量处理
        </button>
        <button
          onClick={() => onBatchAction('close')}
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-gray-600 hover:bg-gray-700 text-white transition-colors"
        >
          <XCircle className="w-4 h-4" />
          批量关闭
        </button>
      </div>
    </div>
  )
}
