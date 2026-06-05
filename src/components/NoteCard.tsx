import type { IncidentNote } from '@/shared/types'
import { NOTE_CATEGORY_LABELS } from '@/shared/types'
import { Link2 } from 'lucide-react'

const categoryBorderStyles = {
  rescue: 'border-l-blue-500',
  medical: 'border-l-red-500',
  insurance: 'border-l-green-500',
  anomaly: 'border-l-orange-500',
}

const categoryBgStyles = {
  rescue: 'bg-blue-50',
  medical: 'bg-red-50',
  insurance: 'bg-green-50',
  anomaly: 'bg-orange-50',
}

interface NoteCardProps {
  note: IncidentNote
  onReferenceClick?: (noteId: string) => void
}

export default function NoteCard({ note, onReferenceClick }: NoteCardProps) {
  return (
    <div
      className={`border-l-4 ${categoryBorderStyles[note.category]} ${categoryBgStyles[note.category]} rounded-r-lg p-4`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">{note.author}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white text-slate-600 shadow-sm">
            {NOTE_CATEGORY_LABELS[note.category]}
          </span>
        </div>
        <span className="text-xs text-slate-400">
          {new Date(note.created_at).toLocaleString('zh-CN')}
        </span>
      </div>
      <p className="text-sm text-slate-600 whitespace-pre-wrap">{note.content}</p>
      {note.referenced_note_id && (
        <div className="mt-3 pt-3 border-t border-white/50 flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => onReferenceClick?.(note.referenced_note_id!)}
            className="text-xs text-ice-600 hover:text-ice-700 hover:underline"
          >
            引用自备注 #{note.referenced_note_id.slice(0, 8)}
          </button>
        </div>
      )}
    </div>
  )
}
