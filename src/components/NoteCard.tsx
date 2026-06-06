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

const categoryLabelStyles = {
  rescue: 'bg-blue-100 text-blue-700',
  medical: 'bg-red-100 text-red-700',
  insurance: 'bg-green-100 text-green-700',
  anomaly: 'bg-amber-100 text-amber-700',
}

interface NoteCardProps {
  note: IncidentNote
  referencedNotes?: IncidentNote[]
  onReferenceClick?: (noteId: string) => void
}

export default function NoteCard({ note, referencedNotes = [], onReferenceClick }: NoteCardProps) {
  const [expandedRefIds, setExpandedRefIds] = useState<Set<string>>(new Set())
  const isAnomaly = note.category === 'anomaly'

  const toggleRefExpand = (noteId: string) => {
    const newExpanded = new Set(expandedRefIds)
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId)
    } else {
      newExpanded.add(noteId)
    }
    setExpandedRefIds(newExpanded)
    onReferenceClick?.(noteId)
  }

  const getContentSummary = (content: string, maxLength: number = 50): string => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

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
      
      {referencedNotes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/50">
          <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <Link2 className="w-3.5 h-3.5" />
            <span>引用备注 ({referencedNotes.length} 条)</span>
          </div>
          <div className="space-y-2">
            {referencedNotes.map((refNote) => {
              const isExpanded = expandedRefIds.has(refNote.id)
              return (
                <div key={refNote.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleRefExpand(refNote.id)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-xs font-medium text-slate-700 truncate">{refNote.author}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${categoryLabelStyles[refNote.category]}`}>
                        {NOTE_CATEGORY_LABELS[refNote.category]}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(refNote.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>
                  <div className="px-3 pb-2">
                    <p className="text-xs text-slate-500">{getContentSummary(refNote.content)}</p>
                  </div>
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                        <Clock className="w-3 h-3" />
                        {new Date(refNote.created_at).toLocaleString('zh-CN')}
                      </div>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">{refNote.content}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
