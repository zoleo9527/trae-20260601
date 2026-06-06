import { useState } from 'react'
import type { IncidentNote } from '@/shared/types'
import { NOTE_CATEGORY_LABELS } from '@/shared/types'
import { Link2, ChevronDown, ChevronUp, User, Clock } from 'lucide-react'

const categoryBorderStyles = {
  rescue: 'border-l-blue-500',
  medical: 'border-l-red-500',
  insurance: 'border-l-green-500',
  anomaly: 'border-l-amber-500',
}

const categoryBgStyles = {
  rescue: 'bg-blue-50',
  medical: 'bg-red-50',
  insurance: 'bg-green-50',
  anomaly: 'bg-amber-50',
}

interface NoteCardProps {
  note: IncidentNote
  referencedNote?: IncidentNote | null
  onReferenceClick?: (noteId: string) => void
}

export default function NoteCard({ note, referencedNote, onReferenceClick }: NoteCardProps) {
  const [showReferencedNote, setShowReferencedNote] = useState(false)
  const isAnomaly = note.category === 'anomaly'

  return (
    <div
      className={`border-l-4 ${categoryBorderStyles[note.category]} ${categoryBgStyles[note.category]} rounded-r-lg p-4 ${isAnomaly ? 'border border-amber-200 rounded-lg' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{note.author}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isAnomaly ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-600'} shadow-sm`}>
            {NOTE_CATEGORY_LABELS[note.category]}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          {new Date(note.created_at).toLocaleString('zh-CN')}
        </div>
      </div>
      <p className="text-sm text-slate-600 whitespace-pre-wrap">{note.content}</p>
      
      {note.referenced_note_id && (
        <div className="mt-3 pt-3 border-t border-white/50">
          <button
            onClick={() => {
              setShowReferencedNote(!showReferencedNote)
              onReferenceClick?.(note.referenced_note_id!)
            }}
            className="flex items-center gap-2 text-xs text-ice-600 hover:text-ice-700 transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>引用自备注 #{note.referenced_note_id.slice(0, 8)}</span>
            {showReferencedNote ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          
          {showReferencedNote && referencedNote && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-slate-400" />
                  <span className="text-xs font-medium text-slate-700">{referencedNote.author}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${referencedNote.category === 'anomaly' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {NOTE_CATEGORY_LABELS[referencedNote.category]}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {new Date(referencedNote.created_at).toLocaleString('zh-CN')}
                </div>
              </div>
              <p className="text-xs text-slate-600 whitespace-pre-wrap">{referencedNote.content}</p>
            </div>
          )}
          
          {showReferencedNote && !referencedNote && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500">加载中...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
