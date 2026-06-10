import { addNote } from '@/api/client'
import type { OrderNote, Role } from '@/types'
import { Send } from 'lucide-react'
import { useState } from 'react'

const roleBadge: Record<Role, { bg: string; text: string; label: string }> = {
  technician: { bg: 'bg-amber-50', text: 'text-amber-700', label: '维保技师' },
  service: { bg: 'bg-blue-50', text: 'text-blue-700', label: '客服' },
  supervisor: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: '项目主管' },
}

function formatTs(ts: string): string {
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

interface NoteSectionProps {
  notes: OrderNote[]
  orderId: string
  currentRole: Role
  onNoteAdded: () => void
}

export default function NoteSection({ notes, orderId, currentRole, onNoteAdded }: NoteSectionProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    try {
      await addNote(orderId, currentRole, trimmed)
      setContent('')
      onNoteAdded()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '添加备注失败')
    } finally {
      setLoading(false)
    }
  }

  const sorted = [...notes].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-800 mb-4">备注</h3>

      <div className="flex gap-2 mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="输入备注内容…"
          rows={2}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="self-end px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Send className="h-4 w-4" />
          添加备注
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">暂无备注</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((note) => {
            const badge = roleBadge[note.role]
            return (
              <div key={note.id} className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">{formatTs(note.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
